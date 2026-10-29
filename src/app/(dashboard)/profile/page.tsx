"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { ROLE_LABELS } from "@/lib/constants";
import { User, Save, CheckCircle, AlertCircle, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import type { Profile } from "@/lib/types";

export default function ProfilePage() {
  const router   = useRouter();
  const supabase = createClient();

  const [profile,  setProfile]  = useState<Profile | null>(null);
  const [fullName, setFullName] = useState("");
  const [phone,    setPhone]    = useState("");
  const [loading,  setLoading]  = useState(false);
  const [saved,    setSaved]    = useState(false);
  const [error,    setError]    = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (supabase.from("profiles") as any)
        .select("*").eq("id", user.id).single();
      if (data) {
        setProfile(data as Profile);
        setFullName(data.full_name ?? "");
        setPhone(data.phone ?? "");
      }
    }
    load();
  }, [supabase]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: updateError } = await (supabase.from("profiles") as any)
      .update({ full_name: fullName, phone: phone || null })
      .eq("id", profile?.id);
    if (updateError) {
      setError(updateError.message);
    } else {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
    setLoading(false);
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
        <p className="text-sm text-gray-500">Update your personal details</p>
      </div>

      {/* Avatar + role */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 mb-5">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-brand-100 flex items-center justify-center flex-shrink-0">
            <User size={24} className="text-brand-600" />
          </div>
          <div className="min-w-0">
            <p className="font-bold text-gray-900 text-lg truncate">{profile.full_name}</p>
            <p className="text-sm text-gray-500">{profile.email}</p>
            <span className="inline-block mt-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-brand-100 text-brand-700">
              {ROLE_LABELS[profile.role] ?? profile.role}
            </span>
          </div>
        </div>
      </div>

      {/* Read-only info */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 mb-5 flex flex-col gap-3">
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-0.5">Staff ID</p>
          <p className="text-sm font-medium text-gray-900 font-mono">{profile.staff_id}</p>
        </div>
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-0.5">Email</p>
          <p className="text-sm text-gray-900">{profile.email}</p>
        </div>
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-0.5">Role</p>
          <p className="text-sm text-gray-900">{ROLE_LABELS[profile.role] ?? profile.role}</p>
        </div>
      </div>

      {/* Editable fields */}
      <form onSubmit={handleSave} className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex flex-col gap-4 mb-5">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Full name</label>
          <input
            type="text"
            required
            value={fullName}
            onChange={e => setFullName(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm
                       focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Phone number</label>
          <input
            type="tel"
            value={phone}
            onChange={e => setPhone(e.target.value)}
            placeholder="+60 12-345 6789"
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm
                       focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        {error && (
          <div className="flex gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            <AlertCircle size={15} className="flex-shrink-0 mt-0.5" />
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700
                     disabled:opacity-60 text-white font-semibold py-2.5 rounded-lg transition-colors text-sm"
        >
          {saved ? <CheckCircle size={16} /> : <Save size={16} />}
          {saved ? "Saved!" : loading ? "Saving…" : "Save changes"}
        </button>
      </form>

      {/* Sign out */}
      <button
        onClick={handleSignOut}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl
                   border border-red-200 text-red-600 hover:bg-red-50 transition-colors text-sm font-medium"
      >
        <LogOut size={16} />
        Sign out
      </button>
    </div>
  );
}
