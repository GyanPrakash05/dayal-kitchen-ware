"use client";

import Image from "next/image";
import { useCart } from "../context/CartContext";

export default function CartPage() {
  const { cart, removeFromCart, updateQuantity } = useCart();

  const total = cart.reduce(
    (sum, item) =>
      sum +
      parseInt(item.price.replace(/[₹,]/g, "")) * item.quantity,
    0
  );

  return (
    <main className="min-h-screen bg-[#faf9f6] p-6">
      <div className="mx-auto max-w-5xl">
        <a
          href="/"
          className="inline-block py-6 text-sm font-semibold hover:text-amber-700"
        >
          ← Back to Shop
        </a>

        <h1 className="mt-4 text-4xl font-bold">
          Your Cart
        </h1>

        {cart.length === 0 ? (
          <div className="mt-10 rounded-3xl bg-white p-8 shadow-sm">
            <p className="text-zinc-500">
              Your cart is currently empty.
            </p>
          </div>
        ) : (
          <div className="mt-10 space-y-6">
            {cart.map((item) => (
              <div
                key={item.slug}
                className="flex flex-col gap-6 rounded-3xl bg-white p-6 shadow-sm md:flex-row md:items-center"
              >
                <div className="flex h-32 w-32 items-center justify-center rounded-2xl bg-[#eee8dc]">
                  <Image
                    src={item.image}
                    alt={item.name}
                    width={120}
                    height={120}
                    className="h-full w-full object-contain p-3"
                  />
                </div>

                <div className="flex-1">
                  <h2 className="text-xl font-bold">
                    {item.name}
                  </h2>

                  <p className="mt-2 text-lg font-semibold">
                    {item.price}
                  </p>

                  <div className="mt-4 flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() =>
                        updateQuantity(
                          item.slug,
                          item.quantity - 1
                        )
                      }
                      className="h-9 w-9 rounded-full border font-bold hover:bg-zinc-100"
                    >
                      −
                    </button>

                    <span className="min-w-6 text-center font-semibold">
                      {item.quantity}
                    </span>

                    <button
                      type="button"
                      onClick={() =>
                        updateQuantity(
                          item.slug,
                          item.quantity + 1
                        )
                      }
                      className="h-9 w-9 rounded-full border font-bold hover:bg-zinc-100"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-xl font-bold">
                    ₹
                    {(
                      parseInt(
                        item.price.replace(/[₹,]/g, "")
                      ) * item.quantity
                    ).toLocaleString("en-IN")}
                  </p>

                  <button
                    type="button"
                    onClick={() =>
                      removeFromCart(item.slug)
                    }
                    className="mt-3 text-sm font-semibold text-red-600 hover:underline"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}

            <div className="rounded-3xl bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-lg font-semibold">
                  Total
                </span>

                <span className="text-2xl font-bold">
                  ₹{total.toLocaleString("en-IN")}
                </span>
              </div>

              <a
                href="/checkout"
                className="mt-6 block w-full rounded-full bg-zinc-900 px-8 py-4 text-center font-semibold text-white transition hover:bg-amber-700"
              >
                Proceed to Checkout
              </a>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}