"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../lib/supabase";

type User = {
  id: string;
  email?: string | null;
};

export default function AuthButton() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function getUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (mounted) {
        setUser(
          user
            ? {
                id: user.id,
                email: user.email,
              }
            : null
        );

        setLoading(false);
      }
    }

    getUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;

      const sessionUser = session?.user;

      setUser(
        sessionUser
          ? {
              id: sessionUser.id,
              email: sessionUser.email,
            }
          : null
      );

      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  /* =========================================================
     LOADING
  ========================================================= */

  if (loading) {
    return (
      <div className="h-10 w-24 animate-pulse rounded-full bg-zinc-100" />
    );
  }

  /* =========================================================
     LOGGED IN
  ========================================================= */

  if (user) {
    return (
      <div className="flex items-center gap-2">
        {/* ACCOUNT */}

        <Link
          href="/account"
          aria-label="Open your account"
          className="
            inline-flex
            items-center
            justify-center
            gap-2
            rounded-full
            border
            border-zinc-300
            bg-white
            px-4
            py-2
            text-sm
            font-semibold
            text-zinc-900
            transition-all
            hover:border-zinc-900
            hover:shadow-sm
          "
        >
          <span
            className="text-base leading-none"
            aria-hidden="true"
          >
            👤
          </span>

          <span>Account</span>
        </Link>

        {/* LOGOUT */}

        <button
          type="button"
          onClick={handleLogout}
          className="
            inline-flex
            items-center
            justify-center
            rounded-full
            bg-zinc-900
            px-4
            py-2
            text-sm
            font-semibold
            text-white
            transition-all
            hover:bg-amber-700
            hover:shadow-lg
          "
        >
          Logout
        </button>
      </div>
    );
  }

  /* =========================================================
     LOGGED OUT
  ========================================================= */

  return (
    <div className="flex items-center gap-2">
      {/* LOGIN */}

      <Link
        href="/login"
        aria-label="Login to your account"
        className="
          inline-flex
          items-center
          justify-center
          gap-2
          rounded-full
          border
          border-zinc-300
          bg-white
          px-4
          py-2
          text-sm
          font-semibold
          text-zinc-900
          transition-all
          hover:border-zinc-900
          hover:shadow-sm
        "
      >
        <span
          className="text-base leading-none"
          aria-hidden="true"
        >
          👤
        </span>

        <span>Login</span>
      </Link>

      {/* REGISTER */}

      <Link
        href="/register"
        className="
          inline-flex
          items-center
          justify-center
          rounded-full
          bg-zinc-900
          px-4
          py-2
          text-sm
          font-semibold
          text-white
          transition-all
          hover:bg-amber-700
          hover:shadow-lg
        "
      >
        Register
      </Link>
    </div>
  );
}