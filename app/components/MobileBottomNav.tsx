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
        left-0
        right-0
        top-16
        z-[9999]
        md:hidden
        border-b
        border-zinc-200
        bg-white
        shadow-md
      "
      aria-label="Mobile quick navigation"
    >
      <div className="mx-auto flex h-14 w-full max-w-md items-center px-1">
        <button
          type="button"
          onClick={goHome}
          className="flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 text-[10px] font-medium text-zinc-700 active:text-amber-700"
        >
          <span className="text-base leading-none" aria-hidden="true">
            🏠
          </span>
          <span>Home</span>
        </button>

        <button
          type="button"
          onClick={() => goToSection("categories")}
          className="flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 text-[10px] font-medium text-zinc-700 active:text-amber-700"
        >
          <span className="text-base leading-none" aria-hidden="true">
            ☰
          </span>
          <span>Categories</span>
        </button>

        <button
          type="button"
          onClick={() => goToSection("products")}
          className="flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 text-[10px] font-medium text-zinc-700 active:text-amber-700"
        >
          <span className="text-base leading-none" aria-hidden="true">
            🛍️
          </span>
          <span>Products</span>
        </button>

        <button
          type="button"
          onClick={() => goToSection("location")}
          className="flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 text-[10px] font-medium text-zinc-700 active:text-amber-700"
        >
          <span className="text-base leading-none" aria-hidden="true">
            📍
          </span>
          <span>Location</span>
        </button>

        <button
          type="button"
          onClick={openWhatsApp}
          className="flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 text-[10px] font-medium text-zinc-700 active:text-green-700"
        >
          <span className="text-base leading-none" aria-hidden="true">
            💬
          </span>
          <span>WhatsApp</span>
        </button>
      </div>
    </nav>
  );
}