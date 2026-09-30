import { notFound } from "next/navigation";
import { supabase } from "@/app/lib/supabase";
import type { Metadata } from "next";
import Link from "next/link";
import MobileBackHandler from "@/app/components/MobileBackHandler";
import ProductGallery from "@/app/components/ProductGallery";
import AddToCartButton from "@/app/components/AddToCartButton";

export const revalidate = 3600;

type ProductPageProps = {
  params: Promise<{
    id: string;
  }>;
};

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

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { id } = await params;

  const { data: product, error } = await supabase
    .from("products")
    .select("name, description, image, price, category, slug, brand")
    .eq("slug", id)
    .single();

  if (error || !product) {
    return {
      title: "Product Not Found | Dayal Kitchen Ware",
      description: "The requested product could not be found.",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const baseUrl = "https://dayal-kitchen-ware.vercel.app";
  const productUrl = `${baseUrl}/products/${product.slug}`;

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
      images: product.image ? [product.image] : [],
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

function ProductSchema({
  product,
}: {
  product: any;
}) {
  const baseUrl = "https://dayal-kitchen-ware.vercel.app";
  const productUrl = `${baseUrl}/products/${product.slug}`;

  const additionalProperties = [
    {
      name: "Material",
      value: product.material,
    },
    {
      name: "Size",
      value: product.size,
    },
    {
      name: "Capacity",
      value: product.capacity,
    },
    {
      name: "Colour",
      value: product.colour,
    },
    {
      name: "Warranty",
      value: product.warranty,
    },
    {
      name: "Model Number",
      value: product.model_number,
    },
  ]
    .filter(
      (item) =>
        typeof item.value === "string" &&
        item.value.trim().length > 0
    )
    .map((item) => ({
      "@type": "PropertyValue",
      name: item.name,
      value: item.value,
    }));

  const schema = {
    "@context": "https://schema.org",
    "@type": "Product",

    name: product.name,

    category: product.category || undefined,

    description:
      product.description ||
      `Buy ${product.name} from Dayal Kitchen Ware.`,

    image: product.image ? [product.image] : [],

    url: productUrl,

    ...(product.brand
      ? {
          brand: {
            "@type": "Brand",
            name: product.brand,
          },
        }
      : {}),

    ...(additionalProperties.length > 0
      ? {
          additionalProperty: additionalProperties,
        }
      : {}),

    offers: {
      "@type": "Offer",
      url: productUrl,
      priceCurrency: "INR",
      price: Number(product.price),

      availability: "https://schema.org/InStock",

      itemCondition: "https://schema.org/NewCondition",

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

function BreadcrumbSchema({
  product,
}: {
  product: any;
}) {
  const baseUrl = "https://dayal-kitchen-ware.vercel.app";
  const productUrl = `${baseUrl}/products/${product.slug}`;

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

  const productImage = product.image ?? null;

  const productImages = Array.isArray(product.images)
    ? product.images
    : null;

  const productPrice = Number(product.price);

  const productName = product.name ?? "Product";

  /*
   * Product specifications
   *
   * Empty/null values are automatically removed.
   */
  const productDetails = [
    {
      label: "Brand",
      value: product.brand,
    },
    {
      label: "Material",
      value: product.material,
    },
    {
      label: "Size",
      value: product.size,
    },
    {
      label: "Capacity",
      value: product.capacity,
    },
    {
      label: "Colour",
      value: product.colour,
    },
    {
      label: "Warranty",
      value: product.warranty,
    },
    {
      label: "Model Number",
      value: product.model_number,
    },
  ].filter(
    (item) =>
      typeof item.value === "string" &&
      item.value.trim().length > 0
  );

  const whatsappMessage = `Hello Dayal Kitchen Ware 👋

I am interested in:

${productName}

Price: ₹${productPrice}

Please share more details and availability.`;

  const whatsappLink = `https://wa.me/917011872380?text=${encodeURIComponent(
    whatsappMessage
  )}`;

  return (
    <main className="min-h-screen overflow-x-clip bg-[#faf9f6] text-zinc-900">

      <MobileBackHandler />

      <ProductSchema product={product} />

      <BreadcrumbSchema product={product} />

      {/* HEADER */}
      <header className="sticky top-0 z-50 border-b border-black/5 bg-white/95 backdrop-blur">

        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">

          <Link href="/" className="block min-w-0">

            <h1 className="text-base font-bold sm:text-xl">
              DAYAL KITCHEN WARE
            </h1>

            <p className="text-[8px] uppercase tracking-[0.2em] text-zinc-500 sm:text-[10px] sm:tracking-[0.25em]">
              Kitchen • Home • Lifestyle
            </p>

          </Link>

          <Link
            href="/#products"
            className="shrink-0 rounded-full bg-zinc-900 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-amber-700 sm:px-5 sm:text-sm"
          >
            ← Back to Products
          </Link>

        </div>

      </header>

      {/* PRODUCT */}
      <section className="w-full max-w-full overflow-x-clip px-4 py-8 sm:px-6 sm:py-12 lg:mx-auto lg:max-w-7xl lg:px-8 lg:py-24">

        <div className="grid w-full min-w-0 max-w-full gap-10 lg:grid-cols-2 lg:gap-16">

          {/* GALLERY */}
          <ProductGallery
            name={productName}
            image={productImage}
            images={productImages}
          />

          {/* PRODUCT INFORMATION */}
          <div className="flex min-w-0 flex-col justify-center">

            {/* BADGE */}
            {product.badge && (
              <span className="mb-4 w-fit rounded-full bg-amber-100 px-4 py-2 text-xs font-bold uppercase tracking-wider text-amber-800">
                {product.badge}
              </span>
            )}

            {/* CATEGORY */}
            {product.category && (
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-700">
                {product.category}
              </p>
            )}

            {/* NAME */}
            <h1 className="mt-4 break-words text-3xl font-bold tracking-tight sm:text-5xl">
              {productName}
            </h1>

            {/* PRICE */}
            <div className="mt-6 flex flex-wrap items-center gap-4">

              <span className="text-3xl font-bold">
                ₹{productPrice.toLocaleString("en-IN")}
              </span>

              {product.old_price !== null &&
                product.old_price !== undefined &&
                Number(product.old_price) > productPrice && (
                  <span className="text-lg text-zinc-400 line-through">
                    ₹{Number(product.old_price).toLocaleString("en-IN")}
                  </span>
                )}

            </div>

            {/* PRODUCT DETAILS */}
            {productDetails.length > 0 && (
              <div className="mt-8">

                <div className="mb-4">

                  <h2 className="text-xl font-bold tracking-tight">
                    Product Details
                  </h2>

                  <p className="mt-1 text-sm text-zinc-500">
                    Key specifications
                  </p>

                </div>

                <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white">

                  <div className="grid grid-cols-1 sm:grid-cols-2">

                    {productDetails.map((detail, index) => (
                      <div
                        key={detail.label}
                        className={`
                          flex min-w-0 items-center justify-between gap-4
                          px-4 py-4
                          sm:px-5
                          ${
                            index < productDetails.length - 1
                              ? "border-b border-zinc-100"
                              : ""
                          }
                          ${
                            productDetails.length > 1 &&
                            index % 2 === 0
                              ? "sm:border-r sm:border-zinc-100"
                              : ""
                          }
                        `}
                      >

                        <span className="shrink-0 text-sm font-medium text-zinc-500">
                          {detail.label}
                        </span>

                        <span className="min-w-0 break-words text-right text-sm font-semibold text-zinc-900">
                          {detail.value}
                        </span>

                      </div>
                    ))}

                  </div>

                </div>

              </div>
            )}

            {/* DESCRIPTION */}
            {product.description && (
              <div className="mt-8">

                <h2 className="text-lg font-bold">
                  Product Description
                </h2>

                <p className="mt-3 whitespace-pre-line break-words text-base leading-7 text-zinc-600 sm:text-lg sm:leading-8">
                  {product.description}
                </p>

              </div>
            )}

            {/* ACTIONS */}
            <div className="mt-8 grid gap-3 sm:grid-cols-2">

              <a
                href={whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full bg-green-600 px-6 py-4 text-center font-semibold text-white shadow-sm transition-all hover:bg-green-700 hover:shadow-lg"
              >
                Ask on WhatsApp
              </a>

              <AddToCartButton
                product={{
                  id: product.id,
                  name: product.name,
                  slug: product.slug,
                  price: Number(product.price),
                  image: product.image,
                }}
              />

            </div>

            {/* CONTINUE SHOPPING */}
            <Link
              href="/#products"
              className="mt-4 block rounded-full border border-zinc-300 bg-white px-8 py-4 text-center font-semibold transition-all hover:border-zinc-900 hover:shadow-sm"
            >
              Continue Shopping
            </Link>

          </div>

        </div>

      </section>

    </main>
  );
}