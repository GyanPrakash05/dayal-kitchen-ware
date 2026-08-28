import { notFound } from "next/navigation";
import { supabase } from "@/app/lib/supabase";
import type { Metadata } from "next";

import ProductGallery from "@/app/components/ProductGallery";
import AddToCartButton from "@/app/components/AddToCartButton";

export const revalidate = 3600;

type ProductPageProps = {
  params: Promise<{
    id: string;
  }>;
};

/* =========================================================
   STATIC PRODUCT PATHS
========================================================= */

export async function generateStaticParams() {
  const { data: products, error } = await supabase
    .from("products")
    .select("slug");

  if (error) {
    console.error("STATIC PRODUCT PATH ERROR:", error);
    return [];
  }

  return (
    products?.map((product) => ({
      id: product.slug,
    })) || []
  );
}

/* =========================================================
   SEO METADATA
========================================================= */

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { id } = await params;

  const { data: product, error } = await supabase
    .from("products")
    .select(
      "name, description, image, price, category, slug, brand"
    )
    .eq("slug", id)
    .single();

  if (error || !product) {
    return {
      title: "Product Not Found | Dayal Kitchen Ware",

      description:
        "The requested product could not be found.",

      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const baseUrl =
    "https://dayal-kitchen-ware.vercel.app";

  const productUrl =
    `${baseUrl}/products/${product.slug}`;

  const description =
    product.description?.slice(0, 160) ||
    `Buy ${product.name} from Dayal Kitchen Ware. Quality kitchenware and home products.`;

  return {
    title: `${product.name} | Dayal Kitchen Ware`,

    description,

    keywords: [
      product.name,
      product.category,
      "Dayal Kitchen Ware",
      "kitchenware",
      "kitchen products",
      "kitchen essentials",
      "cookware",
      "pressure cooker",
      "kitchen utensils",
    ].filter(Boolean),

    alternates: {
      canonical: productUrl,
    },

    openGraph: {
      title: `${product.name} | Dayal Kitchen Ware`,

      description,

      url: productUrl,

      siteName: "Dayal Kitchen Ware",

      type: "website",

      locale: "en_IN",

      images: product.image
        ? [
            {
              url: product.image,
              alt: product.name,
            },
          ]
        : [],
    },

    twitter: {
      card: "summary_large_image",

      title: `${product.name} | Dayal Kitchen Ware`,

      description,

      images: product.image
        ? [product.image]
        : [],
    },

    robots: {
      index: true,
      follow: true,

      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
        "max-video-preview": -1,
      },
    },
  };
}

/* =========================================================
   PRODUCT SCHEMA
========================================================= */

function ProductSchema({
  product,
}: {
  product: any;
}) {
  const baseUrl =
    "https://dayal-kitchen-ware.vercel.app";

  const productUrl =
    `${baseUrl}/products/${product.slug}`;

  const schema = {
    "@context": "https://schema.org",

    "@type": "Product",

    name: product.name,

    category: product.category || undefined,

    description:
      product.description ||
      `Buy ${product.name} from Dayal Kitchen Ware.`,

    image: product.image
      ? [product.image]
      : [],

    url: productUrl,

    ...(product.brand
      ? {
          brand: {
            "@type": "Brand",
            name: product.brand,
          },
        }
      : {}),

    offers: {
      "@type": "Offer",

      url: productUrl,

      priceCurrency: "INR",

      price: Number(product.price),

      availability:
        "https://schema.org/InStock",

      itemCondition:
        "https://schema.org/NewCondition",

      seller: {
        "@type": "Organization",

        name: "Dayal Kitchen Ware",

        url: baseUrl,
      },
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(schema),
      }}
    />
  );
}

/* =========================================================
   BREADCRUMB SCHEMA
========================================================= */

function BreadcrumbSchema({
  product,
}: {
  product: any;
}) {
  const baseUrl =
    "https://dayal-kitchen-ware.vercel.app";

  const productUrl =
    `${baseUrl}/products/${product.slug}`;

  const schema = {
    "@context": "https://schema.org",

    "@type": "BreadcrumbList",

    itemListElement: [
      {
        "@type": "ListItem",

        position: 1,

        name: "Home",

        item: `${baseUrl}/`,
      },

      {
        "@type": "ListItem",

        position: 2,

        name: "Products",

        item: `${baseUrl}/#products`,
      },

      {
        "@type": "ListItem",

        position: 3,

        name: product.name,

        item: productUrl,
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(schema),
      }}
    />
  );
}

/* =========================================================
   PRODUCT PAGE
========================================================= */

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
    console.error(
      "PRODUCT DETAIL ERROR:",
      error
    );

    notFound();
  }

  /* =======================================================
     SAFE VALUES FOR COMPONENTS
  ======================================================= */

  const productImage =
    product.image ?? null;

  const productImages =
    product.images ?? null;

  const productPrice =
    Number(product.price);

  const productName =
    product.name ?? "Product";

  const productSlug =
    product.slug ?? id;

  /* =======================================================
     WHATSAPP
  ======================================================= */

  const whatsappMessage = `Hello Dayal Kitchen Ware 👋

I am interested in:

${productName}

Price: ₹${productPrice}

Please share more details and availability.`;

  const whatsappLink =
    `https://wa.me/917011872380?text=${encodeURIComponent(
      whatsappMessage
    )}`;

  /* =======================================================
     PAGE
  ======================================================= */

  return (
    <main className="min-h-screen bg-[#faf9f6] text-zinc-900">

      {/* =====================================================
          STRUCTURED DATA
      ===================================================== */}

      <ProductSchema product={product} />

      <BreadcrumbSchema product={product} />

      {/* =====================================================
          NAVBAR
      ===================================================== */}

      <header className="sticky top-0 z-50 border-b border-black/5 bg-white/95 backdrop-blur">

        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">

          {/* LOGO */}

          <a
            href="/"
            className="block"
          >

            <h1 className="text-lg font-bold sm:text-xl">
              DAYAL KITCHEN WARE
            </h1>

            <p className="text-[9px] uppercase tracking-[0.25em] text-zinc-500 sm:text-[10px]">
              Kitchen • Home • Lifestyle
            </p>

          </a>

          {/* BACK BUTTON */}

          <a
            href="/#products"
            className="rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-amber-700"
          >
            ← Back to Products
          </a>

        </div>

      </header>

      {/* =====================================================
          PRODUCT SECTION
      ===================================================== */}

      <section className="mx-auto max-w-7xl px-6 py-12 lg:px-8 lg:py-24">

        <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">

          {/* =================================================
              PRODUCT GALLERY
          ================================================= */}

          <ProductGallery
            name={productName}
            image={productImage}
            images={productImages}
          />

          {/* =================================================
              PRODUCT DETAILS
          ================================================= */}

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

            {/* PRODUCT NAME */}

            <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">
              {productName}
            </h1>

            {/* PRICE */}

            <div className="mt-6 flex items-center gap-4">

              <span className="text-3xl font-bold">
                ₹{productPrice}
              </span>

              {product.old_price !== null &&
                product.old_price !== undefined &&
                Number(product.old_price) >
                  productPrice && (

                <span className="text-lg text-zinc-400 line-through">
                  ₹{Number(product.old_price)}
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

            {/* =================================================
                ACTION BUTTONS
            ================================================= */}

            <div className="mt-8 grid gap-3 sm:grid-cols-2">

              {/* WHATSAPP */}

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
                  name: productName,
                  slug: productSlug,
                  price: productPrice,
                  image: productImage,
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