"use client";

import { createContext, useContext, useState } from "react";


type Product = {
  name: string;
  slug: string;
  price: string;
  image: string;
};

type CartItem = Product & {
  quantity: number;
};

type CartContextType = {
  cart: CartItem[];
  addToCart: (product: Product) => void;
  removeFromCart: (slug: string) => void;
  updateQuantity: (slug: string, quantity: number) => void;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [cart, setCart] = useState<CartItem[]>([]);

  function addToCart(product: Product) {
    setCart((currentCart) => {
      const existing = currentCart.find(
        (item) => item.slug === product.slug
      );

      if (existing) {
        return currentCart.map((item) =>
          item.slug === product.slug
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }

      return [...currentCart, { ...product, quantity: 1 }];
    });
  }

  function removeFromCart(slug: string) {
    setCart((currentCart) =>
      currentCart.filter((item) => item.slug !== slug)
    );
  }

  function updateQuantity(slug: string, quantity: number) {
    if (quantity < 1) {
      removeFromCart(slug);
      return;
    }

    setCart((currentCart) =>
      currentCart.map((item) =>
        item.slug === slug
          ? { ...item, quantity }
          : item
      )
    );
  }

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error("useCart must be used inside CartProvider");
  }

  return context;
}