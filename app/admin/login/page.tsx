"use client";

import {
  FormEvent,
  useEffect,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/app/lib/supabase";

export default function AdminLoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [resetLoading, setResetLoading] =
    useState(false);

  const [checking, setChecking] =
    useState(true);

  const [showPassword, setShowPassword] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const [showForgotPassword, setShowForgotPassword] =
    useState(false);

  /* =========================================================
     CHECK EXISTING SESSION
  ========================================================= */

  useEffect(() => {
    async function checkUser() {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session) {
          router.replace("/admin");
          return;
        }
      } catch (error) {
        console.error(
          "AUTH CHECK ERROR:",
          error
        );
      }

      setChecking(false);
    }

    checkUser();
  }, [router]);

  /* =========================================================
     LOGIN
  ========================================================= */

  async function handleLogin(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const cleanEmail =
        email.trim().toLowerCase();

      if (!cleanEmail) {
        throw new Error(
          "Please enter your email address."
        );
      }

      if (!password) {
        throw new Error(
          "Please enter your password."
        );
      }

      const { data, error } =
  await supabase.auth.signInWithPassword({
    email: cleanEmail,
    password,
  });

if (error) {
  throw new Error(
    error.message
  );
}

console.log(
  "ADMIN LOGIN SUCCESS:",
  {
    userId: data.user?.id,
    email: data.user?.email,
    hasSession: !!data.session,
    hasAccessToken: !!data.session?.access_token,
  }
);

const {
  data: sessionCheck,
  error: sessionCheckError,
} =
  await supabase.auth.getSession();

console.log(
  "ADMIN SESSION AFTER LOGIN:",
  {
    hasSession: !!sessionCheck.session,
    hasAccessToken:
      !!sessionCheck.session?.access_token,
    error: sessionCheckError,
  }
);

router.replace("/admin");
router.refresh();
    } catch (error) {
      console.error(
        "LOGIN ERROR:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Login failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  /* =========================================================
     FORGOT PASSWORD
  ========================================================= */

  async function handleForgotPassword(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setResetLoading(true);
    setError("");
    setSuccess("");

    try {
      const cleanEmail =
        email.trim().toLowerCase();

      if (!cleanEmail) {
        throw new Error(
          "Please enter your admin email address first."
        );
      }

      if (
        !cleanEmail.includes("@")
      ) {
        throw new Error(
          "Please enter a valid email address."
        );
      }

      /*
       * IMPORTANT:
       * Supabase will send the recovery email
       * and redirect the user to:
       *
       * /admin/reset-password
       */

      const redirectUrl =
        `${window.location.origin}/admin/reset-password`;

      const { error } =
        await supabase.auth.resetPasswordForEmail(
          cleanEmail,
          {
            redirectTo:
              redirectUrl,
          }
        );

      if (error) {
        throw new Error(
          error.message
        );
      }

      setSuccess(
        "Password reset link has been sent to your email. Please check your inbox and spam folder."
      );
    } catch (error) {
      console.error(
        "FORGOT PASSWORD ERROR:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Unable to send password reset email."
      );
    } finally {
      setResetLoading(false);
    }
  }

  /* =========================================================
     LOADING SCREEN
  ========================================================= */

  if (checking) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#faf9f6]">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-zinc-200 border-t-zinc-900" />

          <p className="mt-4 text-sm text-zinc-500">
            Checking authentication...
          </p>
        </div>
      </main>
    );
  }

  /* =========================================================
     LOGIN PAGE
  ========================================================= */

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#faf9f6] px-6 py-12">
      <div className="w-full max-w-md">

        {/* HEADER */}

        <div className="mb-8 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-700">
            Dayal Kitchen Ware
          </p>

          <h1 className="mt-3 text-4xl font-bold">
            Admin Login
          </h1>

          <p className="mt-3 text-zinc-500">
            Sign in to manage your products
            and customer orders.
          </p>
        </div>

        {/* =====================================================
            LOGIN FORM
        ===================================================== */}

        {!showForgotPassword ? (
          <form
            onSubmit={handleLogin}
            className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8"
          >

            {/* EMAIL */}

            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-semibold"
              >
                Email
              </label>

              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(event) =>
                  setEmail(
                    event.target.value
                  )
                }
                placeholder="admin@example.com"
                className="w-full rounded-xl border border-zinc-300 px-4 py-3 outline-none transition focus:border-amber-600 focus:ring-2 focus:ring-amber-100"
              />
            </div>

            {/* PASSWORD */}

            <div className="mt-5">
              <div className="mb-2 flex items-center justify-between">
                <label
                  htmlFor="password"
                  className="block text-sm font-semibold"
                >
                  Password
                </label>

                <button
                  type="button"
                  onClick={() => {
                    setShowForgotPassword(
                      true
                    );
                    setError("");
                    setSuccess("");
                  }}
                  className="text-xs font-semibold text-amber-700 transition hover:text-amber-900 hover:underline"
                >
                  Forgot password?
                </button>
              </div>

              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) =>
                    setPassword(
                      event.target.value
                    )
                  }
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-zinc-300 px-4 py-3 pr-16 outline-none transition focus:border-amber-600 focus:ring-2 focus:ring-amber-100"
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPassword(
                      (current) =>
                        !current
                    )
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg px-2 py-1 text-xs font-semibold text-zinc-500 hover:text-zinc-900"
                >
                  {showPassword
                    ? "Hide"
                    : "Show"}
                </button>
              </div>
            </div>

            {/* ERROR */}

            {error && (
              <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700">
                {error}
              </div>
            )}

            {/* SUCCESS */}

            {success && (
              <div className="mt-5 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm leading-6 text-green-700">
                {success}
              </div>
            )}

            {/* LOGIN BUTTON */}

            <button
              type="submit"
              disabled={loading}
              className="mt-6 w-full rounded-full bg-zinc-900 px-6 py-4 font-semibold text-white transition hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading
                ? "Signing in..."
                : "Login to Admin"}
            </button>

          </form>
        ) : (

          /* ===================================================
             FORGOT PASSWORD FORM
          =================================================== */

          <form
            onSubmit={
              handleForgotPassword
            }
            className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8"
          >

            <div className="mb-6">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-2xl">
                🔐
              </div>

              <h2 className="text-2xl font-bold">
                Forgot Password?
              </h2>

              <p className="mt-2 text-sm leading-6 text-zinc-500">
                Enter your admin email address
                and we'll send you a secure
                password reset link.
              </p>
            </div>

            {/* EMAIL */}

            <div>
              <label
                htmlFor="reset-email"
                className="mb-2 block text-sm font-semibold"
              >
                Admin Email
              </label>

              <input
                id="reset-email"
                name="reset-email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(event) =>
                  setEmail(
                    event.target.value
                  )
                }
                placeholder="admin@example.com"
                className="w-full rounded-xl border border-zinc-300 px-4 py-3 outline-none transition focus:border-amber-600 focus:ring-2 focus:ring-amber-100"
              />
            </div>

            {/* ERROR */}

            {error && (
              <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700">
                {error}
              </div>
            )}

            {/* SUCCESS */}

            {success && (
              <div className="mt-5 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm leading-6 text-green-700">
                {success}
              </div>
            )}

            {/* SEND BUTTON */}

            <button
              type="submit"
              disabled={resetLoading}
              className="mt-6 w-full rounded-full bg-zinc-900 px-6 py-4 font-semibold text-white transition hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {resetLoading
                ? "Sending Reset Link..."
                : "Send Reset Link"}
            </button>

            {/* BACK TO LOGIN */}

            <button
              type="button"
              onClick={() => {
                setShowForgotPassword(
                  false
                );
                setError("");
                setSuccess("");
              }}
              className="mt-4 w-full rounded-full border border-zinc-300 bg-white px-6 py-4 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-100"
            >
              ← Back to Login
            </button>

          </form>
        )}

        {/* STORE LINK */}

        <a
          href="/"
          className="mt-6 block text-center text-sm text-zinc-500 transition hover:text-zinc-900"
        >
          ← Back to Store
        </a>

      </div>
    </main>
  );
}