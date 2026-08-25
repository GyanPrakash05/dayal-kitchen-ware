"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../lib/supabase";

type UserData = {
  email?: string;
  full_name?: string;
};

export default function AccountPage() {
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        window.location.href = "/login";
        return;
      }

      setUser({
        email: user.email,
        full_name: user.user_metadata?.full_name || "Customer",
      });

      setLoading(false);
    }

    loadUser();
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#faf9f6]">
        <p className="text-sm text-zinc-500">Loading account...</p>
      </main>
    );
  }

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

          <div className="flex items-center gap-4">

            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-zinc-900 text-xl font-bold text-white">
              {user?.full_name?.charAt(0).toUpperCase()}
            </div>

            <div>
              <p className="text-xl font-bold">
                {user?.full_name}
              </p>

              <p className="mt-1 text-sm text-zinc-500">
                {user?.email}
              </p>
            </div>

          </div>

        </section>

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

      </div>
    </main>
  );
}