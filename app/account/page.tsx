"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../lib/supabase";

type UserData = {
  id: string;
  email: string;
  full_name: string;
  phone: string;
  provider: string;
};

export default function AccountPage() {
  const [user, setUser] = useState<UserData | null>(null);

  const [loading, setLoading] = useState(true);
  const [savingPhone, setSavingPhone] = useState(false);

  const [phone, setPhone] = useState("");

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function loadUser() {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error || !user) {
        window.location.href = "/login";
        return;
      }

      const metadata = user.user_metadata || {};

      const fullName =
        metadata.full_name ||
        metadata.name ||
        user.email?.split("@")[0] ||
        "Customer";

      const savedPhone =
        metadata.phone ||
        user.phone ||
        "";

      const provider =
        user.app_metadata?.provider || "email";

      setUser({
        id: user.id,
        email: user.email || "",
        full_name: fullName,
        phone: savedPhone,
        provider,
      });

      setPhone(
        savedPhone.startsWith("+91")
          ? savedPhone.replace("+91", "")
          : savedPhone
      );

      setLoading(false);
    }

    loadUser();
  }, []);

  async function handleSavePhone() {
    setError("");
    setMessage("");

    const cleanPhone = phone.replace(/\D/g, "");

    if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
      setError(
        "Please enter a valid 10-digit Indian mobile number."
      );
      return;
    }

    setSavingPhone(true);

    const { data, error } =
      await supabase.auth.updateUser({
        data: {
          phone: cleanPhone,
        },
      });

    if (error) {
      console.error("PHONE UPDATE ERROR:", error);

      setError(
        error.message ||
          "Unable to save your mobile number. Please try again."
      );

      setSavingPhone(false);
      return;
    }

    if (data.user) {
      setUser((current) =>
        current
          ? {
              ...current,
              phone: cleanPhone,
            }
          : current
      );
    }

    setMessage(
      "Mobile number saved successfully."
    );

    setSavingPhone(false);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#faf9f6]">
        <p className="text-sm text-zinc-500">
          Loading account...
        </p>
      </main>
    );
  }

  const phoneMissing = !user?.phone;

  return (
    <main className="min-h-screen bg-[#faf9f6] px-4 py-10 text-zinc-900 sm:px-6">
      <div className="mx-auto max-w-4xl">

        {/* HEADER */}

        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
          <div>
            <Link
              href="/"
              className="text-sm font-semibold text-zinc-500 transition hover:text-zinc-900"
            >
              ← Back to Store
            </Link>

            <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
              My Account
            </h1>

            <p className="mt-2 text-sm text-zinc-500">
              Manage your Dayal Kitchen Ware account.
            </p>
          </div>

          <button
            onClick={handleLogout}
            className="w-fit rounded-full bg-zinc-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-amber-700"
          >
            Logout
          </button>
        </div>

        {/* PROFILE CARD */}

        <section className="mt-8 rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">

          <div className="flex flex-col gap-6 sm:flex-row sm:items-center">

            {/* AVATAR */}

            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-2xl font-bold text-white">
              {user?.full_name?.charAt(0).toUpperCase()}
            </div>

            {/* USER INFO */}

            <div className="min-w-0 flex-1">

              <div className="flex flex-wrap items-center gap-3">

                <p className="text-xl font-bold">
                  {user?.full_name}
                </p>

                {user?.provider === "google" && (
                  <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                    Google Account
                  </span>
                )}

              </div>

              <p className="mt-1 break-all text-sm text-zinc-500">
                {user?.email}
              </p>

            </div>

          </div>

          {/* PROFILE DETAILS */}

          <div className="mt-7 grid gap-4 border-t border-zinc-100 pt-6 sm:grid-cols-2">

            {/* EMAIL */}

            <div className="rounded-2xl bg-[#faf9f6] p-4">

              <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
                Email
              </p>

              <p className="mt-2 break-all text-sm font-semibold text-zinc-900">
                {user?.email}
              </p>

            </div>

            {/* PHONE */}

            <div className="rounded-2xl bg-[#faf9f6] p-4">

              <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
                Mobile Number
              </p>

              {user?.phone ? (
                <p className="mt-2 text-sm font-semibold text-zinc-900">
                  +91 {user.phone}
                </p>
              ) : (
                <p className="mt-2 text-sm font-semibold text-amber-700">
                  Not added
                </p>
              )}

            </div>

          </div>

        </section>

        {/* COMPLETE PROFILE */}

        {phoneMissing && (
          <section className="mt-6 rounded-3xl border border-amber-200 bg-white p-6 shadow-sm sm:p-8">

            <div className="flex items-start gap-4">

              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-50 text-xl">
                📱
              </div>

              <div>
                <h2 className="text-lg font-bold">
                  Complete Your Profile
                </h2>

                <p className="mt-1 text-sm leading-6 text-zinc-500">
                  Add your mobile number so we can contact you
                  about your orders and delivery.
                </p>
              </div>

            </div>

            {/* PHONE INPUT */}

            <div className="mt-6">

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
                  maxLength={10}
                  className="w-full rounded-r-md border border-zinc-500 bg-white px-3 py-3 text-sm text-zinc-900 outline-none transition focus:border-amber-600 focus:ring-2 focus:ring-amber-100"
                />

              </div>

              <p className="mt-2 text-xs text-zinc-500">
                Enter your 10-digit Indian mobile number.
              </p>

            </div>

            {/* ERROR */}

            {error && (
              <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            {/* SUCCESS */}

            {message && (
              <div className="mt-4 rounded-md border border-green-200 bg-green-50 px-3 py-3 text-sm text-green-700">
                {message}
              </div>
            )}

            {/* SAVE */}

            <button
              type="button"
              onClick={handleSavePhone}
              disabled={savingPhone}
              className="mt-5 rounded-full bg-zinc-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {savingPhone
                ? "Saving..."
                : "Save Mobile Number"}
            </button>

          </section>
        )}

        {/* SUCCESS MESSAGE */}

        {!phoneMissing && message && (
          <div className="mt-6 rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            {message}
          </div>
        )}

        {/* ACCOUNT OPTIONS */}

        <div className="mt-6 grid gap-4 sm:grid-cols-2">

          {/* ORDERS */}

          <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">

            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f5efe4] text-xl">
              📦
            </div>

            <h2 className="mt-5 text-lg font-bold">
              My Orders
            </h2>

            <p className="mt-2 text-sm leading-6 text-zinc-500">
              Your order history and delivery status will appear here.
            </p>

            <button
              disabled
              className="mt-5 rounded-full border border-zinc-200 px-5 py-2.5 text-sm font-semibold text-zinc-400"
            >
              Coming Soon
            </button>

          </div>

          {/* ADDRESS */}

          <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">

            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f5efe4] text-xl">
              📍
            </div>

            <h2 className="mt-5 text-lg font-bold">
              Delivery Address
            </h2>

            <p className="mt-2 text-sm leading-6 text-zinc-500">
              Save your delivery address for faster checkout.
            </p>

            <button
              disabled
              className="mt-5 rounded-full border border-zinc-200 px-5 py-2.5 text-sm font-semibold text-zinc-400"
            >
              Coming Soon
            </button>

          </div>

          {/* WHATSAPP */}

          <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">

            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-green-50 text-xl">
              💬
            </div>

            <h2 className="mt-5 text-lg font-bold">
              WhatsApp Updates
            </h2>

            <p className="mt-2 text-sm leading-6 text-zinc-500">
              Get important updates about your orders on WhatsApp.
            </p>

            <div className="mt-5 flex items-center gap-3">
              <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                Coming Soon
              </span>
            </div>

          </div>

          {/* SUPPORT */}

          <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">

            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f5efe4] text-xl">
              💬
            </div>

            <h2 className="mt-5 text-lg font-bold">
              Customer Support
            </h2>

            <p className="mt-2 text-sm leading-6 text-zinc-500">
              Need help with a product or order?
            </p>

            <a
              href="https://wa.me/917011872380"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 inline-block rounded-full bg-green-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-green-700"
            >
              Chat on WhatsApp
            </a>

          </div>

        </div>

        {/* BACK */}

        <Link
          href="/"
          className="mt-8 block text-center text-xs text-zinc-500 hover:text-zinc-900 hover:underline"
        >
          ← Back to store
        </Link>

      </div>
    </main>
  );
}