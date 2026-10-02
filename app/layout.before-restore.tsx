import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Footer from "./components/Footer";
import { LanguageProvider } from "./lib/i18n/LanguageProvider";

import "./globals.css";

import { CartProvider } from "./context/CartContext";
import FloatingWhatsApp from "./components/FloatingWhatsapp";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

/* =========================================================
   VIEWPORT
   ========================================================= */

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  themeColor: "#faf9f6",
  colorScheme: "light",
};

/* =========================================================
   METADATA
   ========================================================= */

export const metadata: Metadata = {
  metadataBase: new URL(
    "https://dayal-kitchen-ware.vercel.app"
  ),

  title: {
    default: "Dayal Kitchen Ware | Kitchenware & Home Essentials",
    template: "%s | Dayal Kitchen Ware",
  },

  description:
    "Shop quality kitchenware, cookware, kitchen essentials and home products from Dayal Kitchen Ware.",

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
    google:
      "GSbo3tRpLpp6M0kG2iRNJixeeON3WYASksL9UbzReww",
  },

  openGraph: {
    type: "website",
    url: "https://dayal-kitchen-ware.vercel.app",
    title: "Dayal Kitchen Ware | Kitchenware & Home Essentials",
    description:
      "Shop quality kitchenware, cookware, kitchen essentials and home products from Dayal Kitchen Ware.",
    siteName: "Dayal Kitchen Ware",
    locale: "en_IN",
  },

  twitter: {
    card: "summary_large_image",
    title: "Dayal Kitchen Ware | Kitchenware & Home Essentials",
    description:
      "Shop quality kitchenware, cookware, kitchen essentials and home products from Dayal Kitchen Ware.",
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

/* =========================================================
   ROOT LAYOUT
   ========================================================= */

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
        {/* =====================================================
            ORGANIZATION SCHEMA
        ===================================================== */}

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "Dayal Kitchen Ware",
              url: "https://dayal-kitchen-ware.vercel.app",
              email: "kitchenware821@gmail.com",
              description: "Quality kitchenware for every home.",
            }),
          }}
        />

        {/* =====================================================
            STORE SCHEMA
        ===================================================== */}

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Store",
              name: "Dayal Kitchen Ware",
              url: "https://dayal-kitchen-ware.vercel.app",
              email: "kitchenware821@gmail.com",
              description:
                "Kitchenware, cookware and home lifestyle products.",
              priceRange: "₹₹",
            }),
          }}
        />

    <CartProvider>
  <LanguageProvider>
  {children}
</LanguageProvider>

  <Footer />

  <FloatingWhatsApp />
</CartProvider>
      </body>
    </html>
  );
}