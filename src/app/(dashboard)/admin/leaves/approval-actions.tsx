"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { CheckCircle, XCircle, ExternalLink } from "lucide-react";

interface Props {
  requestId:    string;
  evidencePath: string | null;
  isSuperadmin: boolean;
}

export function ApprovalActions({ requestId, evidencePath, isSuperadmin }: Props) {
  const router   = useRouter();
  const supabase = createClient();

  const [showReject, setShowReject] = useState(false);
  const [notes,      setNotes]      = useState("");
  const [loading,    setLoading]    = useState(false);

  async function approve() {
    setLoading(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from("leave_requests") as any)
      .update({ status: "approved", reviewed_at: new Date().toISOString() })
      .eq("id", requestId);

    // Audit
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from("audit_logs") as any).insert({
        actor_id:    user.id,
        action:      "approve_leave",
        target_type: "leave_request",
        target_id:   requestId,
        new_values:  { status: "approved" },
      });
    }
    router.refresh();
    setLoading(false);
  }

  async function reject() {
    setLoading(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from("leave_requests") as any)
      .update({ status: "rejected", reviewed_at: new Date().toISOString(), review_notes: notes || null })
      .eq("id", requestId);

    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from("audit_logs") as any).insert({
        actor_id:    user.id,
        action:      "reject_leave",
        target_type: "leave_request",
        target_id:   requestId,
        new_values:  { status: "rejected", review_notes: notes },
      });
    }
    router.refresh();
    setLoading(false);
    setShowReject(false);
  }

  async function viewEvidence() {
    if (!evidencePath) return;
    const { data } = await supabase.storage.from("leave-evidence").createSignedUrl(evidencePath, 300);
    if (data?.signedUrl) window.open(data.signedUrl, "_blank");
  }

  return (
    <div className="flex flex-col gap-2 items-end flex-shrink-0">
      {evidencePath && (
        <button
          onClick={viewEvidence}
          className="flex items-center gap-1 text-xs text-brand-600 hover:underline font-medium"
        >
          <ExternalLink size={12} />
          View evidence
        </button>
      )}

      {!showReject ? (
        <div className="flex gap-2">
          <button
            onClick={() => setShowReject(true)}
            disabled={loading}
            className="flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-lg
                       border border-red-300 text-red-600 hover:bg-red-50 transition-colors"
          >
            <XCircle size={14} />
            Reject
          </button>
          <button
            onClick={approve}
            disabled={loading}
            className="flex items-center gap-1.5 text-sm font-semibold px-3 py-1.5 rounded-lg
                       bg-teal-600 hover:bg-teal-700 text-white transition-colors disabled:opacity-60"
          >
            <CheckCircle size={14} />
            Approve
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-2 w-full min-w-[220px]">
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Rejection reason (optional)"
            rows={2}
            className="text-sm rounded-lg border border-gray-300 px-2.5 py-2 resize-none
                       focus:outline-none focus:ring-2 focus:ring-red-400"
          />
          <div className="flex gap-2">
            <button
              onClick={() => setShowReject(false)}
              className="flex-1 text-xs font-medium py-1.5 rounded-lg border border-gray-300 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={reject}
              disabled={loading}
              className="flex-1 text-xs font-semibold py-1.5 rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-60"
            >
              Confirm reject
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
