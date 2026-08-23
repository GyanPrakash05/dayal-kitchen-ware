"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/app/lib/supabase";

export default function AdminPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function checkAuth() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.replace("/admin/login");
        return;
      }

      setCheckingAuth(false);
    }

    checkAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        router.replace("/admin/login");
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [router]);

  async function handleLogout() {
    await supabase.auth.signOut();

    router.replace("/admin/login");
    router.refresh();
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setLoading(true);
    setMessage("");

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.replace("/admin/login");
        return;
      }

      const form = event.currentTarget;
      const formData = new FormData(form);

      const response = await fetch("/api/products", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.error || "Something went wrong.");
        return;
      }

      setMessage("Product added successfully! ✅");
      form.reset();
    } catch (error) {
      console.error(error);
      setMessage("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (checkingAuth) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#faf9f6]">
        <p className="text-sm text-zinc-500">
          Checking authentication...
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#faf9f6] px-6 py-12 text-zinc-900">
      <div className="mx-auto max-w-3xl">

        {/* HEADER */}

        <div className="mb-10 flex items-start justify-between gap-6">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-700">
              Dayal Kitchen Ware
            </p>

            <h1 className="mt-2 text-4xl font-bold">
              Admin Dashboard
            </h1>

            <p className="mt-3 text-zinc-500">
              Add products to your store.
            </p>
          </div>

          <button
            onClick={handleLogout}
            className="rounded-full border border-zinc-300 bg-white px-5 py-2.5 text-sm font-semibold transition hover:bg-zinc-100"
          >
            Logout
          </button>
        </div>

        {/* PRODUCT FORM */}

        <form
          onSubmit={handleSubmit}
          className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8"
        >
          <div className="grid gap-6 sm:grid-cols-2">

            {/* PRODUCT NAME */}

            <div className="sm:col-span-2">
              <label className="mb-2 block text-sm font-semibold">
                Product Name
              </label>

              <input
                name="name"
                required
                placeholder="Premium Non-Stick Kadai"
                className="w-full rounded-xl border border-zinc-300 px-4 py-3 outline-none transition focus:border-amber-600"
              />
            </div>

            {/* CATEGORY */}

            <div>
              <label className="mb-2 block text-sm font-semibold">
                Category
              </label>

              <input
                name="category"
                required
                placeholder="Cookware"
                className="w-full rounded-xl border border-zinc-300 px-4 py-3 outline-none transition focus:border-amber-600"
              />
            </div>

            {/* PRICE */}

            <div>
              <label className="mb-2 block text-sm font-semibold">
                Price
              </label>

              <input
                name="price"
                required
                type="number"
                placeholder="1499"
                className="w-full rounded-xl border border-zinc-300 px-4 py-3 outline-none transition focus:border-amber-600"
              />
            </div>

            {/* OLD PRICE */}

            <div>
              <label className="mb-2 block text-sm font-semibold">
                Old Price
              </label>

              <input
                name="oldPrice"
                type="number"
                placeholder="1999"
                className="w-full rounded-xl border border-zinc-300 px-4 py-3 outline-none transition focus:border-amber-600"
              />
            </div>

            {/* BADGE */}

            <div>
              <label className="mb-2 block text-sm font-semibold">
                Badge
              </label>

              <select
                name="badge"
                className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 outline-none transition focus:border-amber-600"
              >
                <option value="">No Badge</option>
                <option value="NEW">NEW</option>
                <option value="POPULAR">POPULAR</option>
                <option value="BEST SELLER">
                  BEST SELLER
                </option>
                <option value="SALE">SALE</option>
              </select>
            </div>

            {/* IMAGE */}

            <div className="sm:col-span-2">
              <label className="mb-2 block text-sm font-semibold">
                Product Image
              </label>

              <input
                name="image"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                required
                className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-3"
              />

              <p className="mt-2 text-xs text-zinc-500">
                JPG, PNG or WEBP • Maximum 5MB
              </p>
            </div>

            {/* DESCRIPTION */}

            <div className="sm:col-span-2">
              <label className="mb-2 block text-sm font-semibold">
                Description
              </label>

              <textarea
                name="description"
                required
                rows={5}
                placeholder="Describe your product..."
                className="w-full resize-none rounded-xl border border-zinc-300 px-4 py-3 outline-none transition focus:border-amber-600"
              />
            </div>
          </div>

          {/* SUBMIT */}

          <button
            type="submit"
            disabled={loading}
            className="mt-8 w-full rounded-full bg-zinc-900 px-6 py-4 font-semibold text-white transition hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Adding Product..." : "Add Product"}
          </button>

          {message && (
            <p className="mt-5 text-center text-sm font-medium">
              {message}
            </p>
          )}
        </form>
      </div>
    </main>
  );
}