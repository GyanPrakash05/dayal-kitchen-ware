import Image from "next/image";

const products = [
  {
    name: "Premium Cookware Set",
    slug: "premium-cookware-set",
    category: "Cookware",
    price: "₹1,499",
    oldPrice: "₹1,999",
    badge: "BEST SELLER",
    image: "/products/premium-cookware-set.jpg",
  },
  {
    name: "Elegant Dinner Set",
    slug: "elegant-dinner-set",
    category: "Dinner Sets",
    price: "₹2,299",
    oldPrice: "₹2,999",
    badge: "POPULAR",
    image: "/products/elegant-dinner-set.jpg",
  },
  {
    name: "Kitchen Essentials Set",
    slug: "kitchen-essentials-set",
    category: "Kitchen Tools",
    price: "₹699",
    oldPrice: "₹999",
    badge: "NEW",
    image: "/products/kitchen-essentials-set.jpg",
  },
];

const whatsappMessage =
  "Hello Dayal Kitchen Ware 👋 I have a query about your products.";

const whatsappLink = `https://wa.me/917011872380?text=${encodeURIComponent(
  whatsappMessage
)}`;

export default function Home() {
  return (
    <main className="min-h-screen bg-[#faf9f6] text-zinc-900">
      {/* NAVBAR */}
      <header className="sticky top-0 z-50 border-b border-black/5 bg-white/95 backdrop-blur">
        <div className="mx-auto max-w-7xl px-6 py-4">
          <div className="flex items-center justify-between">
            {/* LOGO */}
            <a href="/" className="block">
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
              <summary className="flex h-10 w-10 cursor-pointer list-none items-center justify-center rounded-lg border border-zinc-200 text-zinc-900 transition hover:bg-zinc-100">
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
              </summary>

              <div className="absolute right-0 top-14 w-64 rounded-2xl border border-zinc-200 bg-white p-4 shadow-xl">
                <nav className="flex flex-col gap-2">
                  <a
                    href="#home"
                    className="rounded-xl px-4 py-3 text-sm font-medium transition hover:bg-zinc-100"
                  >
                    Home
                  </a>

                  <a
                    href="#products"
                    className="rounded-xl px-4 py-3 text-sm font-medium transition hover:bg-zinc-100"
                  >
                    Products
                  </a>

                  <a
                    href="#about"
                    className="rounded-xl px-4 py-3 text-sm font-medium transition hover:bg-zinc-100"
                  >
                    About
                  </a>

                  <a
                    href="#contact"
                    className="rounded-xl px-4 py-3 text-sm font-medium transition hover:bg-zinc-100"
                  >
                    Contact
                  </a>

                  <a
                    href={whatsappLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 rounded-full bg-green-600 px-5 py-3 text-center text-sm font-semibold text-white transition hover:bg-green-700"
                  >
                    WhatsApp Us
                  </a>
                </nav>
              </div>
            </details>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section
        id="home"
        className="mx-auto max-w-7xl px-6 py-20 lg:px-8 lg:py-28"
      >
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-700">
              Quality kitchenware for every home
            </p>

            <h2 className="mt-5 text-5xl font-bold tracking-tight sm:text-6xl">
              Make your kitchen
              <br />
              <span className="text-amber-700">
                feel like home.
              </span>
            </h2>

            <p className="mt-6 max-w-xl text-lg leading-8 text-zinc-600">
              Discover beautiful, practical and reliable kitchenware
              designed for everyday cooking and modern homes.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <a
                href="#products"
                className="rounded-full bg-zinc-900 px-7 py-3 font-semibold text-white transition hover:bg-amber-700"
              >
                Shop Products →
              </a>

              <a
                href="#about"
                className="rounded-full border border-zinc-300 bg-white px-7 py-3 font-semibold transition hover:border-zinc-900"
              >
                Learn More
              </a>
            </div>
          </div>

          {/* HERO VISUAL */}
          <div className="flex min-h-[350px] items-center justify-center rounded-[2rem] bg-[#e8e0d2] sm:min-h-[400px]">
            <div className="text-center">
              <div className="text-8xl sm:text-9xl">
                🍳
              </div>

              <p className="mt-4 text-sm font-semibold uppercase tracking-widest text-zinc-500">
                Cook • Serve • Enjoy
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* PRODUCTS */}
      <section
        id="products"
        className="border-t border-black/5 bg-white py-20"
      >
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-700">
              Customer favourites
            </p>

            <h2 className="mt-2 text-4xl font-bold tracking-tight">
              Featured Products
            </h2>

            <p className="mt-3 text-zinc-500">
              Explore our popular kitchen essentials.
            </p>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {products.map((product) => (
              <div
                key={product.slug}
                className="group overflow-hidden rounded-3xl border border-zinc-200 bg-white"
              >
                {/* PRODUCT IMAGE */}
                <div className="relative flex h-72 items-center justify-center bg-[#eee8dc]">
                  <span className="absolute left-5 top-5 z-10 rounded-full bg-white px-3 py-1 text-[10px] font-bold tracking-wider">
                    {product.badge}
                  </span>

                  <Image
                    src={product.image}
                    alt={product.name}
                    width={500}
                    height={500}
                    className="h-full w-full object-contain p-6 transition duration-300 group-hover:scale-105"
                  />
                </div>

                {/* PRODUCT DETAILS */}
                <div className="p-6">
                  <p className="text-xs font-medium uppercase tracking-wider text-zinc-400">
                    {product.category}
                  </p>

                  <a
                    href={`/products/${product.slug}`}
                    className="mt-2 block text-xl font-bold transition hover:text-amber-700"
                  >
                    {product.name}
                  </a>

                  <div className="mt-4 flex items-center gap-3">
                    <span className="text-lg font-bold">
                      {product.price}
                    </span>

                    <span className="text-sm text-zinc-400 line-through">
                      {product.oldPrice}
                    </span>
                  </div>

                  <a
                    href={`/products/${product.slug}`}
                    className="mt-6 block w-full rounded-full bg-zinc-900 py-3 text-center text-sm font-semibold text-white transition hover:bg-amber-700"
                  >
                    View Product
                  </a>

                  {/* PRODUCT WHATSAPP */}
                  <a
                    href={`https://wa.me/917011872380?text=${encodeURIComponent(
                      `Hello Dayal Kitchen Ware 👋

I am interested in:
${product.name}

Price: ${product.price}

Please share more details and availability.`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 block w-full rounded-full border border-green-600 py-3 text-center text-sm font-semibold text-green-700 transition hover:bg-green-600 hover:text-white"
                  >
                    Ask on WhatsApp
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ABOUT */}
      <section
        id="about"
        className="mx-auto max-w-7xl px-6 py-20 lg:px-8"
      >
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-700">
            About Dayal Kitchen Ware
          </p>

          <h2 className="mt-3 text-4xl font-bold">
            Kitchen essentials made simple.
          </h2>

          <p className="mt-6 text-lg leading-8 text-zinc-600">
            We believe good kitchenware should be practical,
            beautiful and made for everyday life. Our collection
            brings together useful products for cooking, serving
            and organizing your kitchen.
          </p>
        </div>
      </section>

      {/* CONTACT */}
      <section
        id="contact"
        className="bg-[#eee8dc] py-16"
      >
        <div className="mx-auto max-w-7xl px-6 text-center lg:px-8">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-700">
            Get in touch
          </p>

          <h2 className="mt-3 text-4xl font-bold">
            Have a question?
          </h2>

          <p className="mt-4 text-zinc-600">
            Contact Dayal Kitchen Ware for product information
            and orders.
          </p>

          <a
            href={whatsappLink}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-7 inline-block rounded-full bg-zinc-900 px-8 py-3 font-semibold text-white transition hover:bg-amber-700"
          >
            Contact Us on WhatsApp
          </a>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-zinc-950 py-10 text-white">
        <div className="mx-auto max-w-7xl px-6">
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

      {/* FLOATING WHATSAPP BUTTON */}
      <a
        href={whatsappLink}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat with Dayal Kitchen Ware on WhatsApp"
        className="fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-green-600 text-white shadow-xl transition hover:scale-110 hover:bg-green-700 sm:bottom-6 sm:right-6"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          className="h-7 w-7"
        >
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.198-.347.223-.644.074-.297-.149-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.248-.497.099-.198.05-.372-.025-.521-.075-.149-.669-1.611-.916-2.206-.242-.579-.487-.5-.67-.51-.173-.008-.372-.01-.57-.01-.198 0-.52.075-.792.372-.273.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.095 3.2 5.077 4.487.71.306 1.263.489 1.694.626.712.227 1.36.195 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
          <path d="M12.004 2a9.75 9.75 0 0 0-8.48 14.56L2 22l5.59-1.467A9.75 9.75 0 1 0 12.004 2zm0 17.8c-1.53 0-3.03-.41-4.34-1.19l-.31-.18-3.32.87.89-3.23-.2-.33A7.75 7.75 0 1 1 12.004 19.8z" />
        </svg>
      </a>
    </main>
  );
}