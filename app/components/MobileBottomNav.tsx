"use client";

import { useEffect, useState } from "react";

const WHATSAPP_NUMBER = "917011872380";

export default function MobileBottomNav() {
  const [active, setActive] = useState("home");
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;

      const sections = [
        "home",
        "categories",
        "products",
        "about",
        "contact",
        "location",
      ];

      let currentSection = "home";

      for (const id of sections) {
        const element = document.getElementById(id);

        if (!element) continue;

        const rect = element.getBoundingClientRect();

        if (rect.top <= 180) {
          currentSection = id;
        }
      }

      setActive(currentSection);

      // Hide slightly while scrolling down, show near top
      if (scrollY < 80) {
        setIsVisible(true);
      }
    };

    window.addEventListener("scroll", handleScroll, {
      passive: true,
    });

    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  function scrollToSection(id: string) {
    const element = document.getElementById(id);

    if (!element) return;

    setActive(id);

    element.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  function openWhatsApp() {
    window.open(
      `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
        "Hello Dayal Kitchen Ware 👋 I have a query about your products."
      )}`,
      "_blank",
      "noopener,noreferrer"
    );
  }

  return (
    <nav
      className={`
        fixed
        bottom-0
        left-0
        right-0
        z-[100]
        px-3
        pb-[calc(0.75rem+env(safe-area-inset-bottom))]
        pt-2
        transition-transform
        duration-300
        md:hidden
        ${
          isVisible
            ? "translate-y-0"
            : "translate-y-full"
        }
      `}
    >
      <div
        className="
          mx-auto
          flex
          max-w-md
          items-center
          justify-around
          rounded-[1.5rem]
          border
          border-zinc-200/80
          bg-white/95
          px-2
          py-2
          shadow-[0_-8px_30px_rgba(0,0,0,0.10)]
          backdrop-blur-xl
        "
      >
        {/* HOME */}

        <button
          type="button"
          onClick={() => scrollToSection("home")}
          className={`
            flex
            min-w-[62px]
            flex-col
            items-center
            justify-center
            gap-1
            rounded-2xl
            px-3
            py-2
            transition-all
            duration-200
            ${
              active === "home"
                ? "bg-zinc-900 text-white shadow-md"
                : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"
            }
          `}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.8}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1V10Z"
            />
          </svg>

          <span className="text-[9px] font-semibold">
            Home
          </span>
        </button>

        {/* CATEGORIES */}

        <button
          type="button"
          onClick={() => scrollToSection("categories")}
          className={`
            flex
            min-w-[62px]
            flex-col
            items-center
            justify-center
            gap-1
            rounded-2xl
            px-3
            py-2
            transition-all
            duration-200
            ${
              active === "categories"
                ? "bg-zinc-900 text-white shadow-md"
                : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"
            }
          `}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.8}
          >
            <rect
              x="3"
              y="3"
              width="7"
              height="7"
              rx="1"
            />

            <rect
              x="14"
              y="3"
              width="7"
              height="7"
              rx="1"
            />

            <rect
              x="3"
              y="14"
              width="7"
              height="7"
              rx="1"
            />

            <rect
              x="14"
              y="14"
              width="7"
              height="7"
              rx="1"
            />
          </svg>

          <span className="text-[9px] font-semibold">
            Categories
          </span>
        </button>

        {/* PRODUCTS */}

        <button
          type="button"
          onClick={() => scrollToSection("products")}
          className={`
            flex
            min-w-[62px]
            flex-col
            items-center
            justify-center
            gap-1
            rounded-2xl
            px-3
            py-2
            transition-all
            duration-200
            ${
              active === "products"
                ? "bg-zinc-900 text-white shadow-md"
                : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"
            }
          `}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.8}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 8h12l1 12H5L6 8Z"
            />

            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 8a3 3 0 0 1 6 0"
            />
          </svg>

          <span className="text-[9px] font-semibold">
            Products
          </span>
        </button>

        {/* LOCATION */}

        <button
          type="button"
          onClick={() => scrollToSection("location")}
          className={`
            flex
            min-w-[62px]
            flex-col
            items-center
            justify-center
            gap-1
            rounded-2xl
            px-3
            py-2
            transition-all
            duration-200
            ${
              active === "location"
                ? "bg-zinc-900 text-white shadow-md"
                : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"
            }
          `}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.8}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z"
            />

            <circle
              cx="12"
              cy="10"
              r="2.5"
            />
          </svg>

          <span className="text-[9px] font-semibold">
            Location
          </span>
        </button>

        {/* WHATSAPP */}

        <button
          type="button"
          onClick={openWhatsApp}
          className="
            flex
            min-w-[62px]
            flex-col
            items-center
            justify-center
            gap-1
            rounded-2xl
            bg-green-600
            px-3
            py-2
            text-white
            shadow-md
            transition-all
            duration-200
            active:scale-95
            hover:bg-green-700
          "
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.8}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M20 11.5a8 8 0 0 1-11.8 7L4 20l1.5-4.1A8 8 0 1 1 20 11.5Z"
            />

            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M8.5 9.5c.2 1.7 1.8 3.3 3.5 4 .5.2 1 .1 1.3-.3l.5-.7"
            />
          </svg>

          <span className="text-[9px] font-semibold">
            WhatsApp
          </span>
        </button>
      </div>
    </nav>
  );
}