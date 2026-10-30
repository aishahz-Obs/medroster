import { NextRequest, NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";

export async function DELETE(req: NextRequest) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Only superadmin can delete officers
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: me } = await (supabase.from("profiles") as any)
    .select("role").eq("id", user.id).single();
  if (!me || me.role !== "superadmin") {
    return NextResponse.json({ error: "Only superadmin can delete officers" }, { status: 403 });
  }

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    return NextResponse.json({ error: "Service role key not configured" }, { status: 500 });
  }

  const { id } = await req.json() as { id: string };

  // Prevent deleting yourself
  if (id === user.id) {
    return NextResponse.json({ error: "You cannot delete your own account" }, { status: 400 });
  }

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceKey,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  // Delete profile first (roster/attendance records stay — officer_id becomes an orphan but data is preserved)
  await admin.from("profiles").delete().eq("id", id);

  // Delete auth user (this revokes all sessions)
  const { error } = await admin.auth.admin.deleteUser(id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
