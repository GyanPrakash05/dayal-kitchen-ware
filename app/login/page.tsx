"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { supabase } from "../lib/supabase";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  /* --------------------------------
     GOOGLE LOGIN
  -------------------------------- */

  async function handleGoogleLogin() {
    setGoogleLoading(true);
    setError("");
    setMessage("");

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setError(error.message);
      setGoogleLoading(false);
    }
  }

  /* --------------------------------
     EMAIL LOGIN
  -------------------------------- */

  async function handleLogin(
    e: FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    setLoading(true);
    setError("");
    setMessage("");

    const { error } =
      await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    window.location.href = "/";
  }

  /* --------------------------------
     FORGOT PASSWORD
  -------------------------------- */

  async function handleForgotPassword() {
    setError("");
    setMessage("");

    if (!email.trim()) {
      setError(
        "Please enter your email address first."
      );
      return;
    }

    setLoading(true);

    const { error } =
      await supabase.auth.resetPasswordForEmail(
        email.trim(),
        {
          redirectTo: `${window.location.origin}/reset-password`,
        }
      );

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setMessage(
      "Password reset link has been sent to your email."
    );

    setLoading(false);
  }

  return (
    <main className="min-h-screen bg-white px-4 py-8 sm:py-10">
      <div className="mx-auto w-full max-w-[350px]">

        {/* LOGO */}

        <div className="mb-6 text-center">
          <Link
            href="/"
            className="text-xl font-bold tracking-tight text-zinc-900"
          >
            DAYAL KITCHEN WARE
          </Link>

          <p className="mt-1 text-xs text-zinc-500">
            Kitchen • Home • Lifestyle
          </p>
        </div>

        {/* LOGIN CARD */}

        <div className="rounded-lg border border-zinc-300 bg-white p-6 shadow-sm sm:p-7">

          <h1 className="text-2xl font-normal text-zinc-900">
            Sign in
          </h1>

          <p className="mt-2 text-sm text-zinc-600">
            Sign in to your Dayal Kitchen Ware account.
          </p>

          {/* GOOGLE LOGIN */}

          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={googleLoading}
            className="mt-6 flex w-full items-center justify-center gap-3 rounded-md border border-zinc-400 bg-white py-3 text-sm font-semibold text-zinc-900 transition hover:border-zinc-700 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {googleLoading ? (
              "Connecting to Google..."
            ) : (
              <>
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    fill="#4285F4"
                    d="M21.35 12.27c0-.71-.06-1.4-.18-2.06H12v3.9h5.24a4.48 4.48 0 0 1-1.94 2.94v2.45h3.14c1.84-1.7 2.91-4.2 2.91-7.23Z"
                  />

                  <path
                    fill="#34A853"
                    d="M12 21.99c2.63 0 4.84-.87 6.45-2.49l-3.14-2.45c-.87.58-1.98.93-3.31.93-2.54 0-4.69-1.72-5.46-4.03H3.3v2.53A9.74 9.74 0 0 0 12 21.99Z"
                  />

                  <path
                    fill="#FBBC05"
                    d="M6.54 13.95A5.86 5.86 0 0 1 6.23 12c0-.68.12-1.34.31-1.95V7.52H3.3A9.99 9.99 0 0 0 2.25 12c0 1.61.39 3.13 1.05 4.48l3.24-2.53Z"
                  />

                  <path
                    fill="#EA4335"
                    d="M12 6.02c1.43 0 2.71.49 3.72 1.45l2.79-2.79C16.84 3.05 14.63 2 12 2a9.74 9.74 0 0 0-8.7 5.52l3.24 2.53C7.31 7.74 9.46 6.02 12 6.02Z"
                  />
                </svg>

                Continue with Google
              </>
            )}
          </button>

          {/* DIVIDER */}

          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-zinc-200" />

            <span className="text-xs text-zinc-500">
              OR
            </span>

            <div className="h-px flex-1 bg-zinc-200" />
          </div>

          {/* EMAIL LOGIN */}

          <form
            onSubmit={handleLogin}
            className="space-y-5"
          >

            {/* EMAIL */}

            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-bold text-zinc-900"
              >
                Email
              </label>

              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) =>
                  setEmail(e.target.value)
                }
                placeholder="Enter your email"
                required
                autoComplete="email"
                className="w-full rounded-md border border-zinc-500 bg-white px-3 py-3 text-sm text-zinc-900 outline-none transition focus:border-amber-600 focus:ring-2 focus:ring-amber-100"
              />
            </div>

            {/* PASSWORD */}

            <div>
              <div className="mb-2 flex items-center justify-between gap-3">

                <label
                  htmlFor="password"
                  className="block text-sm font-bold text-zinc-900"
                >
                  Password
                </label>

                <button
                  type="button"
                  onClick={handleForgotPassword}
                  disabled={loading}
                  className="text-xs font-medium text-blue-700 hover:text-amber-700 hover:underline disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Forgot password?
                </button>

              </div>

              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) =>
                  setPassword(e.target.value)
                }
                placeholder="Enter your password"
                required
                autoComplete="current-password"
                className="w-full rounded-md border border-zinc-500 bg-white px-3 py-3 text-sm text-zinc-900 outline-none transition focus:border-amber-600 focus:ring-2 focus:ring-amber-100"
              />
            </div>

            {/* ERROR */}

            {error && (
              <div className="rounded-md border border-red-200 bg-red-50 px-3 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            {/* SUCCESS */}

            {message && (
              <div className="rounded-md border border-green-200 bg-green-50 px-3 py-3 text-sm text-green-700">
                {message}
              </div>
            )}

            {/* LOGIN BUTTON */}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-md border border-zinc-800 bg-zinc-900 py-3 text-sm font-semibold text-white transition hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading
                ? "Signing in..."
                : "Sign in"}
            </button>

          </form>

          {/* INFO */}

          <p className="mt-5 text-xs leading-5 text-zinc-600">
            By continuing, you agree to use your
            Dayal Kitchen Ware account for managing
            your profile and orders.
          </p>

        </div>

        {/* CREATE ACCOUNT */}

        <div className="mt-7">

          <div className="flex items-center gap-3">

            <div className="h-px flex-1 bg-zinc-200" />

            <span className="text-xs text-zinc-500">
              New to Dayal Kitchen Ware?
            </span>

            <div className="h-px flex-1 bg-zinc-200" />

          </div>

          <Link
            href="/register"
            className="mt-4 block w-full rounded-md border border-zinc-400 bg-white py-3 text-center text-sm font-semibold text-zinc-900 transition hover:border-zinc-700 hover:bg-zinc-50"
          >
            Create your Dayal Kitchen Ware account
          </Link>

        </div>

        {/* BACK */}

        <Link
          href="/"
          className="mt-6 block text-center text-xs text-zinc-500 hover:text-zinc-900 hover:underline"
        >
          ← Back to store
        </Link>

      </div>
    </main>
  );
}