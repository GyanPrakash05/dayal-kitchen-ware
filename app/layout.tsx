import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Footer from "./components/Footer";
import "./globals.css";

import { CartProvider } from "./context/CartContext";
import FloatingWhatsApp from "./components/FloatingWhatsapp";
import { LanguageProvider } from "./lib/i18n/LanguageProvider";
import LanguageRuntime from "./components/LanguageRuntime";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

/* VIEWPORT */

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  themeColor: "#faf9f6",
  colorScheme: "light",
};

/* METADATA */

export const metadata: Metadata = {
  metadataBase: new URL("https://dayal-kitchen-ware.vercel.app"),

  title: {
    default: "Dayal Kitchen Ware | Cookware & Kitchen Essentials",
    template: "%s | Dayal Kitchen Ware",
  },

  description:
    "Shop cookware, pressure cookers, kitchen utensils, bottles and home essentials at Dayal Kitchen Ware. Explore practical products for everyday cooking and living.",

  keywords: [
    "Dayal Kitchen Ware",
    "kitchenware",
    "kitchen utensils",
    "cookware",
    "kitchen essentials",
    "pressure cooker",
    "non stick cookware",
    "kitchen products",
  ],

  authors: [
    {
      name: "Dayal Kitchen Ware",
    },
  ],

  creator: "Dayal Kitchen Ware",
  publisher: "Dayal Kitchen Ware",

  alternates: {
    canonical: "https://dayal-kitchen-ware.vercel.app/",
  },

  verification: {
    google: "GSbo3tRpLpp6M0kG2iRNJixeeON3WYASksL9UbzReww",
  },

  openGraph: {
    type: "website",
    url: "https://dayal-kitchen-ware.vercel.app/",
    title: "Dayal Kitchen Ware | Cookware & Kitchen Essentials",
    description:
      "Shop cookware, pressure cookers, kitchen utensils, bottles and home essentials at Dayal Kitchen Ware. Explore practical products for everyday cooking and living.",
    siteName: "Dayal Kitchen Ware",
    locale: "en_IN",
  },

  twitter: {
    card: "summary_large_image",
    title: "Dayal Kitchen Ware | Cookware & Kitchen Essentials",
    description:
      "Shop cookware, pressure cookers, kitchen utensils, bottles and home essentials at Dayal Kitchen Ware. Explore practical products for everyday cooking and living.",
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

  icons: {
    icon: "/favicon.ico",
  },

  other: {
    "business-email": "kitchenware821@gmail.com",
  },
};

/* ROOT LAYOUT */

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} antialiased`}
    >
      <body className="min-h-screen w-full overflow-x-hidden bg-[#faf9f6] text-zinc-900">
        {/* ORGANIZATION SCHEMA */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "Dayal Kitchen Ware",
              url: "https://dayal-kitchen-ware.vercel.app/",
              email: "kitchenware821@gmail.com",
              description: "Quality kitchenware for every home.",
            }),
          }}
        />

        {/* STORE SCHEMA */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Store",
              name: "Dayal Kitchen Ware",
              url: "https://dayal-kitchen-ware.vercel.app/",
              email: "kitchenware821@gmail.com",
              description:
                "Kitchenware, cookware and home lifestyle products.",
              priceRange: "₹₹",
            }),
          }}
        />

        <LanguageProvider>
          <LanguageRuntime />

          <CartProvider>
            {children}
            <Footer />
            <FloatingWhatsApp />
          </CartProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}