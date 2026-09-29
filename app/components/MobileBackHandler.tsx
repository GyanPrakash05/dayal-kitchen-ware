"use client";

import { App } from "@capacitor/app";
import { useRouter } from "next/navigation";
import { useEffect } from "react";


export default function MobileBackHandler() {
  const router = useRouter();

  useEffect(() => {
    let listener: { remove: () => Promise<void> } | null = null;

    const setup = async () => {
      listener = await App.addListener("backButton", () => {
        router.push("/#products");
      });
    };

    setup();

    return () => {
      listener?.remove();
    };
  }, [router]);

  return null;
}