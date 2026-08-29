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
      <>
        {/* Desktop Loading */}
        <div className="hidden h-10 w-24 animate-pulse rounded-full bg-zinc-100 md:block" />

        {/* Mobile Loading */}
        <div className="h-10 w-10 animate-pulse rounded-full bg-zinc-100 md:hidden" />
      </>
    );
  }

  /* =========================================================
     LOGGED IN
  ========================================================= */

  if (user) {
    return (
      <div className="flex items-center gap-2">
        {/* =====================================================
            DESKTOP ACCOUNT
        ===================================================== */}

        <Link
          href="/account"
          aria-label="Open your account"
          className="
            hidden
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
            md:inline-flex
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

        {/* =====================================================
            DESKTOP LOGOUT
        ===================================================== */}

        <button
          type="button"
          onClick={handleLogout}
          className="
            hidden
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
            md:inline-flex
          "
        >
          Logout
        </button>

        {/* =====================================================
            MOBILE ACCOUNT ICON
        ===================================================== */}

        <Link
          href="/account"
          aria-label="Open your account"
          title="Account"
          className="
            flex
            h-10
            w-10
            items-center
            justify-center
            rounded-full
            border
            border-zinc-200
            bg-white
            text-lg
            shadow-sm
            transition-all
            hover:border-zinc-900
            hover:shadow-md
            md:hidden
          "
        >
          <span
            className="leading-none"
            aria-hidden="true"
          >
            👤
          </span>
        </Link>
      </div>
    );
  }

  /* =========================================================
     LOGGED OUT
  ========================================================= */

  return (
    <div className="flex items-center gap-2">
      {/* =====================================================
          DESKTOP LOGIN
      ===================================================== */}

      <Link
        href="/login"
        aria-label="Login to your account"
        className="
          hidden
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
          md:inline-flex
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

      {/* =====================================================
          DESKTOP REGISTER
      ===================================================== */}

      <Link
        href="/register"
        className="
          hidden
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
          md:inline-flex
        "
      >
        Register
      </Link>

      {/* =====================================================
          MOBILE LOGIN ICON
      ===================================================== */}

      <Link
        href="/login"
        aria-label="Login to your account"
        title="Login"
        className="
          flex
          h-10
          w-10
          items-center
          justify-center
          rounded-full
          border
          border-zinc-200
          bg-white
          text-lg
          shadow-sm
          transition-all
          hover:border-zinc-900
          hover:shadow-md
          md:hidden
        "
      >
        <span
          className="leading-none"
          aria-hidden="true"
        >
          👤
        </span>
      </Link>
    </div>
  );
}