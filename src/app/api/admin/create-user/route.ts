import { NextRequest, NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: NextRequest) {
  // Verify caller is superadmin or admin
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
    email:     string;
    password:  string;
    full_name: string;
    staff_id:  string;
    role:      string;
    phone?:    string;
  };

  // Admin client (bypasses RLS)
  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceKey,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  // Create Auth user
  const { data: newUserData, error: authErr } = await admin.auth.admin.createUser({
    email:          body.email,
    password:       body.password,
    email_confirm:  true,
  });

  if (authErr || !newUserData.user) {
    return NextResponse.json({ error: authErr?.message ?? "Failed to create auth user" }, { status: 400 });
  }

  const uid = newUserData.user.id;

  // Insert profile
  const { error: profileErr } = await admin.from("profiles").insert({
    id:        uid,
    email:     body.email,
    full_name: body.full_name,
    staff_id:  body.staff_id,
    role:      body.role ?? "user",
    phone:     body.phone ?? null,
    is_active: true,
  });

  if (profileErr) {
    // Rollback: delete auth user
    await admin.auth.admin.deleteUser(uid);
    return NextResponse.json({ error: profileErr.message }, { status: 500 });
  }

  // Seed leave balance for current year
  const year = new Date().getFullYear();
  await admin.from("leave_balances").insert({
    officer_id:  uid,
    year,
    total_days:  25,
    used_days:   0,
    pending_days: 0,
  });

  return NextResponse.json({ ok: true, id: uid });
}
