"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UserPlus, X, AlertCircle, CheckCircle, Loader2 } from "lucide-react";

export function AddOfficerForm() {
  const router = useRouter();
  const [open,      setOpen]      = useState(false);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState<string | null>(null);
  const [success,   setSuccess]   = useState(false);

  const [fullName,  setFullName]  = useState("");
  const [email,     setEmail]     = useState("");
  const [staffId,   setStaffId]   = useState("");
  const [role,      setRole]      = useState("user");
  const [phone,     setPhone]     = useState("");
  const [password,  setPassword]  = useState("");

  function reset() {
    setFullName(""); setEmail(""); setStaffId("");
    setRole("user"); setPhone(""); setPassword("");
    setError(null); setSuccess(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await fetch("/api/admin/create-user", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ email, password, full_name: fullName, staff_id: staffId, role, phone }),
    });
    const data = await res.json();

    if (!res.ok || data.error) {
      setError(data.error ?? "Failed to create officer");
    } else {
      setSuccess(true);
      reset();
      setTimeout(() => { setOpen(false); setSuccess(false); router.refresh(); }, 1500);
    }
    setLoading(false);
  }

  return (
    <>
      <button
        onClick={() => { reset(); setOpen(true); }}
        className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white
                   text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
      >
        <UserPlus size={16} />
        Add Officer
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">Add New Officer</h2>
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            {success ? (
              <div className="flex flex-col items-center gap-3 py-10 px-6 text-teal-600">
                <CheckCircle size={40} />
                <p className="font-semibold">Officer added successfully!</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="px-5 py-4 flex flex-col gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Full name</label>
                  <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} required
                    placeholder="Dr. Full Name"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Email address</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                    placeholder="officer@moh.gov.my"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Staff ID</label>
                    <input type="text" value={staffId} onChange={e => setStaffId(e.target.value)} required
                      placeholder="MO002"
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Role</label>
                    <select value={role} onChange={e => setRole(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-500">
                      <option value="user">Medical Officer</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Phone (optional)</label>
                  <input type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                    placeholder="+60 12-345 6789"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Temporary password</label>
                  <input type="password" value={password} onChange={e => setPassword(e.target.value)} required
                    minLength={8}
                    placeholder="Min. 8 characters"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
                  <p className="text-xs text-gray-400 mt-1">Officer should change this after first login.</p>
                </div>

                {error && (
                  <div className="flex gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                    <AlertCircle size={15} className="flex-shrink-0 mt-0.5" />
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
                    {loading ? <Loader2 size={15} className="animate-spin" /> : <UserPlus size={15} />}
                    {loading ? "Creating…" : "Create Officer"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
