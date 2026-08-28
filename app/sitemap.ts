import type { MetadataRoute } from "next";
import { supabase } from "./lib/supabase";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://dayal-kitchen-ware.vercel.app";

  const { data: products, error } = await supabase
    .from("products")
    .select("slug, created_at");

  if (error) {
    console.error("SITEMAP PRODUCT ERROR:", error);
  }

  const productUrls: MetadataRoute.Sitemap =
    products
      ?.filter((product) => product.slug)
      .map((product) => ({
        url: `${baseUrl}/products/${product.slug}`,
        lastModified: product.created_at
          ? new Date(product.created_at)
          : new Date(),
        changeFrequency: "weekly",
        priority: 0.8,
      })) ?? [];

  return [
    // Homepage
    {
      url: `${baseUrl}/`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },

    // Product pages
    ...productUrls,
  ];
}