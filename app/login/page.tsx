"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { supabase } from "../lib/supabase";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setLoading(true);
    setError("");

    const { error } = await supabase.auth.signInWithPassword({
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

          <form
            onSubmit={handleLogin}
            className="mt-6 space-y-5"
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
                onChange={(e) => setEmail(e.target.value)}
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
                  className="text-xs font-medium text-blue-700 hover:text-amber-700 hover:underline"
                >
                  Forgot password?
                </button>

              </div>

              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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

            {/* LOGIN BUTTON */}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-md border border-zinc-800 bg-zinc-900 py-3 text-sm font-semibold text-white transition hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>

          </form>

          {/* INFO */}

          <p className="mt-5 text-xs leading-5 text-zinc-600">
            By continuing, you agree to use your Dayal Kitchen Ware
            account for managing your profile and orders.
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