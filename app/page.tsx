import { supabase } from "./lib/supabase";
import ProductCardImage from "./components/ProductCardImage";
import MobileBottomNav from "./components/MobileBottomNav";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const WHATSAPP_NUMBER = "917011872380";

const whatsappMessage =
  "Hello Dayal Kitchen Ware 👋 I have a query about your products.";

const whatsappLink = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
  whatsappMessage
)}`;

const mapsLink = "https://maps.app.goo.gl/qBMv1Kw6MHiDPJXw7";

const categories = [
  {
    name: "Bottle",
    title: "Bottles",
    description: "Stylish bottles for everyday use",
    fallback: "🥤",
  },
  {
    name: "Cookware",
    title: "Cookware",
    description: "Cookers, pans & cookware sets",
    fallback: "🍳",
  },
  {
    name: "Kitchen Tools",
    title: "Kitchen Tools",
    description: "Useful tools for everyday cooking",
    fallback: "🥄",
  },
  {
    name: "Dinner Sets",
    title: "Dinner Sets",
    description: "Elegant sets for every occasion",
    fallback: "🍽️",
  },
];

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{
    category?: string;
    search?: string;
    showAll?: string;
  }>;
}) {
  const {
    category: categoryQuery,
    search: searchQuery,
    showAll,
  } = await searchParams;

  const cleanSearchQuery = searchQuery?.trim() || "";
  const cleanCategoryQuery = categoryQuery?.trim() || "";

  // =========================================================
  // GET ALL PRODUCTS
  // =========================================================

  const { data: allProducts, error } = await supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("PRODUCT FETCH ERROR:", error);
  }

  const allProductList = allProducts ?? [];

  // =========================================================
  // CATEGORY FILTER
  // =========================================================

  let filteredProducts = allProductList;

  if (cleanCategoryQuery) {
    filteredProducts = filteredProducts.filter(
      (product) =>
        product.category?.toLowerCase() ===
        cleanCategoryQuery.toLowerCase()
    );
  }

  // =========================================================
  // SEARCH FILTER
  // =========================================================

  if (cleanSearchQuery) {
    const query = cleanSearchQuery.toLowerCase();

    filteredProducts = filteredProducts.filter((product) => {
      const name = product.name?.toLowerCase() || "";
      const productCategory = product.category?.toLowerCase() || "";
      const description = product.description?.toLowerCase() || "";

      return (
        name.includes(query) ||
        productCategory.includes(query) ||
        description.includes(query)
      );
    });
  }

  // =========================================================
  // PRODUCT DISPLAY LOGIC
  // =========================================================

  const isFiltering = Boolean(
    cleanCategoryQuery || cleanSearchQuery
  );

  const showAllProducts =
    showAll === "true" && !isFiltering;

  const productList =
    isFiltering || showAllProducts
      ? filteredProducts
      : filteredProducts.slice(0, 4);

  // =========================================================
  // CATEGORY IMAGES
  // =========================================================

  const categoryCards = categories.map((item) => {
    const categoryProduct = allProductList.find(
      (product) =>
        product.category?.toLowerCase() ===
          item.name.toLowerCase() &&
        product.image
    );

    return {
      ...item,
      image: categoryProduct?.image ?? null,
    };
  });

  // =========================================================
  // ACTIVE CATEGORY
  // =========================================================

  const activeCategory = categories.find(
    (item) =>
      item.name.toLowerCase() ===
      cleanCategoryQuery.toLowerCase()
  );

  // =========================================================
  // PAGE
  // =========================================================

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#faf9f6] pb-24 text-zinc-900 md:pb-0">

      {/* ===================================================== */}
      {/* NAVBAR */}
      {/* ===================================================== */}

      <header className="sticky top-0 z-50 border-b border-black/5 bg-white/90 backdrop-blur-xl">

        <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 sm:py-4 lg:px-8">

          <div className="flex items-center justify-between gap-4">

            {/* LOGO */}

            <a
              href="/"
              className="block shrink-0 transition-opacity hover:opacity-80"
            >
              <h1 className="text-[15px] font-bold tracking-tight sm:text-xl">
                DAYAL KITCHEN WARE
              </h1>

              <p className="text-[7px] uppercase tracking-[0.2em] text-zinc-500 sm:text-[10px]">
                Kitchen • Home • Lifestyle
              </p>
            </a>

            {/* DESKTOP NAV */}

            <div className="hidden items-center gap-5 md:flex">

              <nav className="flex items-center gap-5 text-sm font-medium lg:gap-7">

                <a
                  href="#home"
                  className="transition-colors hover:text-amber-700"
                >
                  Home
                </a>

                <a
                  href="#categories"
                  className="transition-colors hover:text-amber-700"
                >
                  Categories
                </a>

                <a
                  href="#products"
                  className="transition-colors hover:text-amber-700"
                >
                  Products
                </a>

                <a
                  href="#why-us"
                  className="transition-colors hover:text-amber-700"
                >
                  Why Us
                </a>

                <a
                  href="#about"
                  className="transition-colors hover:text-amber-700"
                >
                  About
                </a>

              </nav>

              {/* SEARCH */}

              <form action="/" method="GET">

                <div className="flex items-center rounded-full border border-zinc-200 bg-zinc-50 px-3 transition-all focus-within:border-zinc-400 focus-within:bg-white focus-within:shadow-sm">

                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 shrink-0 text-zinc-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="m21 21-4.35-4.35m1.35-5.65a7 7 0 1 1-14 0Z"
                    />
                  </svg>

                  <input
                    type="search"
                    name="search"
                    defaultValue={cleanSearchQuery}
                    placeholder="Search products..."
                    className="w-36 bg-transparent px-2.5 py-2 text-sm outline-none placeholder:text-zinc-400 lg:w-44"
                  />

                  <button
                    type="submit"
                    className="rounded-full bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-amber-700"
                  >
                    Search
                  </button>

                </div>

              </form>

              {/* WHATSAPP */}

              <a
                href={whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full bg-green-600 px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-green-700 hover:shadow-lg"
              >
                WhatsApp Us
              </a>

            </div>

            {/* MOBILE MENU */}

            <details className="relative md:hidden">

              <summary className="flex h-10 w-10 cursor-pointer list-none items-center justify-center rounded-xl border border-zinc-200 bg-white shadow-sm">

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

              <div className="absolute right-0 top-12 w-[calc(100vw-32px)] max-w-80 rounded-2xl border border-zinc-200 bg-white p-3 shadow-2xl">

                <nav className="flex flex-col">

                  <a
                    href="#home"
                    className="rounded-xl px-4 py-3 text-sm font-medium hover:bg-zinc-100"
                  >
                    Home
                  </a>

                  <a
                    href="#categories"
                    className="rounded-xl px-4 py-3 text-sm font-medium hover:bg-zinc-100"
                  >
                    Categories
                  </a>

                  <a
                    href="#products"
                    className="rounded-xl px-4 py-3 text-sm font-medium hover:bg-zinc-100"
                  >
                    Products
                  </a>

                  <a
                    href="#why-us"
                    className="rounded-xl px-4 py-3 text-sm font-medium hover:bg-zinc-100"
                  >
                    Why Choose Us
                  </a>

                  <a
                    href="#location"
                    className="rounded-xl px-4 py-3 text-sm font-medium hover:bg-zinc-100"
                  >
                    Visit Store
                  </a>

                  <a
                    href="#about"
                    className="rounded-xl px-4 py-3 text-sm font-medium hover:bg-zinc-100"
                  >
                    About
                  </a>

                  {/* MOBILE SEARCH */}

                  <form
                    action="/"
                    method="GET"
                    className="mt-2"
                  >

                    <div className="flex items-center rounded-xl border border-zinc-200 bg-zinc-50 px-3">

                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4 shrink-0 text-zinc-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="m21 21-4.35-4.35m1.35-5.65a7 7 0 1 1-14 0Z"
                        />
                      </svg>

                      <input
                        type="search"
                        name="search"
                        defaultValue={cleanSearchQuery}
                        placeholder="Search products..."
                        className="min-w-0 flex-1 bg-transparent px-2.5 py-3 text-sm outline-none"
                      />

                      <button
                        type="submit"
                        className="rounded-lg bg-zinc-900 px-3 py-2 text-xs font-semibold text-white"
                      >
                        Go
                      </button>

                    </div>

                  </form>

                  <a
                    href={whatsappLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 rounded-full bg-green-600 px-5 py-3 text-center text-sm font-semibold text-white"
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
      {/* HERO + CATEGORIES */}
      {/* ===================================================== */}

      {!cleanSearchQuery && (
        <>

          {/* ================================================= */}
          {/* HERO */}
          {/* ================================================= */}

          <section
            id="home"
            className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-20 lg:px-8 lg:py-28"
          >

            <div className="grid items-center gap-8 lg:grid-cols-2 lg:gap-16">

              {/* HERO TEXT */}

              <div className="animate-[fadeInUp_0.7s_ease-out]">

                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-700 sm:text-sm">
                  Quality kitchenware for every home
                </p>

                <h2 className="mt-4 text-[2.6rem] font-bold leading-[1.04] tracking-tight sm:text-6xl lg:text-7xl">

                  Everything your
                  <br />

                  kitchen needs.
                  <br />

                  <span className="text-amber-700">
                    Made for everyday.
                  </span>

                </h2>

                <p className="mt-5 max-w-xl text-[15px] leading-7 text-zinc-600 sm:text-lg sm:leading-8">
                  Discover beautiful, practical and reliable
                  kitchenware designed for everyday cooking and
                  modern homes.
                </p>

                <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:gap-4">

                  <a
                    href="#categories"
                    className="rounded-full bg-zinc-900 px-6 py-3.5 text-center text-sm font-semibold text-white shadow-lg transition-all hover:bg-amber-700 hover:shadow-xl sm:px-7"
                  >
                    Explore Collection →
                  </a>

                  <a
                    href="#location"
                    className="rounded-full border border-zinc-300 bg-white px-6 py-3.5 text-center text-sm font-semibold transition-all hover:border-zinc-900 hover:shadow-sm sm:px-7"
                  >
                    Visit Our Store
                  </a>

                </div>

              </div>

              {/* HERO IMAGE */}

              <div className="relative min-h-[330px] overflow-hidden rounded-[2rem] bg-white shadow-sm sm:min-h-[500px] sm:rounded-[2.5rem]">

                <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-amber-100/50 blur-3xl" />

                <div className="absolute -bottom-20 -left-20 h-56 w-56 rounded-full bg-zinc-100/70 blur-3xl" />

                <div className="relative flex h-full min-h-[330px] items-center justify-center p-5 sm:min-h-[500px] sm:p-8">

                 {allProductList[0]?.image ? (

  <a
    href={`/products/${allProductList[0].slug}`}
    className="flex h-full w-full items-center justify-center"
    aria-label={`View ${allProductList[0].name}`}
  >
    <img
      src={allProductList[0].image}
      alt={allProductList[0].name}
      className="h-full w-full max-h-[360px] object-contain transition-transform duration-700 hover:scale-[1.03] sm:max-h-[460px]"
    />
  </a>

) : (

                    <div className="text-7xl sm:text-9xl">
                      🍳
                    </div>

                  )}

                </div>

                <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between rounded-2xl border border-white/70 bg-white/85 px-4 py-3 shadow-lg backdrop-blur-md sm:bottom-7 sm:left-7 sm:right-7 sm:px-5 sm:py-4">

                  <div className="min-w-0">

                    <p className="text-[8px] font-bold uppercase tracking-[0.18em] text-amber-700 sm:text-[10px]">
                      Featured Kitchenware
                    </p>

                  <a
  href={
    allProductList[0]?.slug
      ? `/products/${allProductList[0].slug}`
      : "#products"
  }
  className="mt-1 block max-w-[190px] truncate text-sm font-semibold text-zinc-800 transition-colors hover:text-amber-700 sm:max-w-xs"
>
  {allProductList[0]?.name || "Cook • Serve • Enjoy"}
</a>
                  </div>

                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-sm text-white">
                    →
                  </span>

                </div>

              </div>

            </div>

          </section>

          {/* ================================================= */}
          {/* TRUST STRIP */}
          {/* ================================================= */}

          <section className="border-y border-black/5 bg-white">

            <div className="mx-auto grid max-w-7xl grid-cols-2 divide-x divide-black/5 sm:grid-cols-4">

              <div className="px-4 py-6 text-center sm:py-7">
                <p className="text-xl sm:text-2xl">✓</p>
                <p className="mt-2 text-xs font-semibold sm:text-sm">
                  Quality Products
                </p>
              </div>

              <div className="px-4 py-6 text-center sm:py-7">
                <p className="text-xl sm:text-2xl">₹</p>
                <p className="mt-2 text-xs font-semibold sm:text-sm">
                  Fair Pricing
                </p>
              </div>

              <div className="px-4 py-6 text-center sm:py-7">
                <p className="text-xl sm:text-2xl">💬</p>
                <p className="mt-2 text-xs font-semibold sm:text-sm">
                  Easy Support
                </p>
              </div>

              <div className="px-4 py-6 text-center sm:py-7">
                <p className="text-xl sm:text-2xl">📍</p>
                <p className="mt-2 text-xs font-semibold sm:text-sm">
                  Local Store
                </p>
              </div>

            </div>

          </section>

          {/* ================================================= */}
          {/* CATEGORIES */}
          {/* ================================================= */}

          <section
            id="categories"
            className="border-t border-black/5 bg-[#faf9f6] py-14 sm:py-20"
          >

            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

              <div className="max-w-2xl">

                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-700 sm:text-sm">
                  Explore our collection
                </p>

                <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
                  Shop by Category
                </h2>

                <p className="mt-3 text-sm leading-6 text-zinc-500 sm:text-base">
                  Find the right essentials for cooking, serving
                  and everyday living.
                </p>

              </div>

              <div className="mt-7 grid grid-cols-2 gap-3 sm:mt-10 sm:grid-cols-4 sm:gap-6">

                {categoryCards.map((item) => (

                  <a
                    key={item.name}
                    href={`/?category=${encodeURIComponent(
                      item.name
                    )}#products`}
                    className="group relative overflow-hidden rounded-[1.5rem] border border-zinc-200 bg-white shadow-sm transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl sm:rounded-3xl"
                  >

                    <div className="relative h-36 overflow-hidden bg-white sm:h-52">

                      {item.image ? (

                        <img
                          src={item.image}
                          alt={item.title}
                          className="h-full w-full object-contain p-3 transition-transform duration-700 ease-out group-hover:scale-105 sm:p-5"
                        />

                      ) : (

                        <div className="flex h-full items-center justify-center text-5xl sm:text-7xl">
                          {item.fallback}
                        </div>

                      )}

                      <div className="absolute inset-0 bg-black/0 transition-all duration-500 group-hover:bg-black/5" />

                    </div>

                    <div className="p-3.5 sm:p-6">

                      <h3 className="text-sm font-bold sm:text-lg">
                        {item.title}
                      </h3>

                      <p className="mt-1 text-[10px] leading-4 text-zinc-500 sm:text-sm sm:leading-5">
                        {item.description}
                      </p>

                      <span className="mt-3 inline-block text-[10px] font-semibold text-amber-700 sm:mt-4 sm:text-xs">
                        Explore →
                      </span>

                    </div>

                  </a>

                ))}

              </div>

            </div>

          </section>

        </>
      )}

      {/* ===================================================== */}
      {/* PRODUCTS */}
      {/* ===================================================== */}

      <section
        id="products"
        className="border-t border-black/5 bg-white py-14 sm:py-20"
      >

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

          {/* HEADER */}

          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">

            <div>

              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-700 sm:text-sm">

                {cleanSearchQuery
                  ? "Search Results"
                  : activeCategory
                    ? activeCategory.title
                    : showAllProducts
                      ? "Our Collection"
                      : "Customer favourites"}

              </p>

              <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">

                {cleanSearchQuery
                  ? `Results for "${cleanSearchQuery}"`
                  : activeCategory
                    ? `${activeCategory.title} Collection`
                    : showAllProducts
                      ? "All Products"
                      : "Featured Products"}

              </h2>

              <p className="mt-3 text-sm text-zinc-500 sm:text-base">

                {cleanSearchQuery
                  ? `${productList.length} product${
                      productList.length === 1 ? "" : "s"
                    } found.`
                  : activeCategory
                    ? `Showing all products from ${activeCategory.title}.`
                    : showAllProducts
                      ? `Showing all ${productList.length} products.`
                      : "Explore our popular kitchen essentials."}

              </p>

            </div>

            {isFiltering && (

              <a
                href="/#products"
                className="w-fit rounded-full border border-zinc-300 bg-white px-5 py-2.5 text-sm font-semibold transition-all hover:border-zinc-900 hover:shadow-sm"
              >
                View Featured Products
              </a>

            )}

            {showAllProducts && (

              <a
                href="/#products"
                className="w-fit rounded-full border border-zinc-300 bg-white px-5 py-2.5 text-sm font-semibold transition-all hover:border-zinc-900 hover:shadow-sm"
              >
                View Featured Products
              </a>

            )}

          </div>

          {/* PRODUCT GRID */}

          {productList.length > 0 ? (

            <>

              <div
            className="mt-8 grid grid-cols-2 gap-3 pb-5 sm:gap-6 lg:grid-cols-3"
>

                {productList.map((product) => (

                  <article
                    key={product.id ?? product.slug}
className="
  group
  min-w-0
  overflow-hidden
  rounded-[1.5rem]
  border
  border-zinc-200
  bg-white
  shadow-sm
  transition-all
  duration-500
  hover:-translate-y-2
  hover:shadow-2xl
  sm:rounded-3xl
"                  >

                    <ProductCardImage
                      name={product.name}
                      image={product.image}
                      images={product.images}
                      badge={product.badge}
                    />

                    <div className="flex min-h-[310px] flex-col p-5 sm:min-h-[320px] sm:p-6">

                      <div className="flex items-center justify-between gap-3">

                        <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-zinc-400 sm:text-xs">
                          {product.category}
                        </p>

                        {product.badge && (

                          <span className="shrink-0 rounded-full bg-amber-50 px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-amber-700">
                            {product.badge}
                          </span>

                        )}

                      </div>

                      <a
                        href={`/products/${product.slug}`}
                        className="mt-3 line-clamp-2 text-lg font-bold leading-6 tracking-tight transition duration-200 hover:text-amber-700 sm:text-xl"
                      >
                        {product.name}
                      </a>

                      {/* PRICE */}

                      <div className="mt-4 flex flex-wrap items-center gap-3">

                        <span className="text-xl font-bold text-zinc-900">
                          ₹{product.price}
                        </span>

                        {product.old_price !== null &&
                          product.old_price !== undefined &&
                          Number(product.old_price) >
                            Number(product.price) && (

                            <>

                              <span className="text-sm text-zinc-400 line-through">
                                ₹{product.old_price}
                              </span>

                              <span className="rounded-full bg-green-50 px-2.5 py-1 text-[10px] font-bold text-green-700">

                                {Math.round(
                                  ((Number(product.old_price) -
                                    Number(product.price)) /
                                    Number(product.old_price)) *
                                    100
                                )}

                                % OFF

                              </span>

                            </>

                          )}

                      </div>

                      {product.description && (

                        <p className="mt-4 line-clamp-3 text-sm leading-6 text-zinc-500">
                          {product.description}
                        </p>

                      )}

                      {/* BUTTONS */}

                      <div className="mt-auto pt-6">

                        <a
                          href={`/products/${product.slug}`}
                          className="block w-full rounded-full bg-zinc-900 py-3.5 text-center text-sm font-semibold text-white transition-all duration-300 hover:bg-amber-700 hover:shadow-lg"
                        >
                          View Product →
                        </a>

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
                          className="mt-3 block w-full rounded-full border border-green-600 py-3 text-center text-sm font-semibold text-green-700 transition-all duration-300 hover:bg-green-600 hover:text-white hover:shadow-md"
                        >
                          Ask on WhatsApp
                        </a>

                      </div>

                    </div>

                  </article>

                ))}

              </div>

              {/* VIEW MORE */}

              {!isFiltering &&
                !showAllProducts &&
                productList.length > 0 && (

                  <div className="mt-8 flex justify-center sm:mt-12">

                    <a
                      href="/?showAll=true#products"
                      className="group inline-flex items-center gap-3 rounded-full border border-zinc-900 bg-zinc-900 px-6 py-3.5 text-sm font-semibold text-white shadow-lg transition-all duration-300 hover:-translate-y-1 hover:border-amber-700 hover:bg-amber-700 sm:px-7"
                    >

                      <span>
                        View More Products
                      </span>

                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 transition-transform duration-300 group-hover:translate-x-1">
                        →
                      </span>

                    </a>

                  </div>

                )}

            </>

          ) : (

            <div className="mt-10 rounded-3xl border border-dashed border-zinc-300 p-10 text-center">

              <div className="text-5xl">
                🔍
              </div>

              <h3 className="mt-4 text-xl font-bold">
                No products found
              </h3>

              <p className="mt-2 text-sm text-zinc-500">
                Try searching with a different product name or category.
              </p>

              <a
                href="/#products"
                className="mt-5 inline-block rounded-full bg-zinc-900 px-6 py-3 text-sm font-semibold text-white"
              >
                View Featured Products
              </a>

            </div>

          )}

        </div>

      </section>

      {/* ===================================================== */}
      {/* WHY CHOOSE US */}
      {/* ===================================================== */}

      <section
        id="why-us"
        className="bg-[#faf9f6] py-14 sm:py-20"
      >

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

          <div className="mx-auto max-w-2xl text-center">

            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-700 sm:text-sm">
              Why Dayal Kitchen Ware
            </p>

            <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
              Made for everyday living.
            </h2>

            <p className="mt-3 text-sm leading-6 text-zinc-500 sm:text-base">
              Simple products, helpful service and kitchen essentials
              you can rely on.
            </p>

          </div>

          <div className="mt-8 grid gap-4 sm:mt-12 sm:grid-cols-2 lg:grid-cols-4">

            {[
              {
                icon: "✓",
                title: "Quality Products",
                text: "Carefully selected kitchenware for everyday use.",
              },
              {
                icon: "₹",
                title: "Fair Pricing",
                text: "Useful products at practical and competitive prices.",
              },
              {
                icon: "💬",
                title: "Easy Support",
                text: "Have a question? Reach us directly on WhatsApp.",
              },
              {
                icon: "📍",
                title: "Local Store",
                text: "Visit our store and explore products in person.",
              },
            ].map((item) => (

              <div
                key={item.title}
                className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm transition-all duration-500 hover:-translate-y-1 hover:shadow-xl"
              >

                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f5efe4] text-xl">
                  {item.icon}
                </div>

                <h3 className="mt-5 text-lg font-bold">
                  {item.title}
                </h3>

                <p className="mt-2 text-sm leading-6 text-zinc-500">
                  {item.text}
                </p>

              </div>

            ))}

          </div>

        </div>

      </section>

      {/* ===================================================== */}
      {/* HOW TO ORDER */}
      {/* ===================================================== */}

      <section
        id="how-to-order"
        className="bg-white py-14 sm:py-20"
      >

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

          <div className="max-w-2xl">

            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-700 sm:text-sm">
              Simple shopping
            </p>

            <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
              How to order
            </h2>

            <p className="mt-3 text-sm leading-6 text-zinc-500 sm:text-base">
              Getting your favourite kitchenware is simple.
            </p>

          </div>

          <div className="mt-8 grid gap-4 sm:mt-12 md:grid-cols-3">

            <div className="rounded-3xl border border-zinc-200 bg-[#faf9f6] p-6 sm:p-8">

              <span className="text-sm font-bold text-amber-700">
                01
              </span>

              <h3 className="mt-4 text-xl font-bold">
                Browse
              </h3>

              <p className="mt-2 text-sm leading-6 text-zinc-500">
                Explore categories and find a product that fits
                your needs.
              </p>

            </div>

            <div className="rounded-3xl border border-zinc-200 bg-[#faf9f6] p-6 sm:p-8">

              <span className="text-sm font-bold text-amber-700">
                02
              </span>

              <h3 className="mt-4 text-xl font-bold">
                Ask on WhatsApp
              </h3>

              <p className="mt-2 text-sm leading-6 text-zinc-500">
                Send us your product enquiry and ask about
                availability.
              </p>

            </div>

            <div className="rounded-3xl border border-zinc-200 bg-[#faf9f6] p-6 sm:p-8">

              <span className="text-sm font-bold text-amber-700">
                03
              </span>

              <h3 className="mt-4 text-xl font-bold">
                Confirm & Buy
              </h3>

              <p className="mt-2 text-sm leading-6 text-zinc-500">
                Confirm your order with our team and get the
                product details.
              </p>

            </div>

          </div>

        </div>

      </section>

      {/* ===================================================== */}
      {/* LOCATION */}
      {/* ===================================================== */}

      <section
        id="location"
        className="bg-[#eee8dc] py-14 sm:py-20"
      >

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

          <div className="grid items-center gap-8 lg:grid-cols-2 lg:gap-14">

            {/* LOCATION INFO */}

            <div>

              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-700 sm:text-sm">
                Visit our store
              </p>

              <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-5xl">
                Come see us in person.
              </h2>

              <p className="mt-5 max-w-xl text-sm leading-7 text-zinc-600 sm:text-base sm:leading-8">
                Looking for something specific? Visit Dayal Kitchen
                Ware and explore our collection of kitchen and home
                essentials.
              </p>

              <div className="mt-7 rounded-3xl border border-white/70 bg-white/70 p-5 shadow-sm backdrop-blur sm:p-6">

                <div className="flex gap-4">

                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-zinc-900 text-lg text-white">
                    📍
                  </div>

                  <div>

                    <p className="text-sm font-bold">
                      Dayal Kitchen Ware
                    </p>

                    <p className="mt-1 text-sm leading-6 text-zinc-500">
                      Visit our store for kitchenware, cookware,
                      bottles, dinner sets and more.
                    </p>

                  </div>

                </div>

              </div>

              <div className="mt-5 flex flex-col gap-3 sm:flex-row">

                <a
                  href={mapsLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full bg-zinc-900 px-6 py-3.5 text-center text-sm font-semibold text-white transition-all hover:bg-amber-700 hover:shadow-lg"
                >
                  Get Directions →
                </a>

                <a
                  href={whatsappLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full border border-green-600 bg-white px-6 py-3.5 text-center text-sm font-semibold text-green-700 transition-all hover:bg-green-600 hover:text-white"
                >
                  WhatsApp Us
                </a>

              </div>

            </div>

            {/* MAP CARD */}

            <div className="relative min-h-[330px] overflow-hidden rounded-[2rem] border border-white/70 bg-white shadow-xl sm:min-h-[420px]">

              <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(245,158,11,0.15),transparent_35%),radial-gradient(circle_at_80%_80%,rgba(0,0,0,0.08),transparent_35%)]" />

              <div className="relative flex h-full min-h-[330px] flex-col items-center justify-center px-6 text-center sm:min-h-[420px]">

                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-zinc-900 text-2xl text-white shadow-xl">
                  📍
                </div>

                <p className="mt-5 text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">
                  Dayal Kitchen Ware
                </p>

                <h3 className="mt-2 text-2xl font-bold">
                  Find us on Google Maps
                </h3>

                <p className="mt-3 max-w-sm text-sm leading-6 text-zinc-500">
                  Tap below to open our exact location and get
                  directions from your phone.
                </p>

                <a
                  href={mapsLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-6 rounded-full bg-zinc-900 px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-amber-700 hover:shadow-lg"
                >
                  Open Google Maps ↗
                </a>

              </div>

            </div>

          </div>

        </div>

      </section>

      {/* ===================================================== */}
      {/* ABOUT */}
      {/* ===================================================== */}

      <section
        id="about"
        className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8"
      >

        <div className="grid gap-10 lg:grid-cols-2 lg:items-center">

          <div>

            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-700 sm:text-sm">
              About Dayal Kitchen Ware
            </p>

            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-5xl">
              Kitchen essentials made simple.
            </h2>

          </div>

          <div>

            <p className="text-sm leading-7 text-zinc-600 sm:text-lg sm:leading-8">
              We believe good kitchenware should be practical,
              beautiful and made for everyday life. Our collection
              brings together useful products for cooking, serving
              and organizing your kitchen.
            </p>

            <p className="mt-4 text-sm leading-7 text-zinc-600 sm:text-base">
              Whether you are upgrading your kitchen or simply
              looking for something useful for everyday cooking,
              we are here to help you find the right product.
            </p>

          </div>

        </div>

      </section>

      {/* ===================================================== */}
      {/* CONTACT CTA */}
      {/* ===================================================== */}

      <section
        id="contact"
        className="bg-zinc-950 py-14 text-white sm:py-20"
      >

        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">

          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-400 sm:text-sm">
            Need help?
          </p>

          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-5xl">
            Have a question about a product?
          </h2>

          <p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-zinc-400 sm:text-base sm:leading-7">
            Contact Dayal Kitchen Ware directly for product
            information, availability and orders.
          </p>

          <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">

            <a
              href={whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full bg-green-600 px-7 py-3.5 text-sm font-semibold text-white transition hover:bg-green-500 hover:shadow-lg"
            >
              Chat on WhatsApp
            </a>

            <a
              href={mapsLink}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full border border-zinc-700 px-7 py-3.5 text-sm font-semibold text-white transition hover:border-zinc-400 hover:bg-white/5"
            >
              Visit Store →
            </a>

          </div>

        </div>

      </section>

      {/* ===================================================== */}
      {/* FOOTER */}
      {/* ===================================================== */}

      <footer className="bg-zinc-950 py-10 text-white">

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">

            <div>

              <p className="font-bold">
                DAYAL KITCHEN WARE
              </p>

              <p className="mt-1 text-xs text-zinc-500">
                Kitchen • Home • Lifestyle
              </p>

            </div>

            <div>

              <p className="text-sm font-semibold">
                Explore
              </p>

              <div className="mt-3 flex flex-col gap-2 text-sm text-zinc-500">

                <a
                  href="#categories"
                  className="transition hover:text-white"
                >
                  Categories
                </a>

                <a
                  href="#products"
                  className="transition hover:text-white"
                >
                  Products
                </a>

                <a
                  href="#why-us"
                  className="transition hover:text-white"
                >
                  Why Choose Us
                </a>

              </div>

            </div>

            <div>

              <p className="text-sm font-semibold">
                Store
              </p>

              <div className="mt-3 flex flex-col gap-2 text-sm text-zinc-500">

                <a
                  href="#location"
                  className="transition hover:text-white"
                >
                  Visit Store
                </a>

                <a
                  href={mapsLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition hover:text-white"
                >
                  Google Maps
                </a>

                <a
                  href={whatsappLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition hover:text-white"
                >
                  WhatsApp
                </a>

              </div>

            </div>

            <div>

              <p className="text-sm font-semibold">
                Quick Contact
              </p>

              <a
                href={whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-block text-sm text-green-500 transition hover:text-green-400"
              >
                Chat with us →
              </a>

            </div>

          </div>

          <div className="mt-10 border-t border-white/10 pt-6">

            <p className="text-xs text-zinc-500">
              © 2026 Dayal Kitchen Ware. All rights reserved.
            </p>

          </div>

        </div>

      </footer>
            

      {/* MOBILE BOTTOM NAVIGATION */}

      <nav className="fixed bottom-0 left-0 right-0 z-[100] border-t border-black/10 bg-white/95 px-2 pb-[env(safe-area-inset-bottom)] pt-2 shadow-[0_-8px_30px_rgba(0,0,0,0.08)] backdrop-blur-xl md:hidden">

        <div className="mx-auto flex max-w-md items-center justify-around">

          <a
            href="#home"
            className="flex min-w-[64px] flex-col items-center gap-1 rounded-xl px-3 py-2 text-zinc-500 transition-all active:scale-90"
          >
            <span className="text-xl">⌂</span>
            <span className="text-[10px] font-semibold">Home</span>
          </a>

          <a
            href="#categories"
            className="flex min-w-[64px] flex-col items-center gap-1 rounded-xl px-3 py-2 text-zinc-500 transition-all active:scale-90"
          >
            <span className="text-xl">▦</span>
            <span className="text-[10px] font-semibold">Categories</span>
          </a>

          <a
            href="#products"
            className="flex min-w-[64px] flex-col items-center gap-1 rounded-xl px-3 py-2 text-zinc-500 transition-all active:scale-90"
          >
            <span className="text-xl">🛍</span>
            <span className="text-[10px] font-semibold">Products</span>
          </a>

          <a
            href="#about"
            className="flex min-w-[64px] flex-col items-center gap-1 rounded-xl px-3 py-2 text-zinc-500 transition-all active:scale-90"
          >
            <span className="text-xl">ⓘ</span>
            <span className="text-[10px] font-semibold">About</span>
          </a>

          <a
            href={whatsappLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex min-w-[64px] flex-col items-center gap-1 rounded-xl px-3 py-2 text-green-600 transition-all active:scale-90"
          >
            <span className="text-xl">💬</span>
            <span className="text-[10px] font-semibold">WhatsApp</span>
          </a>

        </div>

      </nav>

     <MobileBottomNav />
    </main>
  );
}