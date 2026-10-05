"use client";

import { usePathname, useRouter } from "next/navigation";

export default function MobileBottomNav() {
  const router = useRouter();
  const pathname = usePathname();

  const goHome = () => {
    if (pathname === "/") {
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
      return;
    }

    router.push("/");
  };

  const goToSection = (id: string) => {
    if (pathname === "/") {
      const section = document.getElementById(id);

      if (section) {
        section.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
        return;
      }

      window.location.hash = id;
      return;
    }

    router.push(`/#${id}`);
  };

  const openWhatsApp = () => {
    window.open(
      "https://wa.me/917011872380",
      "_blank",
      "noopener,noreferrer"
    );
  };

  const isHome =
    pathname === "/" || pathname === "";

  return (
    <nav
      className="
        fixed
        bottom-0
        left-0
        right-0
        z-50
        w-full
        border-t
        border-zinc-200
        bg-white/95
        shadow-[0_-4px_18px_rgba(0,0,0,0.08)]
        backdrop-blur-md
        md:hidden
      "
      aria-label="Mobile quick navigation"
    >
      <div
        className="
          mx-auto
          flex
          h-16
          w-full
          max-w-md
          items-stretch
          px-1
          pb-[env(safe-area-inset-bottom)]
        "
      >
        {/* HOME */}
        <button
          type="button"
          onClick={goHome}
          className={`
            flex
            min-w-0
            flex-1
            flex-col
            items-center
            justify-center
            gap-1
            text-[10px]
            font-semibold
            transition-colors
            ${
              isHome
                ? "text-amber-700"
                : "text-zinc-600 active:text-amber-700"
            }
          `}
          aria-label="Home"
        >
          <span
            className="text-lg leading-none"
            aria-hidden="true"
          >
            🏠
          </span>

          <span>Home</span>
        </button>

        {/* CATEGORIES */}
        <button
          type="button"
          onClick={() => goToSection("categories")}
          className="
            flex
            min-w-0
            flex-1
            flex-col
            items-center
            justify-center
            gap-1
            text-[10px]
            font-semibold
            text-zinc-600
            transition-colors
            active:text-amber-700
          "
          aria-label="Categories"
        >
          <span
            className="text-lg leading-none"
            aria-hidden="true"
          >
            🗂️
          </span>

          <span>Categories</span>
        </button>

        {/* PRODUCTS */}
        <button
          type="button"
          onClick={() => goToSection("products")}
          className="
            flex
            min-w-0
            flex-1
            flex-col
            items-center
            justify-center
            gap-1
            text-[10px]
            font-semibold
            text-zinc-600
            transition-colors
            active:text-amber-700
          "
          aria-label="Products"
        >
          <span
            className="text-lg leading-none"
            aria-hidden="true"
          >
            🛍️
          </span>

          <span>Products</span>
        </button>

        {/* LOCATION */}
        <button
          type="button"
          onClick={() => goToSection("location")}
          className="
            flex
            min-w-0
            flex-1
            flex-col
            items-center
            justify-center
            gap-1
            text-[10px]
            font-semibold
            text-zinc-600
            transition-colors
            active:text-amber-700
          "
          aria-label="Location"
        >
          <span
            className="text-lg leading-none"
            aria-hidden="true"
          >
            📍
          </span>

          <span>Location</span>
        </button>

        {/* WHATSAPP */}
        <button
          type="button"
          onClick={openWhatsApp}
          className="
            flex
            min-w-0
            flex-1
            flex-col
            items-center
            justify-center
            gap-1
            text-[10px]
            font-semibold
            text-zinc-600
            transition-colors
            active:text-green-700
          "
          aria-label="WhatsApp"
        >
          <span
            className="text-lg leading-none"
            aria-hidden="true"
          >
            💬
          </span>

          <span>WhatsApp</span>
        </button>
      </div>
    </nav>
  );
}