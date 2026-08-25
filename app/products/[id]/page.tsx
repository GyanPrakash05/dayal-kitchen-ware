import { notFound } from "next/navigation";
import { supabase } from "@/app/lib/supabase";

import ProductGallery from "@/app/components/ProductGallery";
import AddToCartButton from "@/app/components/AddToCartButton";

type ProductPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function ProductPage({
  params,
}: ProductPageProps) {
  const { id } = await params;

  const { data: product, error } = await supabase
    .from("products")
    .select("*")
    .eq("slug", id)
    .single();

  if (error || !product) {
    console.error("PRODUCT DETAIL ERROR:", error);
    notFound();
  }

  const whatsappMessage = `Hello Dayal Kitchen Ware 👋

I am interested in:

${product.name}

Price: ₹${product.price}

Please share more details and availability.`;

  const whatsappLink = `https://wa.me/917011872380?text=${encodeURIComponent(
    whatsappMessage
  )}`;

  return (
    <main className="min-h-screen bg-[#faf9f6] text-zinc-900">

      {/* ================================================= */}
      {/* NAVBAR */}
      {/* ================================================= */}

      <header className="sticky top-0 z-50 border-b border-black/5 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">

          <a href="/" className="block">
            <h1 className="text-lg font-bold sm:text-xl">
              DAYAL KITCHEN WARE
            </h1>

            <p className="text-[9px] uppercase tracking-[0.25em] text-zinc-500 sm:text-[10px]">
              Kitchen • Home • Lifestyle
            </p>
          </a>

          <a
            href="/#products"
            className="rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-amber-700"
          >
            ← Back to Products
          </a>

        </div>
      </header>

      {/* ================================================= */}
      {/* PRODUCT */}
      {/* ================================================= */}

      <section className="mx-auto max-w-7xl px-6 py-12 lg:px-8 lg:py-24">

        <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">

          {/* ================================================= */}
          {/* PRODUCT GALLERY */}
          {/* ================================================= */}

          <ProductGallery
            name={product.name}
            image={product.image}
            images={product.images}
          />

          {/* ================================================= */}
          {/* PRODUCT DETAILS */}
          {/* ================================================= */}

          <div className="flex flex-col justify-center">

            {/* BADGE */}

            {product.badge && (
              <span className="mb-4 w-fit rounded-full bg-amber-100 px-4 py-2 text-xs font-bold uppercase tracking-wider text-amber-800">
                {product.badge}
              </span>
            )}

            {/* CATEGORY */}

            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-700">
              {product.category}
            </p>

            {/* NAME */}

            <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">
              {product.name}
            </h1>

            {/* PRICE */}

            <div className="mt-6 flex items-center gap-4">

              <span className="text-3xl font-bold">
                ₹{product.price}
              </span>

              {product.old_price &&
                Number(product.old_price) > Number(product.price) && (
                  <span className="text-lg text-zinc-400 line-through">
                    ₹{product.old_price}
                  </span>
                )}

            </div>

            {/* DESCRIPTION */}

            <div className="mt-8">

              <h2 className="text-lg font-bold">
                Product Description
              </h2>

              <p className="mt-3 whitespace-pre-line text-lg leading-8 text-zinc-600">
                {product.description}
              </p>

            </div>

            {/* ================================================= */}
            {/* ACTION BUTTONS */}
            {/* ================================================= */}

            <div className="mt-8 grid gap-3 sm:grid-cols-2">

              {/* ASK ON WHATSAPP */}

              <a
                href={whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full bg-green-600 px-6 py-4 text-center font-semibold text-white shadow-sm transition-all hover:bg-green-700 hover:shadow-lg"
              >
                Ask on WhatsApp
              </a>

              {/* ADD TO CART */}

              <AddToCartButton
                product={{
                  name: product.name,
                  slug: product.slug,
                  price: product.price,
                  image: product.image,
                }}
              />

            </div>

            {/* CONTINUE SHOPPING */}

            <a
              href="/#products"
              className="mt-4 block rounded-full border border-zinc-300 bg-white px-8 py-4 text-center font-semibold transition-all hover:border-zinc-900 hover:shadow-sm"
            >
              Continue Shopping
            </a>

          </div>

        </div>

      </section>

    </main>
  );
}