import Link from "next/link";

const whatsappLink =
  "https://wa.me/917011872380?text=Hello%20Dayal%20Kitchen%20Ware%20%F0%9F%91%8B%20I%20have%20a%20query%20about%20your%20products.";

const mapsLink =
  "https://maps.app.goo.gl/qBMv1Kw6MHiDPJXw7";

export default function Footer() {
  return (
    <footer className="border-t border-black/5 bg-[#faf9f6]">

      {/* NEED HELP */}
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8">

        <div className="rounded-[2rem] bg-zinc-900 px-6 py-10 text-white sm:px-10 sm:py-12">

          <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">

            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-400">
                Need help?
              </p>

              <h2 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">
                Have a question about a product?
              </h2>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-300 sm:text-base">
                Contact Dayal Kitchen Ware directly for product
                information, availability and orders.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">

              <a
                href={whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full bg-green-600 px-6 py-3.5 text-center text-sm font-semibold text-white transition hover:bg-green-700"
              >
                Chat on WhatsApp
              </a>

              <a
                href={mapsLink}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full border border-white/20 px-6 py-3.5 text-center text-sm font-semibold text-white transition hover:bg-white hover:text-zinc-900"
              >
                Visit Store →
              </a>

            </div>

          </div>

        </div>

      </section>

      {/* FOOTER LINKS */}
      <div className="border-t border-black/5">

        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-2 lg:grid-cols-4 lg:px-8">

          {/* BRAND */}
          <div className="md:col-span-2 lg:col-span-1">

            <h2 className="text-lg font-bold tracking-tight">
              DAYAL KITCHEN WARE
            </h2>

            <p className="mt-2 text-[10px] uppercase tracking-[0.2em] text-zinc-500">
              Kitchen • Home • Lifestyle
            </p>

            <p className="mt-5 max-w-xs text-sm leading-6 text-zinc-500">
              Quality kitchenware, cookware and home essentials
              for everyday living.
            </p>

          </div>

          {/* EXPLORE */}
          <div>
            <h3 className="text-sm font-bold">
              Explore
            </h3>

            <div className="mt-4 flex flex-col gap-3 text-sm text-zinc-500">

              <Link
                href="/#categories"
                className="transition hover:text-zinc-900"
              >
                Categories
              </Link>

              <Link
                href="/#products"
                className="transition hover:text-zinc-900"
              >
                Products
              </Link>

              <Link
                href="/#why-us"
                className="transition hover:text-zinc-900"
              >
                Why Choose Us
              </Link>

            </div>
          </div>

          {/* STORE */}
          <div>
            <h3 className="text-sm font-bold">
              Store
            </h3>

            <div className="mt-4 flex flex-col gap-3 text-sm text-zinc-500">

              <Link
                href="/#location"
                className="transition hover:text-zinc-900"
              >
                Visit Store
              </Link>

              <a
                href={mapsLink}
                target="_blank"
                rel="noopener noreferrer"
                className="transition hover:text-zinc-900"
              >
                Google Maps
              </a>

              <a
                href={whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                className="transition hover:text-zinc-900"
              >
                WhatsApp
              </a>

            </div>
          </div>

          {/* CONTACT */}
          <div>
            <h3 className="text-sm font-bold">
              Quick Contact
            </h3>

            <div className="mt-4 flex flex-col gap-3">

              <a
                href={whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-semibold text-zinc-900 transition hover:text-amber-700"
              >
                Chat with us →
              </a>

              <a
                href="mailto:kitchenware821@gmail.com"
                className="break-all text-sm text-zinc-500 transition hover:text-zinc-900"
              >
                kitchenware821@gmail.com
              </a>

            </div>
          </div>

        </div>

      </div>

      {/* COPYRIGHT */}
      <div className="border-t border-black/5">

        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-6 text-xs text-zinc-400 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">

          <p>
            © 2026 Dayal Kitchen Ware. All rights reserved.
          </p>

          <p>
            Kitchen • Home • Lifestyle
          </p>

        </div>

      </div>

    </footer>
  );
}