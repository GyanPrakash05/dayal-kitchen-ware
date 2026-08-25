"use client";

import Image from "next/image";
import Link from "next/link";
import { useCart } from "../context/CartContext";

function getPriceValue(price: string | number): number {
  if (typeof price === "number") {
    return price;
  }

  return Number(price.replace(/[₹,\s]/g, "")) || 0;
}

export default function CartPage() {
  const {
    cart,
    removeFromCart,
    updateQuantity,
  } = useCart();

  const total = cart.reduce(
    (sum, item) =>
      sum +
      getPriceValue(item.price) * item.quantity,
    0
  );

  return (
    <main className="min-h-screen bg-[#faf9f6] px-4 py-6 text-[#4a3728] sm:px-6 sm:py-8">
      <div className="mx-auto max-w-5xl">

        {/* BACK */}
        <Link
          href="/"
          className="inline-block py-4 text-sm font-semibold text-[#806a58] transition hover:text-[#a65f00]"
        >
          ← Back to Shop
        </Link>

        {/* TITLE */}
        <div className="mt-4">
          <h1 className="text-3xl font-bold tracking-tight text-[#5c4033] sm:text-4xl">
            Your Cart
          </h1>

          <p className="mt-2 text-sm text-[#8b7868]">
            Review your products before checkout.
          </p>
        </div>

        {/* EMPTY CART */}
        {cart.length === 0 ? (
          <div className="mt-10 rounded-3xl border border-[#e5ddd4] bg-white p-8 text-center shadow-sm sm:p-12">

            <div className="text-5xl">
              🛒
            </div>

            <h2 className="mt-5 text-2xl font-bold text-[#5c4033]">
              Your cart is empty
            </h2>

            <p className="mt-2 text-sm text-[#8b7868]">
              Add some products to your cart
              before checking out.
            </p>

            <Link
              href="/#products"
              className="mt-6 inline-block rounded-full bg-[#5c4033] px-7 py-3 text-sm font-semibold text-white transition hover:bg-[#a65f00]"
            >
              Continue Shopping
            </Link>

          </div>
        ) : (
          <div className="mt-10 space-y-6">

            {/* CART ITEMS */}
            {cart.map((item) => {
              const price = getPriceValue(item.price);

              const itemTotal =
                price * item.quantity;

              return (
                <div
                  key={item.slug}
                  className="flex flex-col gap-5 rounded-3xl border border-[#e5ddd4] bg-white p-5 shadow-sm transition hover:shadow-md sm:p-6 md:flex-row md:items-center"
                >

                  {/* IMAGE */}
                  <div className="flex h-32 w-full shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-[#f1e8dc] sm:w-32">

                    {item.image ? (
                      <Image
                        src={item.image}
                        alt={item.name}
                        width={120}
                        height={120}
                        className="h-full w-full object-contain p-3"
                      />
                    ) : (
                      <span className="text-4xl">
                        🍳
                      </span>
                    )}

                  </div>

                  {/* PRODUCT INFO */}
                  <div className="min-w-0 flex-1">

                    {/* PRODUCT NAME */}
                    <h2 className="text-lg font-bold text-[#5c4033] sm:text-xl">
                      {item.name}
                    </h2>

                    {/* PRICE */}
                    <p className="mt-2 text-base font-semibold text-[#a65f00]">
                      ₹{price.toLocaleString("en-IN")}
                    </p>

                    {/* QUANTITY */}
                    <div className="mt-4 flex items-center gap-3">

                      <span className="mr-1 text-sm font-medium text-[#8b7868]">
                        Qty
                      </span>

                      <button
                        type="button"
                        onClick={() =>
                          updateQuantity(
                            item.slug,
                            item.quantity - 1
                          )
                        }
                        className="flex h-9 w-9 items-center justify-center rounded-full border border-[#d8c9bb] bg-[#faf7f3] text-lg font-bold text-[#5c4033] transition hover:border-[#a65f00] hover:bg-[#f3e8d8]"
                      >
                        −
                      </button>

                      <span className="min-w-7 text-center font-bold text-[#5c4033]">
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
                        className="flex h-9 w-9 items-center justify-center rounded-full border border-[#d8c9bb] bg-[#faf7f3] text-lg font-bold text-[#5c4033] transition hover:border-[#a65f00] hover:bg-[#f3e8d8]"
                      >
                        +
                      </button>

                    </div>

                  </div>

                  {/* TOTAL + REMOVE */}
                  <div className="flex items-center justify-between border-t border-[#eee6de] pt-4 md:block md:border-0 md:pt-0 md:text-right">

                    <div>

                      {/* ITEM TOTAL */}
                      <p className="text-xl font-bold text-[#5c4033]">
                        ₹{itemTotal.toLocaleString("en-IN")}
                      </p>

                      <button
                        type="button"
                        onClick={() =>
                          removeFromCart(item.slug)
                        }
                        className="mt-2 text-sm font-semibold text-[#b45345] transition hover:text-red-700 hover:underline"
                      >
                        Remove
                      </button>

                    </div>

                  </div>

                </div>
              );
            })}

            {/* SUMMARY */}
            <div className="rounded-3xl border border-[#e5ddd4] bg-white p-6 shadow-sm sm:p-7">

              <div className="flex items-center justify-between">

                <span className="text-lg font-semibold text-[#6b5543]">
                  Cart Total
                </span>

                <span className="text-2xl font-bold text-[#5c4033]">
                  ₹{total.toLocaleString("en-IN")}
                </span>

              </div>

              <Link
                href="/checkout"
                className="mt-6 block w-full rounded-full bg-[#5c4033] px-8 py-4 text-center text-sm font-semibold text-white shadow-sm transition hover:bg-[#a65f00] hover:shadow-md"
              >
                Proceed to Checkout →
              </Link>

              <p className="mt-3 text-center text-xs text-[#a18f7e]">
                Delivery charges will be
                calculated at checkout.
              </p>

            </div>

          </div>
        )}

      </div>
    </main>
  );
}