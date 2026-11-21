"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export interface AvyraUser {
  name: string;
  email: string;
  createdAt: string;
}

export default function SignInPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [currentUser, setCurrentUser] = useState<AvyraUser | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("avyra_user");
      if (saved) {
        setCurrentUser(JSON.parse(saved));
      }
    } catch {}
  }, []);

  const completeSignIn = (user: AvyraUser) => {
    try {
      localStorage.setItem("avyra_user", JSON.stringify(user));
      window.dispatchEvent(new CustomEvent("avyra-auth-change"));
    } catch {}
    router.push("/");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail || !trimmedEmail.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setSubmitting(true);
    try {
      const accountsRaw = localStorage.getItem("avyra_accounts");
      const accounts: Record<string, { name: string; email: string; password: string; createdAt: string }> =
        accountsRaw ? JSON.parse(accountsRaw) : {};

      if (mode === "signup") {
        const displayName = name.trim() || trimmedEmail.split("@")[0];
        const newAccount = {
          name: displayName,
          email: trimmedEmail,
          password,
          createdAt: new Date().toISOString(),
        };
        accounts[trimmedEmail] = newAccount;
        localStorage.setItem("avyra_accounts", JSON.stringify(accounts));
        completeSignIn({
          name: newAccount.name,
          email: newAccount.email,
          createdAt: newAccount.createdAt,
        });
      } else {
        const existing = accounts[trimmedEmail];
        if (existing && existing.password !== password) {
          setError("Incorrect password for this account.");
          setSubmitting(false);
          return;
        }
        const resolvedName = existing?.name || trimmedEmail.split("@")[0];
        const createdAt = existing?.createdAt || new Date().toISOString();
        if (!existing) {
          accounts[trimmedEmail] = {
            name: resolvedName,
            email: trimmedEmail,
            password,
            createdAt,
          };
          localStorage.setItem("avyra_accounts", JSON.stringify(accounts));
        }
        completeSignIn({
          name: resolvedName,
          email: trimmedEmail,
          createdAt,
        });
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleSignOut = () => {
    try {
      localStorage.removeItem("avyra_user");
      window.dispatchEvent(new CustomEvent("avyra-auth-change"));
      setCurrentUser(null);
    } catch {}
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 pt-28 pb-16">
      <div className="w-full max-w-md rounded-3xl bg-[#0d0f17]/95 border border-white/[0.1] shadow-[0_24px_80px_rgba(0,0,0,0.8)] p-7 sm:p-8 space-y-6">
        {currentUser ? (
          <div className="space-y-6 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-rose-600 text-white font-extrabold text-2xl flex items-center justify-center mx-auto shadow-[0_8px_24px_rgba(225,29,72,0.4)]">
              {currentUser.name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-white tracking-tight">
                Signed in as {currentUser.name}
              </h1>
              <p className="text-sm text-neutral-400 mt-1">{currentUser.email}</p>
            </div>
            <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/[0.07] text-xs text-neutral-300 text-left space-y-1.5">
              <div className="font-bold text-white">Account Sync Enabled</div>
              <p className="text-neutral-400 leading-relaxed">
                Your personal Watchlist, Continue Watching episode progress, and preferred streaming server are linked to your Avyra profile.
              </p>
            </div>
            <div className="flex flex-col gap-2.5">
              <Link
                href="/watchlist"
                className="w-full py-3 rounded-xl bg-primary hover:bg-primary-hover text-white font-bold text-sm transition-colors text-center"
              >
                Go to My List
              </Link>
              <button
                onClick={handleSignOut}
                className="w-full py-3 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-neutral-200 font-semibold text-sm transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="text-center space-y-1.5">
              <Link href="/" className="inline-block text-2xl font-extrabold tracking-tight text-white">
                AVY<span className="text-primary">RA</span>
              </Link>
              <h1 className="text-2xl font-extrabold text-white tracking-tight">
                {mode === "signin" ? "Welcome back" : "Create your Avyra account"}
              </h1>
              <p className="text-xs text-neutral-400">
                Save your watchlist, track episodes across sessions, and customize playback.
              </p>
            </div>

            {/* Mode Switch Tabs */}
            <div className="grid grid-cols-2 p-1 rounded-xl bg-white/[0.04] border border-white/[0.07]">
              <button
                type="button"
                onClick={() => {
                  setMode("signin");
                  setError(null);
                }}
                className={`py-2 rounded-lg text-xs font-bold transition-all ${
                  mode === "signin"
                    ? "bg-primary text-white shadow-sm"
                    : "text-neutral-400 hover:text-white"
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode("signup");
                  setError(null);
                }}
                className={`py-2 rounded-lg text-xs font-bold transition-all ${
                  mode === "signup"
                    ? "bg-primary text-white shadow-sm"
                    : "text-neutral-400 hover:text-white"
                }`}
              >
                Create Account
              </button>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-500/40 text-xs text-rose-200 font-medium">
                {error}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === "signup" && (
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Alex Mercer"
                    className="w-full px-4 py-2.5 rounded-xl bg-white/[0.05] border border-white/[0.1] text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-primary"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full px-4 py-2.5 rounded-xl bg-white/[0.05] border border-white/[0.1] text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-2.5 rounded-xl bg-white/[0.05] border border-white/[0.1] text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-primary"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-primary to-rose-600 hover:from-primary-hover hover:to-rose-500 text-white font-bold text-sm shadow-[0_8px_24px_rgba(225,29,72,0.4)] transition-all"
              >
                {submitting
                  ? "Signing in..."
                  : mode === "signin"
                  ? "Sign In"
                  : "Create Account"}
              </button>
            </form>

            {/* Quick Guest / Demo Sign In */}
            <div className="pt-2 border-t border-white/[0.07] text-center">
              <button
                type="button"
                onClick={() =>
                  completeSignIn({
                    name: "Cinema Member",
                    email: "member@avyra.app",
                    createdAt: new Date().toISOString(),
                  })
                }
                className="w-full py-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.09] border border-white/[0.08] text-xs font-semibold text-neutral-300 hover:text-white transition-colors"
              >
                Continue with Instant Demo Profile &rarr;
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
