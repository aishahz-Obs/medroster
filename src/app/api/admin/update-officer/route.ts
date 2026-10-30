import { NextRequest, NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";

export async function PATCH(req: NextRequest) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: me } = await (supabase.from("profiles") as any)
    .select("role").eq("id", user.id).single();
  if (!me || !["superadmin", "admin"].includes(me.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    return NextResponse.json({ error: "Service role key not configured" }, { status: 500 });
  }

  const body = await req.json() as {
    id:        string;
    full_name: string;
    email:     string;
    staff_id:  string;
    role:      string;
    phone:     string | null;
    is_active: boolean;
  };

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceKey,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  // Update auth email if changed
  const { data: currentProfile } = await admin
    .from("profiles")
    .select("email")
    .eq("id", body.id)
    .single();

  if (currentProfile && currentProfile.email !== body.email) {
    const { error: authErr } = await admin.auth.admin.updateUserById(body.id, {
      email: body.email,
    });
    if (authErr) return NextResponse.json({ error: authErr.message }, { status: 400 });
  }

  // Update profile row
  const { error } = await admin.from("profiles").update({
    full_name:  body.full_name,
    email:      body.email,
    staff_id:   body.staff_id,
    role:       body.role,
    phone:      body.phone,
    is_active:  body.is_active,
    updated_at: new Date().toISOString(),
  }).eq("id", body.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
