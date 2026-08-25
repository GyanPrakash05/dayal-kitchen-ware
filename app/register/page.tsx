"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { supabase } from "../lib/supabase";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleRegister(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setLoading(true);
    setError("");
    setMessage("");

    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          full_name: fullName.trim(),
        },
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    if (data.user) {
      setMessage(
        "Account created successfully! You can now login."
      );
    }

    setEmail("");
    setPassword("");
    setFullName("");
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

        {/* REGISTER CARD */}

        <div className="rounded-lg border border-zinc-300 bg-white p-6 shadow-sm sm:p-7">

          <h1 className="text-2xl font-normal text-zinc-900">
            Create your account
          </h1>

          <p className="mt-2 text-sm text-zinc-600">
            Create an account to manage your orders and profile.
          </p>

          <form
            onSubmit={handleRegister}
            className="mt-6 space-y-5"
          >

            {/* FULL NAME */}

            <div>

              <label
                htmlFor="fullName"
                className="mb-2 block text-sm font-bold text-zinc-900"
              >
                Full Name
              </label>

              <input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Enter your full name"
                required
                autoComplete="name"
                className="w-full rounded-md border border-zinc-500 bg-white px-3 py-3 text-sm text-zinc-900 outline-none transition focus:border-amber-600 focus:ring-2 focus:ring-amber-100"
              />

            </div>

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

              <label
                htmlFor="password"
                className="mb-2 block text-sm font-bold text-zinc-900"
              >
                Password
              </label>

              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Create a password"
                minLength={6}
                required
                autoComplete="new-password"
                className="w-full rounded-md border border-zinc-500 bg-white px-3 py-3 text-sm text-zinc-900 outline-none transition focus:border-amber-600 focus:ring-2 focus:ring-amber-100"
              />

              <p className="mt-2 text-xs text-zinc-500">
                Minimum 6 characters
              </p>

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

            {/* REGISTER BUTTON */}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-md border border-zinc-800 bg-zinc-900 py-3 text-sm font-semibold text-white transition hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Creating account..." : "Create account"}
            </button>

          </form>

          {/* INFO */}

          <p className="mt-5 text-xs leading-5 text-zinc-600">
            By creating an account, you can manage your profile
            and keep track of your orders.
          </p>

        </div>

        {/* LOGIN */}

        <div className="mt-7">

          <div className="flex items-center gap-3">

            <div className="h-px flex-1 bg-zinc-200" />

            <span className="text-xs text-zinc-500">
              Already have an account?
            </span>

            <div className="h-px flex-1 bg-zinc-200" />

          </div>

          <Link
            href="/login"
            className="mt-4 block w-full rounded-md border border-zinc-400 bg-white py-3 text-center text-sm font-semibold text-zinc-900 transition hover:border-zinc-700 hover:bg-zinc-50"
          >
            Sign in to your account
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