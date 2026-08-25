"use client";

import { useState } from "react";
import { useCart } from "../context/CartContext";

type Product = {
  name: string;
  slug: string;
  price: number;
  image: string;
};

export default function AddToCartButton({
  product,
}: {
  product: Product;
}) {
  const { addToCart } = useCart();
  const [added, setAdded] = useState(false);

  const handleAddToCart = () => {
    addToCart({
      ...product,
      image: product.image ?? "",
    });

    setAdded(true);
  };

  return (
    <div className="w-full">
      {!added ? (
        <button
          type="button"
          onClick={handleAddToCart}
          className="w-full rounded-full bg-zinc-900 px-6 py-4 text-center font-semibold text-white shadow-sm transition-all duration-300 hover:bg-amber-700 hover:shadow-lg active:scale-[0.98]"
        >
          🛒 Add to Cart
        </button>
      ) : (
        <div className="space-y-3">
          {/* ADDED SUCCESS */}

          <div className="flex w-full items-center justify-center gap-2 rounded-full bg-green-600 px-6 py-4 font-semibold text-white shadow-lg">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20">
              ✓
            </span>

            <span>Added to Cart</span>
          </div>

          {/* VIEW CART */}

          <a
            href="/cart"
            className="flex w-full items-center justify-center gap-2 rounded-full border-2 border-zinc-900 bg-white px-6 py-4 font-semibold text-zinc-900 transition-all duration-300 hover:bg-zinc-900 hover:text-white"
          >
            View Cart
            <span>→</span>
          </a>
        </div>
      )}
    </div>
  );
}