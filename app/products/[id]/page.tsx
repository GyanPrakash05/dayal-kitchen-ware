import Image from "next/image";
import AddToCartButton from "../../components/AddToCartButton";

const products = {
  "premium-cookware-set": {
    name: "Premium Cookware Set",
    category: "Cookware",
    price: "₹1,499",
    oldPrice: "₹1,999",
    image: "/products/premium-cookware-set.jpg",
  },

  "elegant-dinner-set": {
    name: "Elegant Dinner Set",
    category: "Dinner Sets",
    price: "₹2,299",
    oldPrice: "₹2,999",
    image: "/products/elegant-dinner-set.jpg",
  },

  "kitchen-essentials-set": {
    name: "Kitchen Essentials Set",
    category: "Kitchen Tools",
    price: "₹699",
    oldPrice: "₹999",
    image: "/products/kitchen-essentials-set.jpg",
  },
};

export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const product = products[id as keyof typeof products];

  if (!product) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#faf9f6]">
        <div className="text-center">
          <h1 className="text-4xl font-bold">
            Product Not Found
          </h1>

          <a
            href="/"
            className="mt-6 inline-block rounded-full bg-zinc-900 px-6 py-3 text-white"
          >
            ← Back to Home
          </a>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#faf9f6] p-6">

      <div className="mx-auto max-w-6xl">

        <a
          href="/"
          className="inline-block py-6 text-sm font-semibold hover:text-amber-700"
        >
          ← Back to Shop
        </a>

        <div className="grid gap-10 rounded-3xl bg-white p-8 shadow-sm md:grid-cols-2">

          {/* IMAGE */}

          <div className="flex min-h-[450px] items-center justify-center rounded-3xl bg-[#eee8dc]">

            <Image
              src={product.image}
              alt={product.name}
              width={600}
              height={600}
              className="max-h-[450px] w-full object-contain p-8"
              priority
            />

          </div>


          {/* PRODUCT DETAILS */}

          <div className="flex flex-col justify-center">

            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-700">
              {product.category}
            </p>

            <h1 className="mt-3 text-4xl font-bold">
              {product.name}
            </h1>

            <div className="mt-6 flex items-center gap-4">

              <span className="text-3xl font-bold">
                {product.price}
              </span>

              <span className="text-lg text-zinc-400 line-through">
                {product.oldPrice}
              </span>

            </div>

            <p className="mt-6 leading-7 text-zinc-600">
              Premium quality kitchenware designed for everyday
              cooking, serving and modern homes.
            </p>

           <AddToCartButton
  product={{
    name: product.name,
    slug: id,
    price: product.price,
    image: product.image,
  }}
/>
            <a
              href="/"
              className="mt-4 text-center text-sm font-semibold underline underline-offset-4"
            >
              Continue Shopping
            </a>

          </div>

        </div>

      </div>

    </main>
  );
}