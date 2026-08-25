"use client";

import {
  FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";
import { useCart } from "../context/CartContext";

function getPriceValue(price: string | number): number {
  if (typeof price === "number") {
    return price;
  }

  return Number(price.replace(/[₹,\s]/g, "")) || 0;
}

export default function CheckoutPage() {
  const router = useRouter();

  const { cart, clearCart } = useCart();

  const [user, setUser] = useState<any>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [error, setError] = useState("");

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [pincode, setPincode] = useState("");

  /* --------------------------------
     LOAD LOGGED IN USER
  -------------------------------- */

  useEffect(() => {
    async function loadUser() {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error || !user) {
        router.push("/login?redirect=/checkout");
        return;
      }

      setUser(user);

      setFullName(
        user.user_metadata?.full_name || ""
      );

      setLoadingUser(false);
    }

    loadUser();
  }, [router]);

  /* --------------------------------
     SUBTOTAL
  -------------------------------- */

  const subtotal = useMemo(() => {
    return cart.reduce((total, item) => {
      const price = getPriceValue(item.price);

      return (
        total +
        price * Number(item.quantity || 1)
      );
    }, 0);
  }, [cart]);

  /* --------------------------------
     DELIVERY CHARGE
     
     Below ₹350  = ₹45
     ₹350 - ₹799 = ₹30
     ₹800+       = FREE
  -------------------------------- */

  const deliveryCharge = useMemo(() => {
    if (subtotal >= 800) {
      return 0;
    }

    if (subtotal >= 350) {
      return 30;
    }

    return 45;
  }, [subtotal]);

  /* --------------------------------
     FINAL TOTAL
  -------------------------------- */

  const total = subtotal + deliveryCharge;

  /* --------------------------------
     PLACE ORDER
  -------------------------------- */

  async function handlePlaceOrder(
    e: FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    setError("");

    if (!user) {
      router.push("/login?redirect=/checkout");
      return;
    }

    if (cart.length === 0) {
      setError("Your cart is empty.");
      return;
    }

    if (!/^[6-9]\d{9}$/.test(phone.trim())) {
      setError(
        "Please enter a valid 10-digit Indian mobile number."
      );
      return;
    }

    if (!/^\d{6}$/.test(pincode.trim())) {
      setError(
        "Please enter a valid 6-digit pincode."
      );
      return;
    }

    if (!address.trim()) {
      setError(
        "Please enter your delivery address."
      );
      return;
    }

    if (!city.trim()) {
      setError("Please enter your city.");
      return;
    }

    if (!fullName.trim()) {
      setError("Please enter your full name.");
      return;
    }

    setPlacingOrder(true);

    /* --------------------------------
       PREPARE ORDER ITEMS
    -------------------------------- */

    const orderItems = cart.map((item) => ({
      id: item.id || null,
      name: item.name,
      slug: item.slug,
      price: getPriceValue(item.price),
      quantity: Number(item.quantity || 1),
      image: item.image || null,
    }));

    /* --------------------------------
       INSERT ORDER
    -------------------------------- */

    const {
      data,
      error: orderError,
    } = await supabase
      .from("orders")
      .insert({
        user_id: user.id,

        customer_name: fullName.trim(),

        customer_email: user.email || "",

        customer_phone: phone.trim(),

        delivery_address: address.trim(),

        city: city.trim(),

        pincode: pincode.trim(),

        items: orderItems,

        subtotal: subtotal,

        delivery_charge: deliveryCharge,

        cancellation_charge: 0,

        total_amount: total,

        payment_status: "pending",

        order_status: "pending",
      })
      .select()
      .single();

    /* --------------------------------
       HANDLE ERROR
    -------------------------------- */

    if (orderError) {
      console.error(
        "ORDER ERROR:",
        orderError
      );

      setError(
        orderError.message ||
          "Order could not be created."
      );

      setPlacingOrder(false);
      return;
    }

    if (!data) {
      setError(
        "Order could not be created. Please try again."
      );

      setPlacingOrder(false);
      return;
    }

    /* --------------------------------
       CLEAR CART
    -------------------------------- */

    clearCart();

    /* --------------------------------
       GO TO ACCOUNT
    -------------------------------- */

    router.push(
      `/account?order=${data.id}`
    );
  }

  /* --------------------------------
     LOADING
  -------------------------------- */

  if (loadingUser) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#faf9f6]">
        <p className="text-sm text-zinc-500">
          Loading checkout...
        </p>
      </main>
    );
  }

  /* --------------------------------
     EMPTY CART
  -------------------------------- */

  if (cart.length === 0) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#faf9f6] px-4">
        <div className="w-full max-w-md rounded-3xl border border-zinc-200 bg-white p-8 text-center shadow-sm">

          <div className="text-5xl">
            🛒
          </div>

          <h1 className="mt-5 text-2xl font-bold text-[#5c4033]">
            Your cart is empty
          </h1>

          <p className="mt-2 text-sm text-zinc-500">
            Add some products before proceeding
            to checkout.
          </p>

          <Link
            href="/#products"
            className="mt-6 inline-block rounded-full bg-zinc-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-amber-700"
          >
            Continue Shopping
          </Link>

        </div>
      </main>
    );
  }

  /* --------------------------------
     CHECKOUT UI
  -------------------------------- */

  return (
    <main className="min-h-screen bg-[#faf9f6] px-4 py-8 text-zinc-900 sm:px-6 sm:py-12">

      <div className="mx-auto max-w-6xl">

        {/* HEADER */}

        <div className="mb-8">

          <Link
            href="/cart"
            className="text-sm font-semibold text-zinc-500 transition hover:text-[#5c4033]"
          >
            ← Back to Cart
          </Link>

          <h1 className="mt-4 text-3xl font-bold tracking-tight text-[#5c4033] sm:text-4xl">
            Checkout
          </h1>

          <p className="mt-2 text-sm text-zinc-500">
            Enter your delivery details to place
            your order.
          </p>

        </div>

        <form
          onSubmit={handlePlaceOrder}
          className="grid gap-6 lg:grid-cols-[1fr_380px]"
        >

          {/* --------------------------------
              CUSTOMER DETAILS
          -------------------------------- */}

          <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">

            <h2 className="text-xl font-bold text-[#5c4033]">
              Delivery Details
            </h2>

            <p className="mt-1 text-sm text-zinc-500">
              Where should we deliver your order?
            </p>

            <div className="mt-7 space-y-5">

              {/* FULL NAME */}

              <div>
                <label className="mb-2 block text-sm font-semibold text-zinc-700">
                  Full Name
                </label>

                <input
                  type="text"
                  value={fullName}
                  onChange={(e) =>
                    setFullName(e.target.value)
                  }
                  placeholder="Enter your full name"
                  required
                  className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-[#5c4033] focus:ring-1 focus:ring-[#5c4033]"
                />
              </div>

              {/* PHONE */}

              <div>
                <label className="mb-2 block text-sm font-semibold text-zinc-700">
                  Mobile Number
                </label>

                <input
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
                  className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-[#5c4033] focus:ring-1 focus:ring-[#5c4033]"
                />
              </div>

              {/* ADDRESS */}

              <div>
                <label className="mb-2 block text-sm font-semibold text-zinc-700">
                  Delivery Address
                </label>

                <textarea
                  value={address}
                  onChange={(e) =>
                    setAddress(e.target.value)
                  }
                  placeholder="House no., street, area..."
                  rows={4}
                  required
                  className="w-full resize-none rounded-xl border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-[#5c4033] focus:ring-1 focus:ring-[#5c4033]"
                />
              </div>

              {/* CITY + PINCODE */}

              <div className="grid gap-5 sm:grid-cols-2">

                <div>
                  <label className="mb-2 block text-sm font-semibold text-zinc-700">
                    City
                  </label>

                  <input
                    type="text"
                    value={city}
                    onChange={(e) =>
                      setCity(e.target.value)
                    }
                    placeholder="City"
                    required
                    className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-[#5c4033] focus:ring-1 focus:ring-[#5c4033]"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-zinc-700">
                    Pincode
                  </label>

                  <input
                    type="text"
                    inputMode="numeric"
                    value={pincode}
                    onChange={(e) =>
                      setPincode(
                        e.target.value
                          .replace(/\D/g, "")
                          .slice(0, 6)
                      )
                    }
                    placeholder="6-digit pincode"
                    required
                    className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-[#5c4033] focus:ring-1 focus:ring-[#5c4033]"
                  />
                </div>

              </div>

            </div>

            {/* ERROR */}

            {error && (
              <div className="mt-6 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
                {error}
              </div>
            )}

          </div>

          {/* --------------------------------
              ORDER SUMMARY
          -------------------------------- */}

          <div className="h-fit rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-7 lg:sticky lg:top-24">

            <h2 className="text-xl font-bold text-[#5c4033]">
              Order Summary
            </h2>

            {/* PRODUCTS */}

            <div className="mt-6 space-y-4">

              {cart.map((item) => {
                const price =
                  getPriceValue(item.price);

                const quantity =
                  Number(item.quantity || 1);

                const itemTotal =
                  price * quantity;

                return (
                  <div
                    key={item.slug}
                    className="flex gap-3 border-b border-zinc-100 pb-4"
                  >

                    {/* IMAGE */}

                    <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-[#eee8dc]">

                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.name}
                          className="h-full w-full object-contain p-2"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-xl">
                          🍳
                        </div>
                      )}

                    </div>

                    {/* INFO */}

                    <div className="min-w-0 flex-1">

                      <p className="line-clamp-2 text-sm font-semibold text-zinc-800">
                        {item.name}
                      </p>

                      <p className="mt-1 text-xs text-zinc-500">
                        Qty: {quantity}
                      </p>

                    </div>

                    {/* PRICE */}

                    <p className="shrink-0 text-sm font-bold text-[#5c4033]">
                      ₹
                      {itemTotal.toLocaleString(
                        "en-IN"
                      )}
                    </p>

                  </div>
                );
              })}

            </div>

            {/* PRICE DETAILS */}

            <div className="mt-6 space-y-3">

              {/* SUBTOTAL */}

              <div className="flex items-center justify-between">
                <span className="text-sm text-zinc-500">
                  Subtotal
                </span>

                <span className="text-sm font-semibold text-zinc-800">
                  ₹
                  {subtotal.toLocaleString(
                    "en-IN"
                  )}
                </span>
              </div>

              {/* DELIVERY FEE */}

              <div className="flex items-center justify-between">
                <span className="text-sm text-zinc-500">
                  Delivery Fee
                </span>

                <span
                  className={`text-sm font-semibold ${
                    deliveryCharge === 0
                      ? "text-green-600"
                      : "text-zinc-800"
                  }`}
                >
                  {deliveryCharge === 0
                    ? "FREE"
                    : `₹${deliveryCharge}`}
                </span>
              </div>

            </div>

            {/* DIVIDER */}

            <div className="my-5 border-t border-zinc-200" />

            {/* TOTAL */}

            <div className="flex items-center justify-between">

              <span className="text-base font-semibold text-[#5c4033]">
                Total
              </span>

              <span className="text-2xl font-bold text-[#5c4033]">
                ₹
                {total.toLocaleString(
                  "en-IN"
                )}
              </span>

            </div>

            {/* PLACE ORDER */}

            <button
              type="submit"
              disabled={placingOrder}
              className="mt-6 w-full rounded-full bg-zinc-900 py-4 text-sm font-semibold text-white shadow-lg transition hover:bg-amber-700 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60"
            >
              {placingOrder
                ? "Placing Order..."
                : "Place Order →"}
            </button>

            <p className="mt-3 text-center text-[11px] leading-5 text-zinc-400">
              Your order will be created with
              payment status pending.
            </p>

          </div>

        </form>

      </div>

    </main>
  );
}