import type { Metadata } from "next";

import MobileBottomNav from "./components/MobileBottomNav";
import AuthButton from "./components/AuthButton";
import { createServerSupabaseClient } from "@/app/lib/supabase-server";
import LocationSelector from "@/app/components/LocationSelector";
import ShopTimingBanner from "@/app/components/ShopTimingBanner";

const BASE_URL = "https://dayal-kitchen-ware.vercel.app";
const WHATSAPP_NUMBER = "917011872380";
const STORE_NAME = "Dayal Kitchen Ware";
const STORE_EMAIL = "kitchenware821@gmail.com";

const STORE_ADDRESS = {
  street: "L42, Som Bazar Rd, Block A, Raja Puri, Matiala",
  locality: "New Delhi",
  region: "Delhi",
  postalCode: "110059",
  country: "IN",
};

const mapsLink = "https://maps.app.goo.gl/qBMv1Kw6MHiDPJXw7";

const whatsappMessage =
  "Hello Dayal Kitchen Ware 👋 I have a query about your products.";

const whatsappLink = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
  whatsappMessage
)}`;

export const metadata: Metadata = {
  title: {
    default: "Dayal Kitchen Ware | Kitchenware, Cookware & Kitchen Essentials",
    template: "%s | Dayal Kitchen Ware",
  },
  description:
    "Shop quality kitchenware, cookware, pressure cookers, bottles, dinner sets and everyday kitchen essentials from Dayal Kitchen Ware, New Delhi.",
  keywords: [
    "Dayal Kitchen Ware",
    "kitchenware",
    "cookware",
    "kitchen products",
    "kitchen essentials",
    "pressure cooker",
    "cookware sets",
    "kitchen tools",
    "dinner sets",
    "water bottles",
    "kitchen store Delhi",
    "Raja Puri kitchen store",
    "Matiala kitchenware",
  ],
  alternates: {
    canonical: BASE_URL,
  },
  openGraph: {
    title: "Dayal Kitchen Ware",
    description:
      "Quality kitchenware and everyday kitchen essentials for every home.",
    url: BASE_URL,
    siteName: "Dayal Kitchen Ware",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Dayal Kitchen Ware",
    description:
      "Quality kitchenware and everyday kitchen essentials for every home.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const revalidate = 3600;

function BusinessSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${BASE_URL}/#website`,
        url: BASE_URL,
        name: STORE_NAME,
        description: "Kitchenware and kitchen essentials store.",
      },
      {
        "@type": "Organization",
        "@id": `${BASE_URL}/#organization`,
        name: STORE_NAME,
        url: BASE_URL,
        email: STORE_EMAIL,
        telephone: `+${WHATSAPP_NUMBER}`,
        address: {
          "@type": "PostalAddress",
          streetAddress: STORE_ADDRESS.street,
          addressLocality: STORE_ADDRESS.locality,
          addressRegion: STORE_ADDRESS.region,
          postalCode: STORE_ADDRESS.postalCode,
          addressCountry: STORE_ADDRESS.country,
        },
      },
      {
        "@type": "Store",
        "@id": `${BASE_URL}/#store`,
        name: STORE_NAME,
        url: BASE_URL,
        email: STORE_EMAIL,
        telephone: `+${WHATSAPP_NUMBER}`,
        description:
          "Kitchenware, cookware and everyday kitchen essentials.",
        priceRange: "₹₹",
        address: {
          "@type": "PostalAddress",
          streetAddress: STORE_ADDRESS.street,
          addressLocality: STORE_ADDRESS.locality,
          addressRegion: STORE_ADDRESS.region,
          postalCode: STORE_ADDRESS.postalCode,
          addressCountry: STORE_ADDRESS.country,
        },
        areaServed: {
          "@type": "City",
          name: "Delhi",
        },
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

const categories = [
  {
    name: "Bottles",
    slug: "Bottles",
    description: "Stylish bottles for everyday use",
    icon: "🥤",
  },
  {
    name: "Cookware",
    slug: "Cookware",
    description: "Cookers, pans & cookware sets",
    icon: "🍳",
  },
  {
    name: "Kitchen Tools",
    slug: "Kitchen Tools",
    description: "Useful tools for every kitchen",
    icon: "🥄",
  },
  {
    name: "Dinner Sets",
    slug: "Dinner Sets",
    description: "Elegant everyday dining",
    icon: "🍽️",
  },
];

type Product = {
  id: string;
  slug?: string | null;
  name?: string | null;
  category?: string | null;
  description?: string | null;
  price?: number | null;
  old_price?: number | null;
  image_url?: string | null;
  image_urls?: string[] | null;
};

function getProductImage(product: Product) {
  if (product.image_url) return product.image_url;

  if (Array.isArray(product.image_urls) && product.image_urls.length > 0) {
    return product.image_urls[0];
  }

  return null;
}

function getProductSlug(product: Product) {
  return product.slug || product.id;
}

function getDiscount(product: Product) {
  if (
    typeof product.old_price === "number" &&
    typeof product.price === "number" &&
    product.old_price > product.price
  ) {
    return Math.round(
      ((product.old_price - product.price) / product.old_price) * 100
    );
  }

  return 0;
}

function formatPrice(value: number | null | undefined) {
  if (typeof value !== "number") return "Price on request";

  return `₹${value.toLocaleString("en-IN")}`;
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{
    category?: string;
    search?: string;
    showAll?: string;
  }>;
}) {
  const params = await searchParams;

  const categoryParam = params?.category?.trim() || "";
  const searchParam = params?.search?.trim() || "";
  const showAll = params?.showAll === "true";

  const supabase = await createServerSupabaseClient();

  const { data: allProducts, error } = await supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });

  const allProductList = (allProducts || []) as Product[];

  const normalizedCategory = categoryParam.toLowerCase();
  const normalizedSearch = searchParam.toLowerCase();

  let filteredProducts = allProductList;

  if (normalizedCategory) {
    filteredProducts = filteredProducts.filter(
      (product) =>
        String(product.category || "").toLowerCase() === normalizedCategory
    );
  }

  if (normalizedSearch) {
    filteredProducts = filteredProducts.filter((product) => {
      const searchableText = [
        product.name,
        product.category,
        product.description,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchableText.includes(normalizedSearch);
    });
  }

  const visibleProducts =
    categoryParam || searchParam || showAll
      ? filteredProducts
      : filteredProducts.slice(0, 8);

  const heroProduct = allProductList[0];

  const activeCategory = categories.find(
    (category) => category.name.toLowerCase() === normalizedCategory
  );

  const getCategoryImage = (categoryName: string) => {
    const product = allProductList.find(
      (item) =>
        String(item.category || "").toLowerCase() ===
          categoryName.toLowerCase() && getProductImage(item)
    );

    return product ? getProductImage(product) : null;
  };

  const productCount = filteredProducts.length;

  return (
    <>
      <BusinessSchema />

      <main className="min-h-screen overflow-x-hidden bg-[#f7f7f5] pb-24 text-zinc-950 md:pb-0">
        {/* HEADER */}
        <header className="sticky top-0 z-50 border-b border-zinc-200/70 bg-[#f7f7f5]/95 backdrop-blur-xl">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
            <a
              href="/"
              className="group flex min-w-0 items-center gap-3"
              aria-label="Dayal Kitchen Ware home"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-zinc-950 text-lg text-white shadow-sm">
                D
              </div>

              <div className="min-w-0">
                <div className="truncate text-sm font-black tracking-[0.14em]">
                  DAYAL KITCHEN WARE
                </div>
                <div className="text-[10px] font-medium tracking-[0.16em] text-zinc-500">
                  KITCHEN • HOME • LIFESTYLE
                </div>
              </div>
            </a>

            <nav className="hidden items-center gap-7 lg:flex">
              <a
                href="/"
                className="text-sm font-semibold text-zinc-950 transition hover:text-amber-700"
              >
                Home
              </a>
              <a
                href="#categories"
                className="text-sm font-semibold text-zinc-600 transition hover:text-zinc-950"
              >
                Categories
              </a>
              <a
                href="#products"
                className="text-sm font-semibold text-zinc-600 transition hover:text-zinc-950"
              >
                Products
              </a>
              <a
                href="#why-us"
                className="text-sm font-semibold text-zinc-600 transition hover:text-zinc-950"
              >
                Why Us
              </a>
              <a
                href="#about"
                className="text-sm font-semibold text-zinc-600 transition hover:text-zinc-950"
              >
                About
              </a>
            </nav>

            <div className="hidden items-center gap-3 md:flex">
              <form action="/" className="relative">
                <input
                  name="search"
                  defaultValue={searchParam}
                  placeholder="Search products..."
                  className="h-10 w-52 rounded-full border border-zinc-200 bg-white px-4 pr-10 text-sm outline-none transition focus:border-zinc-400"
                />
                <button
                  type="submit"
                  aria-label="Search"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500"
                >
                  ⌕
                </button>
              </form>

              <a
                href={whatsappLink}
                target="_blank"
                rel="noreferrer"
                className="rounded-full bg-zinc-950 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-zinc-800"
              >
                WhatsApp
              </a>

              <AuthButton />
            </div>

            <div className="flex items-center gap-2 md:hidden">
              <AuthButton />

              <details className="relative">
                <summary className="flex h-10 w-10 cursor-pointer list-none items-center justify-center rounded-full border border-zinc-200 bg-white text-lg">
                  ☰
                </summary>

                <div className="absolute right-0 top-12 w-72 rounded-3xl border border-zinc-200 bg-white p-4 shadow-2xl">
                  <form action="/" className="mb-4">
                    <input
                      name="search"
                      defaultValue={searchParam}
                      placeholder="Search products..."
                      className="h-11 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 text-sm outline-none"
                    />
                  </form>

                  <div className="grid gap-1">
                    <a
                      href="/"
                      className="rounded-xl px-3 py-3 text-sm font-semibold hover:bg-zinc-50"
                    >
                      Home
                    </a>
                    <a
                      href="#categories"
                      className="rounded-xl px-3 py-3 text-sm font-semibold hover:bg-zinc-50"
                    >
                      Categories
                    </a>
                    <a
                      href="#products"
                      className="rounded-xl px-3 py-3 text-sm font-semibold hover:bg-zinc-50"
                    >
                      Products
                    </a>
                    <a
                      href="#why-us"
                      className="rounded-xl px-3 py-3 text-sm font-semibold hover:bg-zinc-50"
                    >
                      Why Us
                    </a>
                    <a
                      href="#about"
                      className="rounded-xl px-3 py-3 text-sm font-semibold hover:bg-zinc-50"
                    >
                      About
                    </a>
                  </div>

                  <a
                    href={whatsappLink}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 flex items-center justify-center rounded-2xl bg-zinc-950 px-4 py-3 text-sm font-bold text-white"
                  >
                    Chat on WhatsApp
                  </a>
                </div>
              </details>
            </div>
          </div>

          <div className="border-t border-zinc-200/60">
            <div className="mx-auto max-w-7xl px-4 py-2 sm:px-6 lg:px-8">
              <ShopTimingBanner />
            </div>
          </div>
        </header>

        {/* HERO */}
        {!searchParam && !categoryParam && (
          <section className="relative overflow-hidden">
            <div className="mx-auto grid max-w-7xl gap-8 px-4 py-8 sm:px-6 sm:py-12 lg:grid-cols-[1.05fr_.95fr] lg:items-center lg:px-8 lg:py-20">
              <div>
                <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-zinc-600">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                  Quality kitchenware for every home
                </div>

                <h1 className="max-w-3xl text-4xl font-black leading-[0.98] tracking-[-0.045em] sm:text-5xl lg:text-7xl">
                  Everyday cooking.
                  <br />
                  <span className="text-zinc-400">Better essentials.</span>
                </h1>

                <p className="mt-6 max-w-xl text-base leading-7 text-zinc-600 sm:text-lg">
                  Discover practical kitchenware, cookware and everyday
                  essentials selected for real homes and real kitchens.
                </p>

                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <a
                    href="#products"
                    className="inline-flex items-center justify-center rounded-full bg-zinc-950 px-6 py-3.5 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-zinc-800"
                  >
                    Explore Collection
                    <span className="ml-2">→</span>
                  </a>

                  <a
                    href={mapsLink}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center rounded-full border border-zinc-300 bg-white px-6 py-3.5 text-sm font-bold text-zinc-900 transition hover:bg-zinc-50"
                  >
                    Visit Our Store
                  </a>
                </div>

                <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-xs font-semibold text-zinc-500">
                  <span>✓ Quality products</span>
                  <span>✓ Fair pricing</span>
                  <span>✓ Local support</span>
                </div>
              </div>

              <div className="relative">
                <div className="absolute -inset-4 rounded-[3rem] bg-amber-100/70 blur-3xl" />

                <div className="relative overflow-hidden rounded-[2.5rem] border border-zinc-200 bg-white p-3 shadow-[0_25px_80px_rgba(0,0,0,0.10)]">
                  <div className="relative aspect-[4/4.2] overflow-hidden rounded-[2rem] bg-[#efeee9]">
                    {heroProduct && getProductImage(heroProduct) ? (
                      <img
                        src={getProductImage(heroProduct) || ""}
                        alt={heroProduct.name || STORE_NAME}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-8xl">
                        🍳
                      </div>
                    )}

                    <div className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.15em] backdrop-blur">
                      Featured
                    </div>
                  </div>

                  {heroProduct && (
                    <div className="flex items-center justify-between gap-4 px-3 pb-2 pt-4">
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-zinc-400">
                          Featured product
                        </p>
                        <h2 className="mt-1 truncate text-base font-black">
                          {heroProduct.name}
                        </h2>
                      </div>

                      <a
                        href={`/products/${getProductSlug(heroProduct)}`}
                        className="shrink-0 rounded-full bg-zinc-950 px-4 py-2 text-xs font-bold text-white"
                      >
                        View
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* TRUST BAR */}
        <section className="border-y border-zinc-200 bg-white">
          <div className="mx-auto grid max-w-7xl grid-cols-2 divide-x divide-y divide-zinc-200 sm:grid-cols-4 sm:divide-y-0">
            {[
              ["01", "Quality", "Products selected for everyday use"],
              ["02", "Fair Pricing", "Straightforward value"],
              ["03", "Easy Support", "Talk to us when you need help"],
              ["04", "Local Store", "A real store you can visit"],
            ].map(([number, title, text]) => (
              <div key={number} className="p-5 sm:p-6">
                <div className="text-[10px] font-black tracking-[0.16em] text-amber-600">
                  {number}
                </div>
                <div className="mt-2 text-sm font-black">{title}</div>
                <p className="mt-1 text-xs leading-5 text-zinc-500">{text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CATEGORIES */}
        <section
          id="categories"
          className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20"
        >
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-600">
                Shop by category
              </p>
              <h2 className="mt-2 text-3xl font-black tracking-[-0.03em] sm:text-4xl">
                Built around your kitchen.
              </h2>
            </div>

            <a
              href="#products"
              className="text-sm font-bold text-zinc-600 hover:text-zinc-950"
            >
              Browse all products →
            </a>
          </div>

          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-5">
            {categories.map((category) => {
              const image = getCategoryImage(category.name);

              return (
                <a
                  key={category.slug}
                  href={`/?category=${encodeURIComponent(
                    category.slug
                  )}#products`}
                  className="group overflow-hidden rounded-[1.75rem] border border-zinc-200 bg-white transition duration-300 hover:-translate-y-1 hover:shadow-xl"
                >
                  <div className="relative aspect-[1/1.05] overflow-hidden bg-zinc-100">
                    {image ? (
                      <img
                        src={image}
                        alt={category.name}
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-5xl sm:text-6xl">
                        {category.icon}
                      </div>
                    )}

                    <div className="absolute left-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-lg backdrop-blur">
                      {category.icon}
                    </div>
                  </div>

                  <div className="p-4 sm:p-5">
                    <h3 className="text-sm font-black sm:text-base">
                      {category.name}
                    </h3>
                    <p className="mt-1 text-[11px] leading-4 text-zinc-500 sm:text-xs">
                      {category.description}
                    </p>
                    <div className="mt-3 text-xs font-bold text-zinc-950">
                      Explore →
                    </div>
                  </div>
                </a>
              );
            })}
          </div>
        </section>

        {/* PRODUCTS */}
        <section
          id="products"
          className="border-y border-zinc-200 bg-white"
        >
          <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-600">
                  {activeCategory
                    ? activeCategory.name
                    : searchParam
                    ? "Search results"
                    : "Our collection"}
                </p>

                <h2 className="mt-2 text-3xl font-black tracking-[-0.035em] sm:text-4xl">
                  {activeCategory
                    ? activeCategory.description
                    : searchParam
                    ? `Results for “${searchParam}”`
                    : "Essentials worth keeping."}
                </h2>

                <p className="mt-2 text-sm text-zinc-500">
                  {productCount} {productCount === 1 ? "product" : "products"}
                  available
                </p>
              </div>

              {!searchParam && !categoryParam && !showAll && (
                <a
                  href="/?showAll=true#products"
                  className="inline-flex w-fit rounded-full border border-zinc-300 px-5 py-2.5 text-xs font-bold transition hover:bg-zinc-50"
                >
                  View all products
                </a>
              )}
            </div>

            {error ? (
              <div className="mt-10 rounded-3xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
                We could not load products right now. Please try again later.
              </div>
            ) : visibleProducts.length === 0 ? (
              <div className="mt-10 rounded-[2rem] border border-dashed border-zinc-300 bg-zinc-50 px-6 py-16 text-center">
                <div className="text-4xl">🔎</div>
                <h3 className="mt-4 text-xl font-black">
                  No products found
                </h3>
                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-zinc-500">
                  Try another search or browse the complete collection.
                </p>
                <a
                  href="/?showAll=true#products"
                  className="mt-6 inline-flex rounded-full bg-zinc-950 px-5 py-3 text-xs font-bold text-white"
                >
                  Browse products
                </a>
              </div>
            ) : (
              <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-2 sm:gap-5 lg:grid-cols-4">
                {visibleProducts.map((product) => {
                  const discount = getDiscount(product);
                  const slug = getProductSlug(product);
                  const image = getProductImage(product);

                  const productWhatsapp = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
                    `Hello Dayal Kitchen Ware 👋 I am interested in "${product.name}"${
                      product.price
                        ? ` priced at ${formatPrice(product.price)}`
                        : ""
                    }.`
                  )}`;

                  return (
                    <article
                      key={product.id}
                      className="group overflow-hidden rounded-[1.5rem] border border-zinc-200 bg-white transition duration-300 hover:-translate-y-1 hover:shadow-xl sm:rounded-[2rem]"
                    >
                      <a
                        href={`/products/${slug}`}
                        className="block"
                        aria-label={`View ${product.name || "product"}`}
                      >
                        <div className="relative aspect-square overflow-hidden bg-zinc-100">
                          {image ? (
  <img
    src={image}
    alt={product.name || "Product"}
    className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
  />
) : (
  <div className="flex h-full w-full items-center justify-center text-5xl">
    🍳
  </div>
)}
                          {discount > 0 && (
                            <div className="absolute left-2 top-2 rounded-full bg-zinc-950 px-2.5 py-1 text-[9px] font-black text-white sm:left-3 sm:top-3 sm:text-[10px]">
                              {discount}% OFF
                            </div>
                          )}
                        </div>
                      </a>

                      <div className="p-3.5 sm:p-5">
                        <p className="text-[9px] font-black uppercase tracking-[0.14em] text-amber-600 sm:text-[10px]">
                          {product.category || "Kitchen"}
                        </p>

                        <a href={`/products/${slug}`}>
                          <h3 className="mt-1.5 line-clamp-2 min-h-[2.5rem] text-sm font-black leading-5 transition hover:text-amber-700 sm:text-base">
                            {product.name || "Kitchen Product"}
                          </h3>
                        </a>

                        <div className="mt-3 flex flex-wrap items-baseline gap-2">
                          <span className="text-base font-black sm:text-lg">
                            {formatPrice(product.price)}
                          </span>

                          {typeof product.old_price === "number" &&
                            product.old_price > (product.price || 0) && (
                              <span className="text-[10px] text-zinc-400 line-through sm:text-xs">
                                {formatPrice(product.old_price)}
                              </span>
                            )}
                        </div>

                        {product.description && (
                          <p className="mt-2 hidden line-clamp-2 text-xs leading-5 text-zinc-500 sm:block">
                            {product.description}
                          </p>
                        )}

                        <div className="mt-4 grid gap-2">
                          <a
                            href={`/products/${slug}`}
                            className="flex items-center justify-center rounded-xl bg-zinc-950 px-3 py-2.5 text-[11px] font-bold text-white transition hover:bg-zinc-800 sm:rounded-2xl sm:py-3 sm:text-xs"
                          >
                            View Product
                          </a>

                          <a
                            href={productWhatsapp}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center justify-center rounded-xl border border-zinc-200 px-3 py-2.5 text-[11px] font-bold text-zinc-800 transition hover:bg-zinc-50 sm:rounded-2xl sm:py-3 sm:text-xs"
                          >
                            Ask on WhatsApp
                          </a>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* WHY US */}
        <section
          id="why-us"
          className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20"
        >
          <div className="grid gap-10 lg:grid-cols-[.75fr_1.25fr]">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-600">
                Why Dayal
              </p>

              <h2 className="mt-3 text-3xl font-black tracking-[-0.035em] sm:text-4xl">
                A local store,
                <br />
                made easier to shop.
              </h2>

              <p className="mt-5 max-w-md text-sm leading-7 text-zinc-600">
                We combine the convenience of online browsing with the
                confidence of a local kitchenware store.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {[
                {
                  icon: "✦",
                  title: "Quality Products",
                  text: "Practical kitchen products selected for everyday homes.",
                },
                {
                  icon: "₹",
                  title: "Fair Pricing",
                  text: "Simple pricing without unnecessary complexity.",
                },
                {
                  icon: "↗",
                  title: "Easy Support",
                  text: "Need help? Talk directly with the store.",
                },
                {
                  icon: "⌂",
                  title: "Local Store",
                  text: "Browse online and visit us in person when you prefer.",
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="rounded-[1.75rem] border border-zinc-200 bg-white p-6"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-zinc-100 text-sm font-black">
                    {item.icon}
                  </div>

                  <h3 className="mt-5 text-base font-black">{item.title}</h3>

                  <p className="mt-2 text-sm leading-6 text-zinc-500">
                    {item.text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* HOW TO ORDER */}
        <section className="bg-zinc-950 text-white">
          <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
            <div className="max-w-2xl">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-400">
                Simple shopping
              </p>

              <h2 className="mt-3 text-3xl font-black tracking-[-0.035em] sm:text-4xl">
                From browsing to buying in three simple steps.
              </h2>
            </div>

            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              {[
                [
                  "01",
                  "Browse",
                  "Find the kitchen product you need.",
                ],
                [
                  "02",
                  "Ask",
                  "Have a question? Connect with us directly.",
                ],
                [
                  "03",
                  "Buy",
                  "Confirm your product and complete your order.",
                ],
              ].map(([number, title, text]) => (
                <div
                  key={number}
                  className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-6"
                >
                  <div className="text-xs font-black text-amber-400">
                    {number}
                  </div>

                  <h3 className="mt-8 text-xl font-black">{title}</h3>

                  <p className="mt-2 text-sm leading-6 text-zinc-400">
                    {text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* LOCATION */}
        <section className="border-b border-zinc-200 bg-[#eeece6]">
          <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
            <div className="grid gap-6 lg:grid-cols-[.9fr_1.1fr]">
              <div className="rounded-[2rem] border border-zinc-200 bg-white p-6 sm:p-8">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-600">
                  Visit us
                </p>

                <h2 className="mt-3 text-3xl font-black tracking-[-0.035em]">
                  Your local kitchenware store.
                </h2>

                <div className="mt-8 flex gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-zinc-100">
                    ⌖
                  </div>

                  <div>
                    <p className="text-sm font-black">Store Address</p>
                    <p className="mt-1 text-sm leading-6 text-zinc-500">
                      {STORE_ADDRESS.street}
                      <br />
                      {STORE_ADDRESS.locality}, {STORE_ADDRESS.region}{" "}
                      {STORE_ADDRESS.postalCode}
                    </p>
                  </div>
                </div>

                <div className="mt-6">
                  <LocationSelector />
                </div>

                <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                  <a
                    href={mapsLink}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-center rounded-full bg-zinc-950 px-5 py-3 text-xs font-bold text-white"
                  >
                    Get Directions
                  </a>

                  <a
                    href={whatsappLink}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-center rounded-full border border-zinc-300 px-5 py-3 text-xs font-bold"
                  >
                    Contact Store
                  </a>
                </div>
              </div>

              <a
                href={mapsLink}
                target="_blank"
                rel="noreferrer"
                className="group relative min-h-[320px] overflow-hidden rounded-[2rem] border border-zinc-200 bg-zinc-900"
              >
                <div className="absolute inset-0 opacity-30">
                  <div className="h-full w-full bg-[radial-gradient(circle_at_30%_30%,white_0,transparent_1px)] [background-size:22px_22px]" />
                </div>

                <div className="relative flex h-full flex-col items-center justify-center p-8 text-center text-white">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white text-2xl text-zinc-950 shadow-xl">
                    ⌖
                  </div>

                  <h3 className="mt-5 text-xl font-black">
                    Open store location
                  </h3>

                  <p className="mt-2 max-w-sm text-sm leading-6 text-zinc-400">
                    Tap to open our location in Google Maps and get directions
                    to Dayal Kitchen Ware.
                  </p>

                  <span className="mt-6 rounded-full bg-white px-5 py-3 text-xs font-black text-zinc-950 transition group-hover:scale-105">
                    Open Maps →
                  </span>
                </div>
              </a>
            </div>
          </div>
        </section>

        {/* ABOUT */}
        <section
          id="about"
          className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20"
        >
          <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-600">
                About us
              </p>

              <h2 className="mt-3 text-3xl font-black tracking-[-0.035em] sm:text-4xl">
                Kitchen essentials made simple.
              </h2>
            </div>

            <div className="space-y-4 text-sm leading-7 text-zinc-600">
              <p>
                Dayal Kitchen Ware is focused on practical products that make
                everyday cooking, dining and kitchen organization easier.
              </p>

              <p>
                Browse our collection online, compare products and connect
                directly with the store whenever you need help.
              </p>

              <p>
                Whether you are upgrading one item or setting up your kitchen,
                we aim to keep the shopping experience simple and useful.
              </p>
            </div>
          </div>
        </section>

        {/* CONTACT CTA */}
        <section className="px-4 pb-8 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl overflow-hidden rounded-[2.5rem] bg-amber-100 px-6 py-10 sm:px-10 lg:px-14 lg:py-14">
            <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-800">
                  Need help?
                </p>

                <h2 className="mt-3 max-w-2xl text-3xl font-black tracking-[-0.035em] sm:text-4xl">
                  Have a question about a product?
                </h2>

                <p className="mt-3 max-w-xl text-sm leading-6 text-zinc-700">
                  Contact Dayal Kitchen Ware directly. We are happy to help
                  with product questions and store information.
                </p>

                <p className="mt-4 text-sm font-bold text-zinc-900">
                  {STORE_EMAIL}
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <a
                  href={whatsappLink}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-center rounded-full bg-zinc-950 px-6 py-3.5 text-sm font-bold text-white"
                >
                  Chat on WhatsApp
                </a>

                <a
                  href={`mailto:${STORE_EMAIL}`}
                  className="flex items-center justify-center rounded-full border border-zinc-300 bg-white px-6 py-3.5 text-sm font-bold text-zinc-900"
                >
                  Email Us
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="border-t border-zinc-200 bg-white">
          <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
            <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-zinc-950 font-black text-white">
                    D
                  </div>

                  <div>
                    <div className="text-sm font-black tracking-[0.12em]">
                      DAYAL KITCHEN WARE
                    </div>
                    <div className="mt-0.5 text-[9px] font-semibold tracking-[0.14em] text-zinc-400">
                      KITCHEN • HOME • LIFESTYLE
                    </div>
                  </div>
                </div>

                <p className="mt-5 max-w-xs text-sm leading-6 text-zinc-500">
                  Practical kitchenware and everyday essentials for modern
                  homes.
                </p>
              </div>

              <div>
                <h3 className="text-xs font-black uppercase tracking-[0.15em]">
                  Explore
                </h3>

                <div className="mt-4 grid gap-3 text-sm text-zinc-500">
                  <a href="/" className="hover:text-zinc-950">
                    Home
                  </a>
                  <a href="#categories" className="hover:text-zinc-950">
                    Categories
                  </a>
                  <a href="#products" className="hover:text-zinc-950">
                    Products
                  </a>
                  <a href="#about" className="hover:text-zinc-950">
                    About
                  </a>
                </div>
              </div>

              <div>
                <h3 className="text-xs font-black uppercase tracking-[0.15em]">
                  Store
                </h3>

                <div className="mt-4 grid gap-3 text-sm text-zinc-500">
                  <a href={mapsLink} target="_blank" rel="noreferrer">
                    Visit Store
                  </a>
                  <a href={whatsappLink} target="_blank" rel="noreferrer">
                    WhatsApp
                  </a>
                  <a href={`mailto:${STORE_EMAIL}`}>{STORE_EMAIL}</a>
                </div>
              </div>

              <div>
                <h3 className="text-xs font-black uppercase tracking-[0.15em]">
                  Contact
                </h3>

                <div className="mt-4 space-y-3 text-sm text-zinc-500">
                  <p>{STORE_ADDRESS.street}</p>
                  <p>
                    {STORE_ADDRESS.locality}, {STORE_ADDRESS.region}{" "}
                    {STORE_ADDRESS.postalCode}
                  </p>
                  <p className="font-semibold text-zinc-800">
                    +91 70118 72380
                  </p>
                  <a
                    href={`mailto:${STORE_EMAIL}`}
                    className="block break-all font-semibold text-zinc-800 hover:text-amber-700"
                  >
                    {STORE_EMAIL}
                  </a>
                </div>
              </div>
            </div>

            <div className="mt-10 flex flex-col gap-3 border-t border-zinc-200 pt-6 text-xs text-zinc-400 sm:flex-row sm:items-center sm:justify-between">
              <p>
                © {new Date().getFullYear()} {STORE_NAME}. All rights reserved.
              </p>

              <p>Made for everyday kitchens.</p>
            </div>
          </div>
        </footer>

        <MobileBottomNav />
      </main>
    </>
  );
}