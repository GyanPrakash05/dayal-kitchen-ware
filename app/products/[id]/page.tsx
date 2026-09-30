import { notFound } from "next/navigation";
import { supabaseAdmin } from "@/app/lib/supabaseAdmin";

import MobileBackHandler from "@/app/components/MobileBackHandler";
import ProductGallery from "@/app/components/ProductGallery";
import AddToCartButton from "@/app/components/AddToCartButton";
import ProductReviews from "../../components/ProductReviews";

type Product = {
  id: string;
  name: string;
  slug: string;
  category: string;
  price: number;
  old_price: number | null;
  badge: string | null;
  image: string | null;
  images: string[] | null;
  description: string | null;
  brand: string | null;
  size: string | null;
  material: string | null;
  capacity: string | null;
  colour: string | null;
  warranty: string | null;
  model_number: string | null;
};

type SuggestedProduct = {
  id: string;
  name: string;
  slug: string;
  category: string;
  price: number;
  old_price: number | null;
  badge: string | null;
  image: string | null;
  images: string[] | null;
};

type Review = {
  rating: number;
};

function StarsInline({ rating }: { rating: number }) {
  return (
    <div
      className="flex items-center gap-0.5"
      aria-label={`${rating.toFixed(1)} out of 5 stars`}
    >
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          className={
            star <= Math.round(rating)
              ? "text-amber-500"
              : "text-zinc-300"
          }
        >
          ★
        </span>
      ))}
    </div>
  );
}

function formatPrice(price: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(price);
}

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: string | null;
}) {
  if (!value) return null;

  return (
    <div className="flex flex-col gap-1 border-b border-zinc-100 py-4 sm:flex-row sm:items-center sm:justify-between">
      <span className="text-sm font-medium text-zinc-500">
        {label}
      </span>

      <span className="text-sm font-semibold text-zinc-900 sm:text-right">
        {value}
      </span>
    </div>
  );
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

const { data: productBySlug, error: slugError } =
  await supabaseAdmin
    .from("products")
    .select(
      `
        id,
        name,
        slug,
        category,
        price,
        old_price,
        badge,
        image,
        images,
        description,
        brand,
        size,
        material,
        capacity,
        colour,
        warranty,
        model_number
      `
    )
    .eq("slug", id)
    .maybeSingle();

let product = productBySlug;

if (!product && !slugError) {
  const { data: productById, error: idError } =
    await supabaseAdmin
      .from("products")
      .select(
        `
          id,
          name,
          slug,
          category,
          price,
          old_price,
          badge,
          image,
          images,
          description,
          brand,
          size,
          material,
          capacity,
          colour,
          warranty,
          model_number
        `
      )
      .eq("id", id)
      .maybeSingle();

  if (idError) {
    console.error("Product ID lookup error:", {
      message: idError.message,
      details: idError.details,
      hint: idError.hint,
      code: idError.code,
    });
  }

  product = productById;
}

if (slugError) {
  console.error("Product slug lookup error:", {
    message: slugError.message,
    details: slugError.details,
    hint: slugError.hint,
    code: slugError.code,
  });

  notFound();
}

if (!product) {
  notFound();
}


  const typedProduct = product as Product;

  /*
   * Load approved reviews for the rating summary.
   * No fake/default rating is used.
   */
  const { data: reviews } = await supabaseAdmin
    .from("product_reviews")
    .select("rating")
    .eq("product_id", typedProduct.id)
    .eq("status", "approved");

  const approvedReviews = (reviews ?? []) as Review[];

  const reviewCount = approvedReviews.length;

  const averageRating =
    reviewCount > 0
      ? Number(
          (
            approvedReviews.reduce(
              (sum, review) => sum + Number(review.rating),
              0
            ) / reviewCount
          ).toFixed(1)
        )
      : 0;

  /*
   * Suggested products from the same category.
   */
  const { data: suggestedProducts } = await supabaseAdmin
    .from("products")
    .select(
      `
        id,
        name,
        slug,
        category,
        price,
        old_price,
        badge,
        image,
        images
      `
    )
    .eq("category", typedProduct.category)
    .neq("id", typedProduct.id)
    .order("created_at", { ascending: false })
    .limit(4);

  /*
   * Fallback: if there are not enough products in the same category,
   * load some other products.
   */
  let finalSuggestedProducts =
    (suggestedProducts ?? []) as SuggestedProduct[];

  if (finalSuggestedProducts.length < 4) {
    const existingIds = [
      typedProduct.id,
      ...finalSuggestedProducts.map((item) => item.id),
    ];

    const { data: fallbackProducts } = await supabaseAdmin
      .from("products")
      .select(
        `
          id,
          name,
          slug,
          category,
          price,
          old_price,
          badge,
          image,
          images
        `
      )
      .not("id", "in", `(${existingIds.join(",")})`)
      .order("created_at", { ascending: false })
      .limit(4);

    const fallback =
      (fallbackProducts ?? []) as SuggestedProduct[];

    finalSuggestedProducts = [
      ...finalSuggestedProducts,
      ...fallback,
    ].slice(0, 4);
  }

  return (
    <>
      <MobileBackHandler />

      <main className="min-h-screen bg-[#faf9f6]">
        {/* ================= HEADER + BREADCRUMB ================= */}

<section className="border-b border-zinc-200 bg-white">
  <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">

    {/* Brand Header */}
    <div className="flex min-h-[76px] items-center justify-between gap-4">

      {/* Brand */}
      <a href="/" className="group min-w-0">
        <div className="text-lg font-black tracking-tight text-zinc-950 sm:text-xl">
          DAYAL KITCHEN WARE
        </div>

        <div className="mt-0.5 text-[10px] font-medium uppercase tracking-[0.2em] text-zinc-500 sm:text-xs">
          Kitchen • Home • Lifestyle
        </div>
      </a>

      {/* Navigation */}
      <nav className="hidden items-center gap-6 md:flex">
        <a
          href="/"
          className="text-sm font-medium text-zinc-600 transition hover:text-zinc-950"
        >
          Home
        </a>

        <a
          href="/#categories"
          className="text-sm font-medium text-zinc-600 transition hover:text-zinc-950"
        >
          Categories
        </a>

        <a
          href="/#products"
          className="text-sm font-medium text-zinc-600 transition hover:text-zinc-950"
        >
          Products
        </a>

        <a
          href="/#location"
          className="text-sm font-medium text-zinc-600 transition hover:text-zinc-950"
        >
          Store
        </a>
      </nav>

      {/* Cart */}
      <a
        href="/cart"
        className="flex shrink-0 items-center gap-2 rounded-full border border-zinc-200 bg-zinc-50 px-4 py-2 text-sm font-semibold text-zinc-900 transition hover:border-zinc-300 hover:bg-zinc-100"
      >
        <span className="text-base">🛒</span>
        <span className="hidden sm:inline">Cart</span>
      </a>
    </div>

    {/* Mobile Navigation */}
    <div className="flex gap-5 overflow-x-auto border-t border-zinc-100 py-3 md:hidden">
      <a
        href="/"
        className="whitespace-nowrap text-xs font-semibold text-zinc-700"
      >
        Home
      </a>

      <a
        href="/#categories"
        className="whitespace-nowrap text-xs font-semibold text-zinc-700"
      >
        Categories
      </a>

      <a
        href="/#products"
        className="whitespace-nowrap text-xs font-semibold text-zinc-700"
      >
        Products
      </a>

      <a
        href="/#location"
        className="whitespace-nowrap text-xs font-semibold text-zinc-700"
      >
        Store
      </a>
    </div>

    {/* Breadcrumb */}
    <div className="flex flex-wrap items-center gap-2 border-t border-zinc-100 py-4 text-xs text-zinc-500 sm:text-sm">
      <a
        href="/"
        className="font-medium transition hover:text-zinc-900"
      >
        Home
      </a>

      <span>/</span>

      <span>{typedProduct.category}</span>

      <span>/</span>

      <span className="max-w-[220px] truncate font-medium text-zinc-900 sm:max-w-[420px]">
        {typedProduct.name}
      </span>
    </div>

  </div>
</section>
        {/* ================= PRODUCT ================= */}

        <section className="mx-auto w-full max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
          <div className="grid min-w-0 gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-12">
            {/* ================= LEFT ================= */}

            <div className="min-w-0">
              <ProductGallery
                name={typedProduct.name}
                image={typedProduct.image}
                images={typedProduct.images}
              />

              {/* Mobile / below-image product information */}

              <div className="mt-8 rounded-[2rem] border border-zinc-200 bg-white p-6 shadow-sm lg:hidden">
                <div className="mb-5">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">
                    {typedProduct.category}
                  </p>

                  <h1 className="text-2xl font-bold leading-tight tracking-tight text-zinc-950">
                    {typedProduct.name}
                  </h1>
                </div>

                {reviewCount > 0 && (
                  <div className="mb-5 flex items-center gap-3">
                    <StarsInline rating={averageRating} />

                    <span className="text-sm font-medium text-zinc-600">
                      {averageRating.toFixed(1)} · {reviewCount}{" "}
                      {reviewCount === 1 ? "review" : "reviews"}
                    </span>
                  </div>
                )}

                <div className="flex flex-wrap items-end gap-3">
                  <span className="text-3xl font-bold text-zinc-950">
                    {formatPrice(Number(typedProduct.price))}
                  </span>

                  {typedProduct.old_price &&
                    Number(typedProduct.old_price) >
                      Number(typedProduct.price) && (
                      <span className="pb-1 text-base text-zinc-400 line-through">
                        {formatPrice(
                          Number(typedProduct.old_price)
                        )}
                      </span>
                    )}
                </div>
              </div>

              {/* ================= DETAILS UNDER IMAGE ================= */}

              <div className="mt-8 rounded-[2rem] border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
                <div className="mb-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">
                    Product information
                  </p>

                  <h2 className="mt-2 text-2xl font-bold tracking-tight text-zinc-950">
                    Details
                  </h2>
                </div>

                <div className="divide-y divide-zinc-100">
                  <DetailRow
                    label="Brand"
                    value={typedProduct.brand}
                  />

                  <DetailRow
                    label="Size"
                    value={typedProduct.size}
                  />

                  <DetailRow
                    label="Material"
                    value={typedProduct.material}
                  />

                  <DetailRow
                    label="Capacity"
                    value={typedProduct.capacity}
                  />

                  <DetailRow
                    label="Colour"
                    value={typedProduct.colour}
                  />

                  <DetailRow
                    label="Warranty"
                    value={typedProduct.warranty}
                  />

                  <DetailRow
                    label="Model Number"
                    value={typedProduct.model_number}
                  />
                </div>
              </div>

              {/* ================= DESCRIPTION ================= */}

              {typedProduct.description && (
                <div className="mt-8 rounded-[2rem] border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">
                    About this product
                  </p>

                  <h2 className="mt-2 text-2xl font-bold tracking-tight text-zinc-950">
                    Description
                  </h2>

                  <div className="mt-5 whitespace-pre-line text-[15px] leading-7 text-zinc-600">
                    {typedProduct.description}
                  </div>
                </div>
              )}
            </div>

            {/* ================= RIGHT ================= */}

            <div className="min-w-0">
              <div className="sticky top-6 rounded-[2rem] border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">
                  {typedProduct.category}
                </p>

                <h1 className="mt-3 text-3xl font-bold leading-tight tracking-tight text-zinc-950 sm:text-4xl">
                  {typedProduct.name}
                </h1>

                {typedProduct.brand && (
                  <p className="mt-3 text-sm text-zinc-500">
                    Brand:{" "}
                    <span className="font-semibold text-zinc-800">
                      {typedProduct.brand}
                    </span>
                  </p>
                )}

                {/* Rating */}

                <div className="mt-5">
                  {reviewCount > 0 ? (
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="flex items-center gap-2">
                        <StarsInline rating={averageRating} />

                        <span className="font-semibold text-zinc-900">
                          {averageRating.toFixed(1)}
                        </span>
                      </div>

                      <span className="text-sm text-zinc-500">
                        {reviewCount}{" "}
                        {reviewCount === 1
                          ? "verified review"
                          : "verified reviews"}
                      </span>
                    </div>
                  ) : (
                    <p className="text-sm text-zinc-500">
                      No reviews yet
                    </p>
                  )}
                </div>

                {/* Price */}

                <div className="mt-7 flex flex-wrap items-end gap-3">
                  <span className="text-4xl font-bold tracking-tight text-zinc-950">
                    {formatPrice(Number(typedProduct.price))}
                  </span>

                  {typedProduct.old_price &&
                    Number(typedProduct.old_price) >
                      Number(typedProduct.price) && (
                      <>
                        <span className="pb-1 text-lg text-zinc-400 line-through">
                          {formatPrice(
                            Number(typedProduct.old_price)
                          )}
                        </span>

                        <span className="mb-1 rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-700">
                          Save{" "}
                          {formatPrice(
                            Number(typedProduct.old_price) -
                              Number(typedProduct.price)
                          )}
                        </span>
                      </>
                    )}
                </div>

                {typedProduct.badge && (
                  <div className="mt-5 inline-flex rounded-full bg-amber-100 px-3 py-1.5 text-xs font-bold text-amber-800">
                    {typedProduct.badge}
                  </div>
                )}

                {/* Quick specifications */}

                <div className="mt-7 grid grid-cols-2 gap-3">
                  {typedProduct.size && (
                    <div className="rounded-2xl bg-[#faf9f6] p-4">
                      <p className="text-xs text-zinc-500">
                        Size
                      </p>
                      <p className="mt-1 font-semibold text-zinc-900">
                        {typedProduct.size}
                      </p>
                    </div>
                  )}

                  {typedProduct.material && (
                    <div className="rounded-2xl bg-[#faf9f6] p-4">
                      <p className="text-xs text-zinc-500">
                        Material
                      </p>
                      <p className="mt-1 font-semibold text-zinc-900">
                        {typedProduct.material}
                      </p>
                    </div>
                  )}

                  {typedProduct.capacity && (
                    <div className="rounded-2xl bg-[#faf9f6] p-4">
                      <p className="text-xs text-zinc-500">
                        Capacity
                      </p>
                      <p className="mt-1 font-semibold text-zinc-900">
                        {typedProduct.capacity}
                      </p>
                    </div>
                  )}

                  {typedProduct.colour && (
                    <div className="rounded-2xl bg-[#faf9f6] p-4">
                      <p className="text-xs text-zinc-500">
                        Colour
                      </p>
                      <p className="mt-1 font-semibold text-zinc-900">
                        {typedProduct.colour}
                      </p>
                    </div>
                  )}
                </div>

                {/* Add to cart */}

                <div className="mt-8">
                  <AddToCartButton
                    product={{
                      id: typedProduct.id,
                      name: typedProduct.name,
                      slug: typedProduct.slug,
                      price: Number(typedProduct.price),
                      image: typedProduct.image ?? "",
                    }}
                  />
                </div>

                {/* Delivery / help */}

                <div className="mt-6 rounded-2xl bg-zinc-50 p-5">
                  <div className="space-y-4">
                    <div className="flex gap-3">
                      <span className="text-lg">🚚</span>

                      <div>
                        <p className="font-semibold text-zinc-900">
                          Local delivery
                        </p>

                        <p className="mt-1 text-sm leading-6 text-zinc-500">
                          Delivery availability and charges are
                          confirmed according to your location and
                          order.
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <span className="text-lg">✓</span>

                      <div>
                        <p className="font-semibold text-zinc-900">
                          Genuine local store
                        </p>

                        <p className="mt-1 text-sm leading-6 text-zinc-500">
                          Product availability is subject to actual
                          store inventory.
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <span className="text-lg">💬</span>

                      <div>
                        <p className="font-semibold text-zinc-900">
                          Need help?
                        </p>

                        <p className="mt-1 text-sm leading-6 text-zinc-500">
                          Contact us for product or order-related
                          assistance.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ================= REVIEWS ================= */}

          <section className="mt-16">
            <ProductReviews productId={typedProduct.id} />
          </section>

          {/* ================= SUGGESTED PRODUCTS ================= */}

          {finalSuggestedProducts.length > 0 && (
            <section className="mt-20">
              <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">
                    You may also like
                  </p>

                  <h2 className="mt-2 text-3xl font-bold tracking-tight text-zinc-950">
                    Suggested Products
                  </h2>

                  <p className="mt-2 text-sm text-zinc-500">
                    More products you may find useful.
                  </p>
                </div>

                <a
                  href="/"
                  className="text-sm font-semibold text-zinc-900 underline underline-offset-4"
                >
                  View all products
                </a>
              </div>

              <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {finalSuggestedProducts.map((item) => (
                  <a
                    key={item.id}
                    href={`/products/${item.id}`}
                    className="group min-w-0 overflow-hidden rounded-[1.5rem] border border-zinc-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg"
                  >
                    <div className="relative flex aspect-square items-center justify-center overflow-hidden bg-[#eee8dc]">
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.name}
                          loading="lazy"
                          className="h-full w-full object-contain p-5 transition duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <span className="text-5xl">
                          🍳
                        </span>
                      )}

                      {item.badge && (
                        <span className="absolute left-3 top-3 rounded-full bg-zinc-900 px-2.5 py-1 text-[10px] font-bold text-white">
                          {item.badge}
                        </span>
                      )}
                    </div>

                    <div className="p-4">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                        {item.category}
                      </p>

                      <h3 className="mt-1 line-clamp-2 min-h-[40px] text-sm font-semibold leading-5 text-zinc-900">
                        {item.name}
                      </h3>

                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <span className="font-bold text-zinc-950">
                          {formatPrice(Number(item.price))}
                        </span>

                        {item.old_price &&
                          Number(item.old_price) >
                            Number(item.price) && (
                            <span className="text-xs text-zinc-400 line-through">
                              {formatPrice(
                                Number(item.old_price)
                              )}
                            </span>
                          )}
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            </section>
          )}
        </section>
      </main>
    </>
  );
}