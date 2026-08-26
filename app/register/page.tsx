"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { supabase } from "../lib/supabase";

export default function RegisterPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

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

  async function handleRegister(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setLoading(true);
    setError("");
    setMessage("");

    const cleanName = fullName.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = phone.trim();

    if (cleanName.length < 2) {
      setError("Please enter your full name.");
      setLoading(false);
      return;
    }

    if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
      setError(
        "Please enter a valid 10-digit Indian mobile number."
      );
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      setLoading(false);
      return;
    }

    const {
      data,
      error: signUpError,
    } = await supabase.auth.signUp({
      email: cleanEmail,
      password,
      options: {
        data: {
          full_name: cleanName,
          phone: cleanPhone,
        },
      },
    });

    if (signUpError) {
      console.error("REGISTER ERROR:", signUpError);

      setError(
        signUpError.message ||
          "Unable to create your account."
      );

      setLoading(false);
      return;
    }

    if (data.user) {
      if (data.session) {
        setMessage(
          "Account created successfully! Redirecting..."
        );

        setTimeout(() => {
          window.location.href = "/";
        }, 1200);
      } else {
        setMessage(
          "Account created successfully! Please check your email to verify your account before signing in."
        );

        setFullName("");
        setEmail("");
        setPhone("");
        setPassword("");
        setConfirmPassword("");
      }
    } else {
      setError(
        "Account could not be created. Please try again."
      );
    }

    setLoading(false);
  }

  return (
    <main className="min-h-screen bg-white px-4 py-8 sm:py-10">
      <div className="mx-auto w-full max-w-[380px]">

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

          <p className="mt-2 text-sm leading-5 text-zinc-600">
            Create an account to manage your
            orders and profile.
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

          {/* REGISTER FORM */}

          <form
            onSubmit={handleRegister}
            className="space-y-5"
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
                onChange={(e) =>
                  setFullName(e.target.value)
                }
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
                onChange={(e) =>
                  setEmail(e.target.value)
                }
                placeholder="Enter your email"
                required
                autoComplete="email"
                className="w-full rounded-md border border-zinc-500 bg-white px-3 py-3 text-sm text-zinc-900 outline-none transition focus:border-amber-600 focus:ring-2 focus:ring-amber-100"
              />
            </div>

            {/* MOBILE NUMBER */}

            <div>
              <label
                htmlFor="phone"
                className="mb-2 block text-sm font-bold text-zinc-900"
              >
                Mobile Number
              </label>

              <div className="flex">
                <div className="flex items-center rounded-l-md border border-r-0 border-zinc-500 bg-zinc-50 px-3 text-sm font-medium text-zinc-700">
                  +91
                </div>

                <input
                  id="phone"
                  type="tel"
                  inputMode="numeric"
                  value={phone}
                  onChange={(e) =>
                    setPhone(
                      e.target.value
                        .replace(/\D/g, "")
                        .slice(0, 10)
                    )
                  }
                  placeholder="10-digit mobile number"
                  required
                  autoComplete="tel"
                  className="w-full rounded-r-md border border-zinc-500 bg-white px-3 py-3 text-sm text-zinc-900 outline-none transition focus:border-amber-600 focus:ring-2 focus:ring-amber-100"
                />
              </div>

              <p className="mt-2 text-xs text-zinc-500">
                Your mobile number will be saved
                with your account.
              </p>
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
                onChange={(e) =>
                  setPassword(e.target.value)
                }
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

            {/* CONFIRM PASSWORD */}

            <div>
              <label
                htmlFor="confirmPassword"
                className="mb-2 block text-sm font-bold text-zinc-900"
              >
                Confirm Password
              </label>

              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) =>
                  setConfirmPassword(e.target.value)
                }
                placeholder="Enter password again"
                required
                autoComplete="new-password"
                className="w-full rounded-md border border-zinc-500 bg-white px-3 py-3 text-sm text-zinc-900 outline-none transition focus:border-amber-600 focus:ring-2 focus:ring-amber-100"
              />
            </div>

            {/* ERROR */}

            {error && (
              <div className="rounded-md border border-red-200 bg-red-50 px-3 py-3 text-sm leading-5 text-red-700">
                {error}
              </div>
            )}

            {/* SUCCESS */}

            {message && (
              <div className="rounded-md border border-green-200 bg-green-50 px-3 py-3 text-sm leading-5 text-green-700">
                {message}
              </div>
            )}

            {/* REGISTER BUTTON */}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-md border border-zinc-800 bg-zinc-900 py-3 text-sm font-semibold text-white transition hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading
                ? "Creating account..."
                : "Create account"}
            </button>
          </form>

          {/* INFO */}

          <p className="mt-5 text-xs leading-5 text-zinc-600">
            By creating an account, you can manage
            your profile and keep track of your
            orders.
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