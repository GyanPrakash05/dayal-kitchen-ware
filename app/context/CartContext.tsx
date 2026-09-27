"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

type Product = {
  id: string | number;
  name: string;
  slug: string;
  price: string | number;
  image: string;
};

type CartItem = Product & {
  quantity: number;
};

type CartContextType = {
  cart: CartItem[];
  loaded: boolean;
  addToCart: (product: Product) => void;
  removeFromCart: (slug: string) => void;
  updateQuantity: (slug: string, quantity: number) => void;
  clearCart: () => void;
};

const CartContext = createContext<CartContextType | undefined>(
  undefined
);

const CART_STORAGE_KEY = "dayal-kitchen-cart";

function getPriceValue(price: string | number): number {
  if (typeof price === "number") {
    return Number.isFinite(price) ? price : 0;
  }

  return (
    Number(
      price.replace(/[₹,\s]/g, "")
    ) || 0
  );
}

export function CartProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  /* =========================================================
     LOAD CART
  ========================================================= */

  useEffect(() => {
    try {
      const savedCart =
        localStorage.getItem(CART_STORAGE_KEY);

      if (savedCart) {
        const parsedCart =
          JSON.parse(savedCart);

        if (Array.isArray(parsedCart)) {
          // Only keep cart items that have a valid database ID.
          const validCart = parsedCart.filter(
            (item) =>
              item &&
              item.id &&
              item.name &&
              item.slug
          );

          setCart(validCart);
        }
      }
    } catch (error) {
      console.error(
        "Failed to load cart:",
        error
      );
    } finally {
      setLoaded(true);
    }
  }, []);

  /* =========================================================
     SAVE CART
  ========================================================= */

  useEffect(() => {
    if (!loaded) return;

    try {
      localStorage.setItem(
        CART_STORAGE_KEY,
        JSON.stringify(cart)
      );
    } catch (error) {
      console.error(
        "Failed to save cart:",
        error
      );
    }
  }, [cart, loaded]);

  /* =========================================================
     ADD TO CART
  ========================================================= */

  function addToCart(product: Product) {
    setCart((currentCart) => {
      const existingItem =
        currentCart.find(
          (item) =>
            item.slug === product.slug
        );

      if (existingItem) {
        return currentCart.map((item) =>
          item.slug === product.slug
            ? {
                ...item,
                id: product.id,
                quantity:
                  item.quantity + 1,
              }
            : item
        );
      }

      return [
        ...currentCart,
        {
          id: product.id,
          name: product.name,
          slug: product.slug,
          price: getPriceValue(
            product.price
          ),
          image: product.image,
          quantity: 1,
        },
      ];
    });
  }

  /* =========================================================
     REMOVE
  ========================================================= */

  function removeFromCart(slug: string) {
    setCart((currentCart) =>
      currentCart.filter(
        (item) =>
          item.slug !== slug
      )
    );
  }

  /* =========================================================
     UPDATE QUANTITY
  ========================================================= */

  function updateQuantity(
    slug: string,
    quantity: number
  ) {
    if (quantity <= 0) {
      removeFromCart(slug);
      return;
    }

    setCart((currentCart) =>
      currentCart.map((item) =>
        item.slug === slug
          ? {
              ...item,
              quantity,
            }
          : item
      )
    );
  }

  /* =========================================================
     CLEAR CART
  ========================================================= */

  function clearCart() {
    setCart([]);
  }

  return (
    <CartContext.Provider
      value={{
        cart,
        loaded,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

/* =========================================================
   USE CART
========================================================= */

export function useCart() {
  const context =
    useContext(CartContext);

  if (!context) {
    throw new Error(
      "useCart must be used inside CartProvider"
    );
  }

  return context;
}