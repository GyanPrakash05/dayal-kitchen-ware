"use client";

import {
  FormEvent,
  useEffect,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/app/lib/supabase";

export default function ResetPasswordPage() {
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    async function checkRecoverySession() {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session) {
          setError(
            "This password reset link is invalid or has expired. Please request a new reset link."
          );
        }
      } catch (error) {
        console.error(
          "RESET SESSION ERROR:",
          error
        );

        setError(
          "Unable to verify the password reset link."
        );
      } finally {
        setChecking(false);
      }
    }

    checkRecoverySession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (
          event === "PASSWORD_RECOVERY" &&
          session
        ) {
          setError("");
          setChecking(false);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  async function handleResetPassword(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (password.length < 6) {
      setError(
        "Password must be at least 6 characters long."
      );
      return;
    }

    if (password !== confirmPassword) {
      setError(
        "Passwords do not match."
      );
      return;
    }

    setLoading(true);

    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (
        sessionError ||
        !session
      ) {
        throw new Error(
          "Your password reset session has expired. Please request a new reset link."
        );
      }

      const { error: updateError } =
        await supabase.auth.updateUser({
          password,
        });

      if (updateError) {
        throw new Error(
          updateError.message
        );
      }

      setSuccess(
        "Password updated successfully! Redirecting to admin login..."
      );

      setPassword("");
      setConfirmPassword("");

      await supabase.auth.signOut();

      setTimeout(() => {
        router.replace(
          "/admin/login?reset=success"
        );
        router.refresh();
      }, 1800);
    } catch (error) {
      console.error(
        "PASSWORD RESET ERROR:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Failed to update password."
      );
    } finally {
      setLoading(false);
    }
  }

  if (checking) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#faf9f6] px-6">
        <div className="text-center">
          <div className="mx-auto h-9 w-9 animate-spin rounded-full border-4 border-zinc-200 border-t-zinc-900" />

          <p className="mt-4 text-sm text-zinc-500">
            Verifying password reset link...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#faf9f6] px-6 py-12">
      <div className="w-full max-w-md">

        {/* HEADER */}

        <div className="mb-8 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-700">
            Dayal Kitchen Ware
          </p>

          <h1 className="mt-3 text-4xl font-bold">
            Reset Password
          </h1>

          <p className="mt-3 text-zinc-500">
            Create a new password for your
            admin account.
          </p>
        </div>

        {/* FORM */}

        <form
          onSubmit={
            handleResetPassword
          }
          className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8"
        >

          {/* NEW PASSWORD */}

          <div>
            <label
              htmlFor="password"
              className="mb-2 block text-sm font-semibold"
            >
              New Password
            </label>

            <input
              id="password"
              name="password"
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(event) =>
                setPassword(
                  event.target.value
                )
              }
              placeholder="Enter new password"
              autoComplete="new-password"
              className="w-full rounded-xl border border-zinc-300 px-4 py-3 outline-none transition focus:border-amber-600 focus:ring-2 focus:ring-amber-100"
            />

            <p className="mt-2 text-xs text-zinc-500">
              Password must contain at least
              6 characters.
            </p>
          </div>

          {/* CONFIRM PASSWORD */}

          <div className="mt-5">
            <label
              htmlFor="confirmPassword"
              className="mb-2 block text-sm font-semibold"
            >
              Confirm New Password
            </label>

            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              required
              minLength={6}
              value={confirmPassword}
              onChange={(event) =>
                setConfirmPassword(
                  event.target.value
                )
              }
              placeholder="Confirm new password"
              autoComplete="new-password"
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

          {/* BUTTON */}

          <button
            type="submit"
            disabled={
              loading ||
              !!success
            }
            className="mt-6 w-full rounded-full bg-zinc-900 px-6 py-4 font-semibold text-white transition hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading
              ? "Updating Password..."
              : "Update Password"}
          </button>

        </form>

        {/* BACK TO LOGIN */}

        <button
          type="button"
          onClick={() =>
            router.push(
              "/admin/login"
            )
          }
          className="mt-6 block w-full text-center text-sm text-zinc-500 transition hover:text-zinc-900"
        >
          ← Back to Admin Login
        </button>

        {/* STORE */}

        <a
          href="/"
          className="mt-3 block text-center text-sm text-zinc-400 transition hover:text-zinc-900"
        >
          Back to Store
        </a>

      </div>
    </main>
  );
}