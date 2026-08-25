"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

type Product = {
  id?: string | number;
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
    return price;
  }

  return Number(
    price.replace(/[₹,\s]/g, "")
  ) || 0;
}

export function CartProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  // Load cart from localStorage
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem(
        CART_STORAGE_KEY
      );

      if (savedCart) {
        const parsedCart = JSON.parse(savedCart);

        if (Array.isArray(parsedCart)) {
          setCart(parsedCart);
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

  // Save cart to localStorage
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

  function addToCart(product: Product) {
    setCart((currentCart) => {
      const existingItem = currentCart.find(
        (item) => item.slug === product.slug
      );

      if (existingItem) {
        return currentCart.map((item) =>
          item.slug === product.slug
            ? {
                ...item,
                quantity: item.quantity + 1,
              }
            : item
        );
      }

      return [
        ...currentCart,
        {
          ...product,
          price: getPriceValue(product.price),
          quantity: 1,
        },
      ];
    });
  }

  function removeFromCart(slug: string) {
    setCart((currentCart) =>
      currentCart.filter(
        (item) => item.slug !== slug
      )
    );
  }

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

  function clearCart() {
    setCart([]);
  }

  return (
    <CartContext.Provider
      value={{
        cart,
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

export function useCart() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(
      "useCart must be used inside CartProvider"
    );
  }

  return context;
}