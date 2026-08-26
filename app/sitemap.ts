import type { MetadataRoute } from "next";
import { supabase } from "./lib/supabase";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://dayal-kitchen-ware.vercel.app";

  const { data: products } = await supabase
    .from("products")
    .select("id, created_at");

  const productUrls =
    products?.map((product) => ({
      url: `${baseUrl}/products/${product.id}`,
      lastModified: product.created_at
        ? new Date(product.created_at)
        : new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })) || [];

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${baseUrl}/login`,
      changeFrequency: "monthly",
      priority: 0.3,
    },
    {
      url: `${baseUrl}/register`,
      changeFrequency: "monthly",
      priority: 0.3,
    },
    {
      url: `${baseUrl}/cart`,
      changeFrequency: "weekly",
      priority: 0.4,
    },
    ...productUrls,
  ];
}