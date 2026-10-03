"use client";

export default function MobileBottomNav() {
  const goToSection = (id: string) => {
    const section = document.getElementById(id);

    if (section) {
      section.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
      return;
    }

    // Product page ya kisi doosre page se homepage section par jaane ke liye
    window.location.href = `/#${id}`;
  };

  const goHome = () => {
    if (window.location.pathname === "/") {
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
      return;
    }

    window.location.href = "/";
  };

  const openWhatsApp = () => {
    window.open(
      "https://wa.me/917011872380",
      "_blank",
      "noopener,noreferrer"
    );
  };

  return (
    <nav
      className="
        fixed
        top-0
        left-0
        right-0
        z-50
        md:hidden
        border-b
        border-zinc-200
        bg-white/95
        backdrop-blur-xl
        shadow-sm
      "
      aria-label="Mobile navigation"
    >
      <div className="mx-auto flex h-16 max-w-md items-center justify-between px-2">
        {/* Home */}
        <button
          type="button"
          onClick={goHome}
          className="flex min-w-0 flex-1 flex-col items-center justify-center gap-1 py-2 text-[11px] font-medium text-zinc-700 transition hover:text-amber-600"
        >
          <span className="text-lg leading-none" aria-hidden="true">
            🏠
          </span>
          <span>Home</span>
        </button>

        {/* Categories */}
        <button
          type="button"
          onClick={() => goToSection("categories")}
          className="flex min-w-0 flex-1 flex-col items-center justify-center gap-1 py-2 text-[11px] font-medium text-zinc-700 transition hover:text-amber-600"
        >
          <span className="text-lg leading-none" aria-hidden="true">
            ☰
          </span>
          <span>Categories</span>
        </button>

        {/* Products */}
        <button
          type="button"
          onClick={() => goToSection("products")}
          className="flex min-w-0 flex-1 flex-col items-center justify-center gap-1 py-2 text-[11px] font-medium text-zinc-700 transition hover:text-amber-600"
        >
          <span className="text-lg leading-none" aria-hidden="true">
            🛍️
          </span>
          <span>Products</span>
        </button>

        {/* Location */}
        <button
          type="button"
          onClick={() => goToSection("location")}
          className="flex min-w-0 flex-1 flex-col items-center justify-center gap-1 py-2 text-[11px] font-medium text-zinc-700 transition hover:text-amber-600"
        >
          <span className="text-lg leading-none" aria-hidden="true">
            📍
          </span>
          <span>Location</span>
        </button>

        {/* WhatsApp */}
        <button
          type="button"
          onClick={openWhatsApp}
          className="flex min-w-0 flex-1 flex-col items-center justify-center gap-1 py-2 text-[11px] font-medium text-zinc-700 transition hover:text-amber-600"
        >
          <span className="text-lg leading-none" aria-hidden="true">
            💬
          </span>
          <span>WhatsApp</span>
        </button>
      </div>
    </nav>
  );
}