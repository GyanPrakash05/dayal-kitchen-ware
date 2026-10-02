"use client";

import { useEffect, useState } from "react";

export default function AppDownloadButton() {
  const [isAndroidApp, setIsAndroidApp] = useState(false);

  useEffect(() => {
    const userAgent = navigator.userAgent || "";
    const isCapacitorApp =
      userAgent.includes("Capacitor") ||
      userAgent.includes("wv") ||
      userAgent.includes("; wv)");

    setIsAndroidApp(isCapacitorApp);
  }, []);

  if (isAndroidApp) {
    return (
      <a
        href="#products"
        className="inline-flex items-center justify-center gap-2 rounded-full bg-amber-600 px-7 py-3.5 text-sm font-semibold text-white shadow-lg transition-all hover:-translate-y-0.5 hover:bg-amber-500 hover:shadow-xl"
      >
        <span aria-hidden="true">🛍️</span>
        Continue Shopping
      </a>
    );
  }

  return (
    <a
      href="/downloads/dayal-kitchen-ware.apk"
      download="dayal-kitchen-ware.apk"
      className="inline-flex items-center justify-center gap-2 rounded-full bg-amber-600 px-7 py-3.5 text-sm font-semibold text-white shadow-lg transition-all hover:-translate-y-0.5 hover:bg-amber-500 hover:shadow-xl"
    >
      <span aria-hidden="true">↓</span>
      Download Android App
    </a>
  );
}