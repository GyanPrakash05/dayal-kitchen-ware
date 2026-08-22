"use client";

import { useCart } from "../context/CartContext";

type AddToCartButtonProps = {
  product: {
    name: string;
    slug: string;
    price: string;
    image: string;
  };
};

export default function AddToCartButton({
  product,
}: AddToCartButtonProps) {
  const { addToCart } = useCart();

  function handleAddToCart() {
    addToCart(product);

    const phoneNumber = "917011872380";

    const message = `Hello Dayal Kitchen Ware 👋

I am interested in this product:

Product: ${product.name}
Price: ${product.price}

I would like to know more about this product and availability.`;

    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(
      message
    )}`;

    window.open(whatsappUrl, "_blank");
  }

  return (
    <button
      type="button"
      onClick={handleAddToCart}
      className="relative z-50 mt-8 w-full cursor-pointer rounded-full bg-zinc-900 px-8 py-4 font-semibold text-white transition hover:bg-amber-700"
    >
      Add to Cart & WhatsApp
    </button>
  );
}