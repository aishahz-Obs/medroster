import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// This route sends email notifications via Resend.
// Set RESEND_API_KEY and EMAIL_FROM in .env.local (and Vercel env vars).

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Only admins/superadmins can trigger notifications
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profileRaw } = await (supabase.from("profiles") as any)
    .select("role").eq("id", user.id).single();
  const profile = profileRaw as { role: string } | null;
  if (!profile || profile.role === "user") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json() as {
    to: string | string[];
    subject: string;
    html: string;
  };

  const apiKey = process.env.RESEND_API_KEY;
  const from   = process.env.EMAIL_FROM ?? "MedRoster <noreply@yourhospital.gov.my>";

  if (!apiKey || apiKey === "re_placeholder") {
    // No key configured — log but don't error (graceful degradation)
    console.warn("[notify] RESEND_API_KEY not configured — email skipped");
    return NextResponse.json({ ok: true, skipped: true });
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      from,
      to:      Array.isArray(body.to) ? body.to : [body.to],
      subject: body.subject,
      html:    body.html,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error("[notify] Resend error:", err);
    return NextResponse.json({ error: "Email send failed" }, { status: 502 });
  }

  const data = await res.json();
  return NextResponse.json({ ok: true, id: data.id });
}
