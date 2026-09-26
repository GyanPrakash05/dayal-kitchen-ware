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

type CartItem = {
  id?: string | number;
  name: string;
  slug: string;
  price: string | number;
  image: string;
  quantity: number;
};

function getPriceValue(
  price: string | number
): number {
  if (typeof price === "number") {
    return Number.isFinite(price) ? price : 0;
  }

  const value = Number(
    String(price).replace(/[₹,\s]/g, "")
  );

  return Number.isFinite(value) ? value : 0;
}

export default function CheckoutPage() {
  const router = useRouter();

  const {
    cart,
    clearCart,
  } = useCart();

  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [placingOrder, setPlacingOrder] =
    useState(false);
  const [error, setError] = useState("");

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [pincode, setPincode] = useState("");

  /* =========================================================
     LOAD AUTH USER
  ========================================================= */

  useEffect(() => {
    let mounted = true;

    async function loadUser() {
      try {
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (
          sessionError ||
          !session?.user
        ) {
          router.replace(
            "/login?redirect=/checkout"
          );
          return;
        }

        if (!mounted) return;

        const currentUser = session.user;

        setUser(currentUser);

        const savedName =
          currentUser.user_metadata?.full_name ||
          currentUser.user_metadata?.name ||
          "";

        setFullName(savedName);

      } catch (err) {
        console.error(
          "CHECKOUT USER ERROR:",
          err
        );

        if (mounted) {
          router.replace(
            "/login?redirect=/checkout"
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadUser();

    return () => {
      mounted = false;
    };
  }, [router]);

  /* =========================================================
     SUBTOTAL
  ========================================================= */

  const subtotal = useMemo(() => {
    return cart.reduce(
      (sum, item: CartItem) => {
        const price =
          getPriceValue(item.price);

        const quantity = Math.max(
          1,
          Number(item.quantity) || 1
        );

        return (
          sum +
          price * quantity
        );
      },
      0
    );
  }, [cart]);

  /* =========================================================
     DELIVERY CHARGE
  ========================================================= */

  const deliveryCharge = useMemo(() => {
    if (subtotal >= 800) {
      return 0;
    }

    if (subtotal >= 350) {
      return 30;
    }

    return 45;
  }, [subtotal]);

  /* =========================================================
     TOTAL
  ========================================================= */

  const total =
    subtotal + deliveryCharge;

  /* =========================================================
     PLACE ORDER
  ========================================================= */

  async function handlePlaceOrder(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (placingOrder) {
      return;
    }

    setError("");

    /* =======================================================
       CHECK USER
    ======================================================= */

    if (!user) {
      router.replace(
        "/login?redirect=/checkout"
      );
      return;
    }

    /* =======================================================
       CHECK CART
    ======================================================= */

    if (!cart || cart.length === 0) {
      setError(
        "Your cart is empty. Please add products before placing your order."
      );
      return;
    }

    /* =======================================================
       CLEAN FORM DATA
    ======================================================= */

    const cleanName =
      fullName.trim();

    const cleanPhone =
      phone.replace(/\D/g, "");

    const cleanAddress =
      address.trim();

    const cleanCity =
      city.trim();

    const cleanPincode =
      pincode.replace(/\D/g, "");

    /* =======================================================
       VALIDATION
    ======================================================= */

    if (!cleanName) {
      setError(
        "Please enter your full name."
      );
      return;
    }

    if (
      !/^[6-9]\d{9}$/.test(
        cleanPhone
      )
    ) {
      setError(
        "Please enter a valid 10-digit Indian mobile number."
      );
      return;
    }

    if (!cleanAddress) {
      setError(
        "Please enter your complete delivery address."
      );
      return;
    }

    if (!cleanCity) {
      setError(
        "Please enter your city."
      );
      return;
    }

    if (
      !/^\d{6}$/.test(
        cleanPincode
      )
    ) {
      setError(
        "Please enter a valid 6-digit pincode."
      );
      return;
    }

    /* =======================================================
       START
    ======================================================= */

    setPlacingOrder(true);

    try {
      /* =====================================================
         GET FRESH SESSION
      ===================================================== */

      const {
        data: sessionResult,
        error: sessionError,
      } =
        await supabase.auth.getSession();

      if (
        sessionError ||
        !sessionResult.session
      ) {
        setError(
          "Your login session has expired. Please login again."
        );

        setPlacingOrder(false);

        router.replace(
          "/login?redirect=/checkout"
        );

        return;
      }

      const session =
        sessionResult.session;

      const currentUser =
        session.user;

      /* =====================================================
         PREPARE CART ITEMS
      ===================================================== */

      const orderItems = cart.map(
        (item: CartItem) => {
          const price =
            getPriceValue(
              item.price
            );

          const quantity =
            Math.max(
              1,
              Number(item.quantity) || 1
            );

          return {
            id:
              item.id ?? null,

            name:
              String(
                item.name || ""
              ).trim(),

            slug:
              item.slug
                ? String(
                    item.slug
                  ).trim()
                : null,

            price,

            quantity,

            image:
              item.image
                ? String(
                    item.image
                  )
                : null,
          };
        }
      );

      /* =====================================================
         FINAL SAFETY CHECK
      ===================================================== */

      const validItems =
        orderItems.filter(
          (item) =>
            item.name &&
            item.price > 0 &&
            item.quantity > 0
        );

      if (
        validItems.length === 0
      ) {
        setError(
          "Your cart contains invalid products. Please remove them and add the products again."
        );

        setPlacingOrder(false);

        return;
      }

      /* =====================================================
         API REQUEST
      ===================================================== */

      console.log(
        "PLACING ORDER:",
        {
          userId:
            currentUser.id,
          items:
            validItems,
          subtotal,
          deliveryCharge,
          total,
        }
      );

      const response =
        await fetch(
          "/api/orders",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",

              Authorization:
                `Bearer ${session.access_token}`,
            },

            body: JSON.stringify({
              customer_name:
                cleanName,

              customer_email:
                currentUser.email ||
                "",

              customer_phone:
                cleanPhone,

              delivery_address:
                cleanAddress,

              city:
                cleanCity,

              pincode:
                cleanPincode,

              items:
                validItems,

              subtotal,

              delivery_charge:
                deliveryCharge,
            }),
          }
        );

      /* =====================================================
         READ API RESPONSE
      ===================================================== */

      let result: any = null;

      const responseText =
        await response.text();

      try {
        result =
          responseText
            ? JSON.parse(
                responseText
              )
            : null;
      } catch {
        console.error(
          "INVALID API RESPONSE:",
          responseText
        );
      }

      console.log(
        "ORDER API RESPONSE:",
        {
          status:
            response.status,
          result,
        }
      );

      /* =====================================================
         API ERROR
      ===================================================== */

      if (
        !response.ok ||
        !result?.success
      ) {
        if (
          response.status === 401
        ) {
          setError(
            "Your login session has expired. Please login again."
          );

          setPlacingOrder(false);

          router.replace(
            "/login?redirect=/checkout"
          );

          return;
        }

        setError(
          result?.error ||
            `Order could not be created. Server returned ${response.status}.`
        );

        setPlacingOrder(false);

        return;
      }

      /* =====================================================
         ORDER CREATED
      ===================================================== */

      const createdOrder =
        result.order;

      if (
        !createdOrder ||
        !createdOrder.id
      ) {
        console.error(
          "ORDER ID MISSING:",
          result
        );

        setError(
          "Order was created, but the order ID was not returned."
        );

        setPlacingOrder(false);

        return;
      }

      console.log(
        "ORDER SUCCESS:",
        createdOrder
      );

      /* =====================================================
         CLEAR CART
      ===================================================== */

      clearCart();

      /* =====================================================
         GO TO ACCOUNT / ORDER
      ===================================================== */

      router.replace(
        `/account?order=${encodeURIComponent(
          String(createdOrder.id)
        )}`
      );

    } catch (err) {
      console.error(
        "PLACE ORDER ERROR:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while placing your order."
      );

      setPlacingOrder(false);
    }
  }

  /* =========================================================
     LOADING
  ========================================================= */

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#faf9f6]">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-[#5c4033] border-t-transparent" />

          <p className="mt-4 text-sm text-zinc-500">
            Loading checkout...
          </p>
        </div>
      </main>
    );
  }

  /* =========================================================
     EMPTY CART
  ========================================================= */

  if (cart.length === 0) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#faf9f6] px-4">
        <div className="w-full max-w-md rounded-3xl border border-[#e5ddd4] bg-white p-8 text-center shadow-sm">
          <div className="text-5xl">
            🛒
          </div>

          <h1 className="mt-5 text-2xl font-bold text-[#5c4033]">
            Your cart is empty
          </h1>

          <p className="mt-2 text-sm text-zinc-500">
            Add some products before
            proceeding to checkout.
          </p>

          <Link
            href="/#products"
            className="mt-6 inline-block rounded-full bg-[#5c4033] px-7 py-3 text-sm font-semibold text-white transition hover:bg-[#a65f00]"
          >
            Continue Shopping
          </Link>
        </div>
      </main>
    );
  }

  /* =========================================================
     CHECKOUT UI
  ========================================================= */

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
            Enter your delivery details
            to place your order.
          </p>
        </div>

        <form
          onSubmit={handlePlaceOrder}
          className="grid gap-6 lg:grid-cols-[1fr_380px]"
        >

          {/* =================================================
              DELIVERY DETAILS
          ================================================= */}

          <div className="rounded-3xl border border-[#e5ddd4] bg-white p-6 shadow-sm sm:p-8">

            <h2 className="text-xl font-bold text-[#5c4033]">
              Delivery Details
            </h2>

            <p className="mt-1 text-sm text-zinc-500">
              Enter the address where you
              want your order delivered.
            </p>

            <div className="mt-7 space-y-5">

              {/* NAME */}

              <div>
                <label className="mb-2 block text-sm font-semibold text-zinc-700">
                  Full Name
                </label>

                <input
                  type="text"
                  value={fullName}
                  onChange={(e) =>
                    setFullName(
                      e.target.value
                    )
                  }
                  placeholder="Enter your full name"
                  required
                  disabled={
                    placingOrder
                  }
                  className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#5c4033] focus:ring-1 focus:ring-[#5c4033] disabled:bg-zinc-100"
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
                        .replace(
                          /\D/g,
                          ""
                        )
                        .slice(
                          0,
                          10
                        )
                    )
                  }
                  placeholder="10-digit mobile number"
                  required
                  disabled={
                    placingOrder
                  }
                  className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#5c4033] focus:ring-1 focus:ring-[#5c4033] disabled:bg-zinc-100"
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
                    setAddress(
                      e.target.value
                    )
                  }
                  placeholder="House no., street, area, landmark..."
                  rows={4}
                  required
                  disabled={
                    placingOrder
                  }
                  className="w-full resize-none rounded-xl border border-zinc-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#5c4033] focus:ring-1 focus:ring-[#5c4033] disabled:bg-zinc-100"
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
                      setCity(
                        e.target.value
                      )
                    }
                    placeholder="Enter city"
                    required
                    disabled={
                      placingOrder
                    }
                    className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#5c4033] focus:ring-1 focus:ring-[#5c4033] disabled:bg-zinc-100"
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
                          .replace(
                            /\D/g,
                            ""
                          )
                          .slice(
                            0,
                            6
                          )
                      )
                    }
                    placeholder="6-digit pincode"
                    required
                    disabled={
                      placingOrder
                    }
                    className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#5c4033] focus:ring-1 focus:ring-[#5c4033] disabled:bg-zinc-100"
                  />
                </div>

              </div>

            </div>

            {/* ERROR */}

            {error && (
              <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-4 text-sm font-medium text-red-600">
                {error}
              </div>
            )}

          </div>

          {/* =================================================
              ORDER SUMMARY
          ================================================= */}

          <div className="h-fit rounded-3xl border border-[#e5ddd4] bg-white p-6 shadow-sm sm:p-7 lg:sticky lg:top-24">

            <h2 className="text-xl font-bold text-[#5c4033]">
              Order Summary
            </h2>

            <div className="mt-6 space-y-4">

              {cart.map(
                (
                  item: CartItem
                ) => {
                  const price =
                    getPriceValue(
                      item.price
                    );

                  const quantity =
                    Math.max(
                      1,
                      Number(
                        item.quantity
                      ) || 1
                    );

                  const itemTotal =
                    price *
                    quantity;

                  return (
                    <div
                      key={
                        item.slug
                      }
                      className="flex gap-3 border-b border-zinc-100 pb-4"
                    >

                      <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-[#eee8dc]">
                        {item.image ? (
                          <img
                            src={
                              item.image
                            }
                            alt={
                              item.name
                            }
                            className="h-full w-full object-contain p-2"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-xl">
                            🍳
                          </div>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="line-clamp-2 text-sm font-semibold text-zinc-800">
                          {
                            item.name
                          }
                        </p>

                        <p className="mt-1 text-xs text-zinc-500">
                          Qty:{" "}
                          {
                            quantity
                          }
                        </p>
                      </div>

                      <p className="shrink-0 text-sm font-bold text-[#5c4033]">
                        ₹
                        {itemTotal.toLocaleString(
                          "en-IN"
                        )}
                      </p>

                    </div>
                  );
                }
              )}

            </div>

            {/* PRICE BREAKDOWN */}

            <div className="mt-6 space-y-3">

              <div className="flex justify-between">
                <span className="text-sm text-zinc-500">
                  Subtotal
                </span>

                <span className="text-sm font-semibold">
                  ₹
                  {subtotal.toLocaleString(
                    "en-IN"
                  )}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-sm text-zinc-500">
                  Delivery Fee
                </span>

                <span
                  className={
                    deliveryCharge === 0
                      ? "text-sm font-semibold text-green-600"
                      : "text-sm font-semibold"
                  }
                >
                  {deliveryCharge ===
                  0
                    ? "FREE"
                    : `₹${deliveryCharge}`}
                </span>
              </div>

            </div>

            <div className="my-5 border-t border-zinc-200" />

            {/* TOTAL */}

            <div className="flex items-center justify-between">
              <span className="font-semibold text-[#5c4033]">
                Total
              </span>

              <span className="text-2xl font-bold text-[#5c4033]">
                ₹
                {total.toLocaleString(
                  "en-IN"
                )}
              </span>
            </div>

            {/* BUTTON */}

            <button
              type="submit"
              disabled={
                placingOrder
              }
              className="mt-6 flex w-full items-center justify-center rounded-full bg-[#5c4033] py-4 text-sm font-semibold text-white shadow-lg transition hover:bg-[#a65f00] hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60"
            >
              {placingOrder ? (
                <>
                  <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Placing Order...
                </>
              ) : (
                "Place Order →"
              )}
            </button>

            <p className="mt-3 text-center text-[11px] leading-5 text-zinc-400">
              Your order will be created
              with payment status pending.
            </p>

          </div>

        </form>
      </div>
    </main>
  );
}