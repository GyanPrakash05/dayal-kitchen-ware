"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../lib/supabase";

export default function AuthButton() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function getUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      setUser(user);
      setLoading(false);
    }

    getUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  if (loading) {
    return (
      <div className="h-10 w-24 rounded-full bg-zinc-100 animate-pulse" />
    );
  }

  if (user) {
    return (
      <div className="flex items-center gap-2">
        <Link
          href="/account"
          className="rounded-full border border-zinc-300 bg-white px-4 py-2 text-sm font-semibold text-zinc-900 transition hover:border-zinc-900"
        >
          Account
        </Link>

        <button
          onClick={handleLogout}
          className="rounded-full bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-700"
        >
          Logout
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Link
        href="/login"
        className="rounded-full border border-zinc-300 bg-white px-4 py-2 text-sm font-semibold text-zinc-900 transition hover:border-zinc-900"
      >
        Login
      </Link>

      <Link
        href="/register"
        className="rounded-full bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-700"
      >
        Register
      </Link>
    </div>
  );
}