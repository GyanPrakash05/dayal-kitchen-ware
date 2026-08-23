import { supabase } from "./lib/supabase";
import ProductGallery from "@/app/components/ProductGallery";

import ScrollReveal from "./components/ScrollReveal";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const WHATSAPP_NUMBER = "917011872380";


const whatsappMessage =
  "Hello Dayal Kitchen Ware 👋 I have a query about your products.";

const whatsappLink = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
  whatsappMessage
)}`;

export default async function Home() {
  const { data: products, error } = await supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("PRODUCT FETCH ERROR:", error);
  }

  const productList = products ?? [];

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#faf9f6] text-zinc-900">

      {/* ===================================================== */}
      {/* NAVBAR */}
      {/* ===================================================== */}

      <header className="sticky top-0 z-50 border-b border-black/5 bg-white/95 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">

            {/* LOGO */}

            <a href="/" className="block">
              <h1 className="text-base font-bold sm:text-xl">
                DAYAL KITCHEN WARE
              </h1>

              <p className="text-[8px] uppercase tracking-[0.2em] text-zinc-500 sm:text-[10px]">
                Kitchen • Home • Lifestyle
              </p>
            </a>

            {/* DESKTOP NAV */}

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

              <a
                href={whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full bg-green-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-green-700"
              >
                WhatsApp Us
              </a>

            </div>

            {/* MOBILE MENU */}

            <details className="relative md:hidden">

              <summary className="flex h-10 w-10 cursor-pointer list-none items-center justify-center rounded-xl border border-zinc-200 bg-white">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
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
              </summary>

              <div className="absolute right-0 top-12 w-60 rounded-2xl border border-zinc-200 bg-white p-3 shadow-xl">

                <nav className="flex flex-col">

                  <a
                    href="#home"
                    className="rounded-xl px-4 py-3 text-sm font-medium hover:bg-zinc-100"
                  >
                    Home
                  </a>

                  <a
                    href="#products"
                    className="rounded-xl px-4 py-3 text-sm font-medium hover:bg-zinc-100"
                  >
                    Products
                  </a>

                  <a
                    href="#about"
                    className="rounded-xl px-4 py-3 text-sm font-medium hover:bg-zinc-100"
                  >
                    About
                  </a>

                  <a
                    href="#contact"
                    className="rounded-xl px-4 py-3 text-sm font-medium hover:bg-zinc-100"
                  >
                    Contact
                  </a>

                  <a
                    href={whatsappLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 rounded-full bg-green-600 px-5 py-3 text-center text-sm font-semibold text-white"
                  >
                    WhatsApp Us
                  </a>

                </nav>

              </div>

            </details>

          </div>
        </div>
      </header>


      {/* ===================================================== */}
      {/* HERO */}
      {/* ===================================================== */}

      <section
        id="home"
        className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8 lg:py-28"
      >

        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">

          {/* HERO TEXT */}

          <div>

            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-700 sm:text-sm sm:tracking-[0.2em]">
              Quality kitchenware for every home
            </p>

            <h2 className="mt-4 text-4xl font-bold tracking-tight sm:text-6xl">
              Make your kitchen
              <br />
              <span className="text-amber-700">
                feel like home.
              </span>
            </h2>

            <p className="mt-5 max-w-xl text-base leading-7 text-zinc-600 sm:mt-6 sm:text-lg sm:leading-8">
              Discover beautiful, practical and reliable kitchenware
              designed for everyday cooking and modern homes.
            </p>

            <div className="mt-7 flex flex-wrap gap-3 sm:mt-8 sm:gap-4">

              <a
                href="#products"
                className="rounded-full bg-zinc-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-amber-700 sm:px-7"
              >
                Shop Products →
              </a>

              <a
                href="#about"
                className="rounded-full border border-zinc-300 bg-white px-6 py-3 text-sm font-semibold transition hover:border-zinc-900 sm:px-7"
              >
                Learn More
              </a>

            </div>

          </div>


          {/* HERO VISUAL */}

          <div className="flex min-h-[280px] items-center justify-center rounded-[2rem] bg-[#e8e0d2] sm:min-h-[400px]">

            <div className="text-center">

              <div className="text-7xl sm:text-9xl">
                🍳
              </div>

              <p className="mt-4 text-xs font-semibold uppercase tracking-widest text-zinc-500 sm:text-sm">
                Cook • Serve • Enjoy
              </p>

            </div>

          </div>

        </div>

      </section>


      {/* ===================================================== */}
      {/* PRODUCTS */}
      {/* ===================================================== */}

      <section
        id="products"
        className="border-t border-black/5 bg-white py-16 sm:py-20"
      >

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

          {/* HEADING */}

          <div>

            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-700 sm:text-sm sm:tracking-[0.2em]">
              Customer favourites
            </p>

            <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
              Featured Products
            </h2>

            <p className="mt-3 text-sm text-zinc-500 sm:text-base">
              Explore our popular kitchen essentials.
            </p>

          </div>


          {/* ================================================= */}
          {/* PRODUCTS CONTAINER */}
          {/* ================================================= */}

          {productList.length > 0 ? (

            <div
              className="
                mt-8
                flex
                gap-4
                overflow-x-auto
                pb-5
                snap-x
                snap-mandatory

                sm:grid
                sm:grid-cols-2
                sm:gap-6
                sm:overflow-visible
                sm:pb-0

                lg:grid-cols-3
              "
              style={{
                scrollbarWidth: "none",
                msOverflowStyle: "none",
              }}
            >

              {productList.map((product) => (

                <article
                  key={product.id ?? product.slug}
                  className="
                    group
                    w-[82vw]
                    min-w-[82vw]
                    snap-start
                    overflow-hidden
                    rounded-3xl
                    border
                    border-zinc-200
                    bg-white
                    shadow-sm
                    transition
                    duration-300

                    sm:w-auto
                    sm:min-w-0

                    hover:-translate-y-1
                    hover:shadow-xl
                  "
                >

                  {/* ================================================= */}
                  {/* PRODUCT IMAGE */}
                  {/* ================================================= */}

                  <div
                    className="
                      relative
                      flex
                      h-[260px]
                      w-full
                      items-center
                      justify-center
                      overflow-hidden
                      bg-[#eee8dc]

                      sm:h-64
                      lg:h-72
                    "
                  >

                    {/* BADGE */}

                    {product.badge && (
                      <span
                        className="
                          absolute
                          left-4
                          top-4
                          z-10
                          rounded-full
                          bg-white
                          px-3
                          py-1.5
                          text-[9px]
                          font-bold
                          tracking-wider
                          text-zinc-800
                          shadow-sm
                        "
                      >
                        {product.badge}
                      </span>
                    )}


                    {/* IMAGE */}

                    {product.image ? (

                      <img
                        src={product.image}
                        alt={product.name}
                        loading="lazy"
                        className="
                          block
                          h-full
                          w-full
                          object-contain
                          p-5
                          transition-transform
                          duration-500
                          group-hover:scale-105
                        "
                      />

                    ) : (

                      <div className="flex h-full w-full items-center justify-center">
                        <span className="text-6xl sm:text-7xl">
                          🍳
                        </span>
                      </div>

                    )}

                  </div>


                  {/* ================================================= */}
                  {/* PRODUCT DETAILS */}
                  {/* ================================================= */}

                  <div className="flex min-h-[310px] flex-col p-5 sm:p-6">

                    {/* CATEGORY */}

                    <p className="text-[10px] font-medium uppercase tracking-wider text-zinc-400 sm:text-xs">
                      {product.category}
                    </p>


                    {/* PRODUCT NAME */}

                    <a
                      href={`/products/${product.slug}`}
                      className="
                        mt-2
                        line-clamp-2
                        text-lg
                        font-bold
                        leading-6
                        transition
                        hover:text-amber-700
                        sm:text-xl
                      "
                    >
                      {product.name}
                    </a>


                    {/* PRICE */}

                    <div className="mt-3 flex items-center gap-3">

                      <span className="text-lg font-bold">
                        ₹{product.price}
                      </span>

                      {product.old_price !== null &&
                        product.old_price !== undefined &&
                        product.old_price !== "" && (

                          <span className="text-sm text-zinc-400 line-through">
                            ₹{product.old_price}
                          </span>

                        )}

                    </div>


                    {/* DESCRIPTION */}

                    {product.description && (

                      <p className="mt-3 line-clamp-3 text-sm leading-6 text-zinc-500">
                        {product.description}
                      </p>

                    )}


                    {/* BUTTONS */}

                    <div className="mt-auto pt-5">

                      {/* VIEW PRODUCT */}

                      <a
                        href={`/products/${product.slug}`}
                        className="
                          block
                          w-full
                          rounded-full
                          bg-zinc-900
                          py-3
                          text-center
                          text-sm
                          font-semibold
                          text-white
                          transition
                          hover:bg-amber-700
                        "
                      >
                        View Product
                      </a>


                      {/* WHATSAPP */}

                      <a
                        href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
                          `Hello Dayal Kitchen Ware 👋

I am interested in:

${product.name}

Price: ₹${product.price}

Please share more details and availability.`
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="
                          mt-3
                          block
                          w-full
                          rounded-full
                          border
                          border-green-600
                          py-3
                          text-center
                          text-sm
                          font-semibold
                          text-green-700
                          transition
                          hover:bg-green-600
                          hover:text-white
                        "
                      >
                        Ask on WhatsApp
                      </a>

                    </div>

                  </div>

                </article>

              ))}

            </div>

          ) : (

            /* NO PRODUCTS */

            <div className="mt-10 rounded-3xl border border-dashed border-zinc-300 p-10 text-center">

              <div className="text-5xl">
                🍳
              </div>

              <h3 className="mt-4 text-xl font-bold">
                No products available yet
              </h3>

              <p className="mt-2 text-sm text-zinc-500">
                Products added from the admin dashboard will appear here automatically.
              </p>

            </div>

          )}

        </div>

      </section>


      {/* ===================================================== */}
      {/* ABOUT */}
      {/* ===================================================== */}

      <section
        id="about"
        className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8"
      >

        <div className="max-w-3xl">

          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-700 sm:text-sm sm:tracking-[0.2em]">
            About Dayal Kitchen Ware
          </p>

          <h2 className="mt-3 text-3xl font-bold sm:text-4xl">
            Kitchen essentials made simple.
          </h2>

          <p className="mt-5 text-base leading-7 text-zinc-600 sm:mt-6 sm:text-lg sm:leading-8">
            We believe good kitchenware should be practical,
            beautiful and made for everyday life. Our collection
            brings together useful products for cooking, serving
            and organizing your kitchen.
          </p>

        </div>

      </section>


      {/* ===================================================== */}
      {/* CONTACT */}
      {/* ===================================================== */}

      <section
        id="contact"
        className="bg-[#eee8dc] py-14 sm:py-16"
      >

        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">

          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-700 sm:text-sm sm:tracking-[0.2em]">
            Get in touch
          </p>

          <h2 className="mt-3 text-3xl font-bold sm:text-4xl">
            Have a question?
          </h2>

          <p className="mt-4 text-sm text-zinc-600 sm:text-base">
            Contact Dayal Kitchen Ware for product information
            and orders.
          </p>

          <a
            href={whatsappLink}
            target="_blank"
            rel="noopener noreferrer"
            className="
              mt-7
              inline-block
              rounded-full
              bg-zinc-900
              px-7
              py-3
              text-sm
              font-semibold
              text-white
              transition
              hover:bg-amber-700
            "
          >
            Contact Us on WhatsApp
          </a>

        </div>

      </section>


      {/* ===================================================== */}
      {/* FOOTER */}
      {/* ===================================================== */}

      <footer className="bg-zinc-950 py-10 text-white">

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

          <p className="font-bold">
            DAYAL KITCHEN WARE
          </p>

          <p className="mt-1 text-xs text-zinc-500">
            Kitchen • Home • Lifestyle
          </p>

          <p className="mt-6 text-xs text-zinc-500">
            © 2026 Dayal Kitchen Ware. All rights reserved.
          </p>

        </div>

      </footer>

    </main>
  );
}