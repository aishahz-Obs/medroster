"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ShieldCheck, AlertCircle } from "lucide-react";

export default function SetupPage() {
  const router  = useRouter();
  const supabase = createClient();

  const [fullName, setFullName] = useState("");
  const [staffId,  setStaffId]  = useState("");
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [error,    setError]    = useState<string | null>(null);
  const [loading,  setLoading]  = useState(false);
  const [done,     setDone]     = useState(false);

  async function handleSetup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // 1. Sign up the user in Supabase Auth
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
    });
    if (signUpError || !signUpData.user) {
      setError(signUpError?.message ?? "Sign-up failed.");
      setLoading(false);
      return;
    }

    // 2. Call the bootstrap RPC to create the superadmin profile
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: rpcError } = await (supabase.rpc as any)("bootstrap_superadmin", {
      p_full_name: fullName,
      p_staff_id:  staffId,
    });
    if (rpcError) {
      setError(rpcError.message);
      setLoading(false);
      return;
    }

    setDone(true);
    setTimeout(() => router.push("/login"), 3000);
  }

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-8 max-w-sm w-full text-center">
          <div className="w-16 h-16 rounded-full bg-teal-100 flex items-center justify-center mx-auto mb-4">
            <ShieldCheck className="text-teal-600" size={32} />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Superadmin Created!</h2>
          <p className="text-sm text-gray-500">
            Your account is ready. Redirecting to login…
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-8 max-w-sm w-full">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-teal-600 flex items-center justify-center">
            <ShieldCheck className="text-white" size={20} />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">First-time Setup</h1>
            <p className="text-xs text-gray-500">Create your Superadmin account</p>
          </div>
        </div>

        <div className="mb-5 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5 text-xs text-amber-800">
          This page is only usable once — it will be locked after the first account is created.
          <strong> Delete or protect this route before going to production.</strong>
        </div>

        <form onSubmit={handleSetup} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Full name</label>
            <input
              required
              type="text"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              placeholder="Dr. Aisha Hassan"
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm
                         focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Staff ID</label>
            <input
              required
              type="text"
              value={staffId}
              onChange={e => setStaffId(e.target.value)}
              placeholder="MO12345"
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm
                         focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email</label>
            <input
              required
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@hospital.gov.my"
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm
                         focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Password</label>
            <input
              required
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Min 8 characters"
              minLength={8}
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm
                         focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          {error && (
            <div className="flex gap-2 rounded-lg bg-red-50 border border-red-200 px-3 py-2.5 text-sm text-red-700">
              <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-teal-600 hover:bg-teal-700 disabled:opacity-60 text-white
                       font-semibold py-2.5 rounded-lg transition-colors text-sm"
          >
            {loading ? "Creating account…" : "Create Superadmin"}
          </button>
        </form>
      </div>
    </div>
  );
}
