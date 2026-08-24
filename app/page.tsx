import { supabase } from "./lib/supabase";
import ProductCardImage from "./components/ProductCardImage";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const WHATSAPP_NUMBER = "917011872380";

const whatsappMessage =
  "Hello Dayal Kitchen Ware 👋 I have a query about your products.";

const whatsappLink = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
  whatsappMessage
)}`;

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
  //
  // Homepage              = 4 products
  // View More             = All products
  // Category              = All matching products
  // Search                = All matching products
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
    <main className="min-h-screen overflow-x-hidden bg-[#faf9f6] text-zinc-900">

      {/* ===================================================== */}
      {/* NAVBAR */}
      {/* ===================================================== */}

      <header className="sticky top-0 z-50 border-b border-black/5 bg-white/95 backdrop-blur-xl">

        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">

          <div className="flex items-center justify-between gap-4">

            {/* LOGO */}

            <a href="/" className="block shrink-0">

              <h1 className="text-base font-bold tracking-tight sm:text-xl">
                DAYAL KITCHEN WARE
              </h1>

              <p className="text-[8px] uppercase tracking-[0.2em] text-zinc-500 sm:text-[10px]">
                Kitchen • Home • Lifestyle
              </p>

            </a>

            {/* ================================================= */}
            {/* DESKTOP NAV */}
            {/* ================================================= */}

            <div className="hidden items-center gap-5 md:flex">

              <nav className="flex items-center gap-6 text-sm font-medium lg:gap-8">

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
                  href="#about"
                  className="transition-colors hover:text-amber-700"
                >
                  About
                </a>

                <a
                  href="#contact"
                  className="transition-colors hover:text-amber-700"
                >
                  Contact
                </a>

              </nav>

              {/* SEARCH BAR */}

              <form
                action="/"
                method="GET"
                className="relative"
              >

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
                      d="m21 21-4.35-4.35m1.35-5.65a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z"
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

            {/* ================================================= */}
            {/* MOBILE MENU */}
            {/* ================================================= */}

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

              <div className="absolute right-0 top-12 w-72 rounded-2xl border border-zinc-200 bg-white p-3 shadow-xl">

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
                          d="m21 21-4.35-4.35m1.35-5.65a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z"
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
            className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8 lg:py-28"
          >

            <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">

              {/* HERO TEXT */}

              <div className="animate-[fadeInUp_0.7s_ease-out]">

                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-700 sm:text-sm sm:tracking-[0.2em]">
                  Quality kitchenware for every home
                </p>

                <h2 className="mt-4 text-4xl font-bold leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl">

                  Everything your
                  <br />

                  kitchen needs.
                  <br />

                  <span className="text-amber-700">
                    Made for everyday.
                  </span>

                </h2>

                <p className="mt-5 max-w-xl text-base leading-7 text-zinc-600 sm:mt-6 sm:text-lg sm:leading-8">
                  Discover beautiful, practical and reliable
                  kitchenware designed for everyday cooking and
                  modern homes.
                </p>

                <div className="mt-7 flex flex-wrap gap-3 sm:mt-8 sm:gap-4">

                  <a
                    href="#categories"
                    className="rounded-full bg-zinc-900 px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-amber-700 hover:shadow-lg sm:px-7"
                  >
                    Explore Collection →
                  </a>

                  <a
                    href="#about"
                    className="rounded-full border border-zinc-300 bg-white px-6 py-3 text-sm font-semibold transition-all hover:border-zinc-900 hover:shadow-sm sm:px-7"
                  >
                    Learn More
                  </a>

                </div>

              </div>

              {/* HERO IMAGE */}

              <div className="relative min-h-[360px] overflow-hidden rounded-[2.5rem] bg-[#e8e0d2] shadow-sm sm:min-h-[500px]">

                <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-amber-200/40 blur-3xl" />

                <div className="absolute -bottom-20 -left-20 h-56 w-56 rounded-full bg-white/60 blur-3xl" />

                <div className="relative flex h-full min-h-[360px] items-center justify-center p-8 sm:min-h-[500px]">

                  {allProductList[0]?.image ? (

                    <img
                      src={allProductList[0].image}
                      alt={allProductList[0].name}
                      className="max-h-[300px] w-auto max-w-[90%] object-contain drop-shadow-2xl transition-transform duration-700 hover:scale-105 sm:max-h-[410px]"
                    />

                  ) : (

                    <div className="text-7xl sm:text-9xl">
                      🍳
                    </div>

                  )}

                </div>

                <div className="absolute bottom-5 left-5 right-5 flex items-center justify-between rounded-2xl border border-white/60 bg-white/80 px-4 py-3 shadow-lg backdrop-blur-md sm:bottom-7 sm:left-7 sm:right-7 sm:px-5 sm:py-4">

                  <div>

                    <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-amber-700 sm:text-[10px]">
                      Featured Kitchenware
                    </p>

                    <p className="mt-1 max-w-[190px] truncate text-sm font-semibold text-zinc-800 sm:max-w-xs">
                      {allProductList[0]?.name ||
                        "Cook • Serve • Enjoy"}
                    </p>

                  </div>

                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-sm text-white">
                    →
                  </span>

                </div>

              </div>

            </div>

          </section>

          {/* ================================================= */}
          {/* CATEGORIES */}
          {/* ================================================= */}

          <section
            id="categories"
            className="border-t border-black/5 bg-[#faf9f6] py-16 sm:py-20"
          >

            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

              <div className="max-w-2xl">

                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-700 sm:text-sm">
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

              <div className="mt-8 grid grid-cols-2 gap-4 sm:mt-10 sm:grid-cols-4 sm:gap-6">

                {categoryCards.map((item) => (

                  <a
                    key={item.name}
                    href={`/?category=${encodeURIComponent(
                      item.name
                    )}#products`}
                    className="group relative overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-sm transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl"
                  >

                    <div className="relative h-40 overflow-hidden bg-[#eee8dc] sm:h-52">

                      {item.image ? (

                        <img
                          src={item.image}
                          alt={item.title}
                          className="h-full w-full object-contain p-6 drop-shadow-lg transition-transform duration-700 ease-out group-hover:scale-110"
                        />

                      ) : (

                        <div className="flex h-full items-center justify-center text-6xl sm:text-7xl">
                          {item.fallback}
                        </div>

                      )}

                      <div className="absolute inset-0 bg-black/0 transition-all duration-500 group-hover:bg-black/5" />

                      <div className="absolute right-4 top-4 flex h-9 w-9 translate-y-2 items-center justify-center rounded-full bg-white/90 text-sm font-bold opacity-0 shadow-md backdrop-blur transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100">
                        ↗
                      </div>

                    </div>

                    <div className="p-4 sm:p-6">

                      <h3 className="text-base font-bold sm:text-lg">
                        {item.title}
                      </h3>

                      <p className="mt-1 text-xs leading-5 text-zinc-500 sm:text-sm">
                        {item.description}
                      </p>

                      <span className="mt-4 inline-block text-xs font-semibold text-amber-700 transition-transform duration-300 group-hover:translate-x-1">
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
        className="border-t border-black/5 bg-white py-16 sm:py-20"
      >

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

          {/* ================================================= */}
          {/* PRODUCTS HEADER */}
          {/* ================================================= */}

          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">

            <div>

              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-700 sm:text-sm">

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

            {/* BACK TO FEATURED */}

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

          {/* ================================================= */}
          {/* PRODUCT GRID */}
          {/* ================================================= */}

          {productList.length > 0 ? (

            <>

              <div
                className="mt-8 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-5 sm:grid sm:grid-cols-2 sm:gap-6 sm:overflow-visible sm:pb-0 lg:grid-cols-3"
                style={{
                  scrollbarWidth: "none",
                  msOverflowStyle: "none",
                }}
              >

                {productList.map((product) => (

                  <article
                    key={product.id ?? product.slug}
                    className="group w-[82vw] min-w-[82vw] snap-start overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-sm transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl sm:w-auto sm:min-w-0"
                  >

                    <ProductCardImage
                      name={product.name}
                      image={product.image}
                      images={product.images}
                      badge={product.badge}
                    />

                    <div className="flex min-h-[320px] flex-col p-5 sm:p-6">

                      <div className="flex items-center justify-between gap-3">

                        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-400 sm:text-xs">
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

                      {/* DESCRIPTION */}

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

              {/* ================================================= */}
              {/* VIEW MORE PRODUCTS */}
              {/* ================================================= */}

              {!isFiltering &&
                !showAllProducts &&
                productList.length > 0 && (

                  <div className="mt-10 flex justify-center sm:mt-12">

                    <a
                      href="/?showAll=true#products"
                      className="group inline-flex items-center gap-3 rounded-full border border-zinc-900 bg-zinc-900 px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-zinc-900/10 transition-all duration-300 hover:-translate-y-1 hover:border-amber-700 hover:bg-amber-700 hover:shadow-xl hover:shadow-amber-700/20"
                    >

                      <span>
                        View More Products
                      </span>

                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 transition-transform duration-300 group-hover:translate-x-1 group-hover:bg-white/20">
                        →
                      </span>

                    </a>

                  </div>

                )}

            </>

          ) : (

            /* ================================================= */
            /* NO PRODUCTS */
            /* ================================================= */

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
            className="mt-7 inline-block rounded-full bg-zinc-900 px-7 py-3 text-sm font-semibold text-white transition hover:bg-amber-700"
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