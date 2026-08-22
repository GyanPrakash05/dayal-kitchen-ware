"use client";

import { useState } from "react";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = () => {
    setMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 border-b border-black/5 bg-white/95 backdrop-blur">
      <div className="mx-auto max-w-7xl px-6 py-4">
        <div className="flex items-center justify-between">

          {/* LOGO */}
          <a
            href="/"
            onClick={closeMenu}
            className="block"
          >
            <h1 className="text-lg font-bold sm:text-xl">
              DAYAL KITCHEN WARE
            </h1>

            <p className="text-[9px] uppercase tracking-[0.25em] text-zinc-500 sm:text-[10px]">
              Kitchen • Home • Lifestyle
            </p>
          </a>

          {/* DESKTOP NAVIGATION */}
          <div className="hidden items-center gap-8 md:flex">

            <nav className="flex items-center gap-8 text-sm font-medium">
              <a
                href="#home"
                className="transition hover:text-amber-700"
              >
                Home
              </a>

              <a
                href="#products"
                className="transition hover:text-amber-700"
              >
                Products
              </a>

              <a
                href="#about"
                className="transition hover:text-amber-700"
              >
                About
              </a>

              <a
                href="#contact"
                className="transition hover:text-amber-700"
              >
                Contact
              </a>
            </nav>

            {/* DESKTOP WHATSAPP */}
            <a
              href="https://wa.me/917011872380?text=Hello%20Dayal%20Kitchen%20Ware%20%F0%9F%91%8B%20I%20have%20a%20query%20about%20your%20products."
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full bg-green-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-green-700"
            >
              WhatsApp Us
            </a>

          </div>

          {/* MOBILE MENU BUTTON */}
          <button
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
            aria-expanded={menuOpen}
            className="rounded-lg border border-zinc-200 p-2 text-zinc-900 transition hover:bg-zinc-100 md:hidden"
          >
            {menuOpen ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            )}
          </button>

        </div>

        {/* MOBILE MENU */}
        {menuOpen && (
          <div className="border-t border-zinc-100 pt-4 md:hidden">
            <nav className="flex flex-col gap-2">

              <a
                href="#home"
                onClick={closeMenu}
                className="rounded-xl px-4 py-3 text-sm font-medium transition hover:bg-zinc-100"
              >
                Home
              </a>

              <a
                href="#products"
                onClick={closeMenu}
                className="rounded-xl px-4 py-3 text-sm font-medium transition hover:bg-zinc-100"
              >
                Products
              </a>

              <a
                href="#about"
                onClick={closeMenu}
                className="rounded-xl px-4 py-3 text-sm font-medium transition hover:bg-zinc-100"
              >
                About
              </a>

              <a
                href="#contact"
                onClick={closeMenu}
                className="rounded-xl px-4 py-3 text-sm font-medium transition hover:bg-zinc-100"
              >
                Contact
              </a>

              <a
                href="https://wa.me/917011872380?text=Hello%20Dayal%20Kitchen%20Ware%20%F0%9F%91%8B%20I%20have%20a%20query%20about%20your%20products."
                target="_blank"
                rel="noopener noreferrer"
                onClick={closeMenu}
                className="mt-2 rounded-full bg-green-600 px-5 py-3 text-center text-sm font-semibold text-white transition hover:bg-green-700"
              >
                WhatsApp Us
              </a>

            </nav>
          </div>
        )}
      </div>
    </header>
  );
}