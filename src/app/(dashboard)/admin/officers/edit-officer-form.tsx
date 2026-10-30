"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, X, AlertCircle, CheckCircle, Loader2, Trash2 } from "lucide-react";

interface OfficerRow {
  id:        string;
  full_name: string;
  email:     string;
  staff_id:  string;
  role:      string;
  phone:     string | null;
  is_active: boolean;
}

export function EditOfficerForm({ officer }: { officer: OfficerRow }) {
  const router = useRouter();
  const [open,        setOpen]        = useState(false);
  const [loading,     setLoading]     = useState(false);
  const [deleting,    setDeleting]    = useState(false);
  const [error,       setError]       = useState<string | null>(null);
  const [success,     setSuccess]     = useState(false);
  const [confirmDeac, setConfirmDeac] = useState(false);
  const [confirmDel,  setConfirmDel]  = useState(false);

  const [fullName, setFullName] = useState(officer.full_name);
  const [email,    setEmail]    = useState(officer.email);
  const [staffId,  setStaffId]  = useState(officer.staff_id);
  const [role,     setRole]     = useState(officer.role);
  const [phone,    setPhone]    = useState(officer.phone ?? "");
  const [isActive, setIsActive] = useState(officer.is_active);

  function handleOpen() {
    setFullName(officer.full_name);
    setEmail(officer.email);
    setStaffId(officer.staff_id);
    setRole(officer.role);
    setPhone(officer.phone ?? "");
    setIsActive(officer.is_active);
    setError(null);
    setSuccess(false);
    setConfirmDeac(false);
    setConfirmDel(false);
    setOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res  = await fetch("/api/admin/update-officer", {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({
        id: officer.id, full_name: fullName, email,
        staff_id: staffId, role, phone: phone || null, is_active: isActive,
      }),
    });
    const data = await res.json();

    if (!res.ok || data.error) {
      setError(data.error ?? "Failed to update officer");
    } else {
      setSuccess(true);
      setTimeout(() => { setOpen(false); setSuccess(false); router.refresh(); }, 1200);
    }
    setLoading(false);
  }

  async function handleDelete() {
    setDeleting(true);
    setError(null);

    const res  = await fetch("/api/admin/delete-officer", {
      method:  "DELETE",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ id: officer.id }),
    });
    const data = await res.json();

    if (!res.ok || data.error) {
      setError(data.error ?? "Failed to delete officer");
      setDeleting(false);
      setConfirmDel(false);
    } else {
      setOpen(false);
      router.refresh();
    }
  }

  return (
    <>
      <button onClick={handleOpen}
        className="p-1.5 rounded-lg text-gray-400 hover:text-brand-600 hover:bg-brand-50 transition-colors"
        title="Edit officer">
        <Pencil size={14} />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
              <h2 className="text-base font-bold text-gray-900">Edit Officer</h2>
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>

            {success ? (
              <div className="flex flex-col items-center gap-3 py-10 text-teal-600">
                <CheckCircle size={36} />
                <p className="font-semibold text-sm">Officer updated</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="px-5 py-4 flex flex-col gap-3">

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Full name</label>
                  <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} required
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Email address</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
                  <p className="text-xs text-gray-400 mt-1">Changing email updates their login address.</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Staff ID</label>
                    <input type="text" value={staffId} onChange={e => setStaffId(e.target.value)} required
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Role</label>
                    <select value={role} onChange={e => setRole(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-500">
                      <option value="user">Medical Officer</option>
                      <option value="admin">Admin</option>
                      <option value="superadmin">Superadmin</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Phone (optional)</label>
                  <input type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                    placeholder="+60 12-345 6789"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
                </div>

                {/* Active toggle */}
                <div className="flex items-center justify-between py-2 border-t border-gray-100 mt-1">
                  <div>
                    <p className="text-sm font-semibold text-gray-700">Account active</p>
                    <p className="text-xs text-gray-400">Inactive officers cannot log in</p>
                  </div>
                  <button type="button"
                    onClick={() => { if (isActive) setConfirmDeac(true); else setIsActive(true); }}
                    className={`relative w-11 h-6 rounded-full transition-colors ${isActive ? "bg-teal-500" : "bg-gray-300"}`}>
                    <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${isActive ? "translate-x-5" : "translate-x-0"}`} />
                  </button>
                </div>

                {/* Deactivate confirmation */}
                {confirmDeac && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex flex-col gap-2">
                    <p className="text-xs text-amber-800 font-medium">Deactivate {officer.full_name}? They will lose access immediately.</p>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => setConfirmDeac(false)}
                        className="flex-1 text-xs py-1.5 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50">
                        Cancel
                      </button>
                      <button type="button" onClick={() => { setIsActive(false); setConfirmDeac(false); }}
                        className="flex-1 text-xs py-1.5 rounded-lg bg-amber-600 text-white font-semibold hover:bg-amber-700">
                        Deactivate
                      </button>
                    </div>
                  </div>
                )}

                {error && (
                  <div className="flex gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                    <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
                    {error}
                  </div>
                )}

                <div className="flex gap-3 pt-1">
                  <button type="button" onClick={() => setOpen(false)}
                    className="flex-1 py-2.5 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50">
                    Cancel
                  </button>
                  <button type="submit" disabled={loading}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-brand-600
                               hover:bg-brand-700 text-white text-sm font-semibold disabled:opacity-60">
                    {loading ? <Loader2 size={14} className="animate-spin" /> : null}
                    {loading ? "Saving…" : "Save Changes"}
                  </button>
                </div>

                {/* Delete section */}
                <div className="border-t border-red-100 pt-3 mt-1">
                  {!confirmDel ? (
                    <button type="button" onClick={() => setConfirmDel(true)}
                      className="flex items-center gap-2 text-xs text-red-600 hover:text-red-700 font-medium w-full justify-center py-2 rounded-lg hover:bg-red-50 transition-colors">
                      <Trash2 size={13} />
                      Delete this officer permanently
                    </button>
                  ) : (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex flex-col gap-2">
                      <p className="text-xs text-red-800 font-semibold text-center">
                        Permanently delete {officer.full_name}?
                      </p>
                      <p className="text-xs text-red-600 text-center">
                        This removes their account and all login access. Roster and attendance records are kept.
                      </p>
                      <div className="flex gap-2 mt-1">
                        <button type="button" onClick={() => setConfirmDel(false)}
                          className="flex-1 text-xs py-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50">
                          Cancel
                        </button>
                        <button type="button" onClick={handleDelete} disabled={deleting}
                          className="flex-1 flex items-center justify-center gap-1.5 text-xs py-2 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-700 disabled:opacity-60">
                          {deleting ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                          {deleting ? "Deleting…" : "Yes, delete"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>

              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
