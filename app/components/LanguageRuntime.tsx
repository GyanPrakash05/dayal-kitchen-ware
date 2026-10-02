"use client";

import { useEffect } from "react";
import { useLanguage } from "@/app/lib/i18n/LanguageProvider";

const translations = {
  en: {
    Home: "Home",
    Categories: "Categories",
    Products: "Products",
    "Why Us": "Why Us",
    "Why Choose Us": "Why Choose Us",
    About: "About",
    "Visit Store": "Visit Store",
    "Search products...": "Search products...",
    Search: "Search",
    Go: "Go",
    "WhatsApp Us": "WhatsApp Us",

    "Shop Now": "Shop Now",
    "Explore Products": "Explore Products",
    "Featured Products": "Featured Products",
    "Why Choose Us?": "Why Choose Us?",
    "How to Order": "How to Order",
    "Your Location": "Your Location",
    "About Us": "About Us",
    "Contact Us": "Contact Us",

    "Add to Cart": "Add to Cart",
    "Buy Now": "Buy Now",
    "View All": "View All",
    "View All Products": "View All Products",
    "Currently unavailable": "Currently unavailable",

    "Your Cart": "Your Cart",
    "Proceed to Checkout": "Proceed to Checkout",
    Checkout: "Checkout",
    "Place Order": "Place Order",

    "Quick Links": "Quick Links",
    "Customer Support": "Customer Support",
    "Follow Us": "Follow Us",
    "All rights reserved.": "All rights reserved.",
  },

  hi: {
    Home: "होम",
    Categories: "कैटेगरी",
    Products: "प्रोडक्ट्स",
    "Why Us": "हमें क्यों चुनें",
    "Why Choose Us": "हमें क्यों चुनें",
    About: "हमारे बारे में",
    "Visit Store": "स्टोर पर आएँ",
    "Search products...": "प्रोडक्ट्स खोजें...",
    Search: "खोजें",
    Go: "जाएँ",
    "WhatsApp Us": "WhatsApp करें",

    "Shop Now": "अभी खरीदें",
    "Explore Products": "प्रोडक्ट्स देखें",
    "Featured Products": "खास प्रोडक्ट्स",
    "Why Choose Us?": "हमें क्यों चुनें?",
    "How to Order": "ऑर्डर कैसे करें",
    "Your Location": "आपकी लोकेशन",
    "About Us": "हमारे बारे में",
    "Contact Us": "संपर्क करें",

    "Add to Cart": "कार्ट में डालें",
    "Buy Now": "अभी खरीदें",
    "View All": "सभी देखें",
    "View All Products": "सभी प्रोडक्ट्स देखें",
    "Currently unavailable": "अभी उपलब्ध नहीं है",

    "Your Cart": "आपकी कार्ट",
    "Proceed to Checkout": "चेकआउट करें",
    Checkout: "चेकआउट",
    "Place Order": "ऑर्डर करें",

    "Quick Links": "क्विक लिंक्स",
    "Customer Support": "कस्टमर सपोर्ट",
    "Follow Us": "हमें फॉलो करें",
    "All rights reserved.": "सर्वाधिकार सुरक्षित।",
  },

  hinglish: {
    Home: "Home",
    Categories: "Categories",
    Products: "Products",
    "Why Us": "Humein kyun choose karein",
    "Why Choose Us": "Humein kyun choose karein",
    About: "Hamare baare mein",
    "Visit Store": "Store visit karein",
    "Search products...": "Products search karo...",
    Search: "Search karo",
    Go: "Go",
    "WhatsApp Us": "WhatsApp Us",

    "Shop Now": "Abhi Shop karo",
    "Explore Products": "Products dekho",
    "Featured Products": "Featured Products",
    "Why Choose Us?": "Humein kyun choose karein?",
    "How to Order": "Order kaise karein",
    "Your Location": "Aapki Location",
    "About Us": "Hamare baare mein",
    "Contact Us": "Contact karein",

    "Add to Cart": "Cart mein add karo",
    "Buy Now": "Abhi Buy karo",
    "View All": "Sab dekho",
    "View All Products": "Saare Products dekho",
    "Currently unavailable": "Abhi available nahi hai",

    "Your Cart": "Aapki Cart",
    "Proceed to Checkout": "Checkout karein",
    Checkout: "Checkout",
    "Place Order": "Order Place karein",

    "Quick Links": "Quick Links",
    "Customer Support": "Customer Support",
    "Follow Us": "Follow Us",
    "All rights reserved.": "All rights reserved.",
  },
} as const;

type SupportedLanguage = keyof typeof translations;

function translateText(text: string, language: SupportedLanguage) {
  const dictionary = translations[language];

  if (text in dictionary) {
    return dictionary[text as keyof typeof dictionary];
  }

  return null;
}

function translateNode(
  node: Node,
  language: SupportedLanguage
) {
  if (node.nodeType === Node.TEXT_NODE) {
    const original = node.textContent?.trim();

    if (!original) {
      return;
    }

    const translated = translateText(original, language);

    if (translated && node.textContent) {
      const leading = node.textContent.match(/^\s*/)?.[0] ?? "";
      const trailing = node.textContent.match(/\s*$/)?.[0] ?? "";

      node.textContent = `${leading}${translated}${trailing}`;
    }

    return;
  }

  if (node.nodeType !== Node.ELEMENT_NODE) {
    return;
  }

  const element = node as HTMLElement;

  if (
    element.tagName === "SCRIPT" ||
    element.tagName === "STYLE" ||
    element.tagName === "NOSCRIPT" ||
    element.tagName === "INPUT" ||
    element.tagName === "TEXTAREA"
  ) {
    return;
  }

  for (const child of Array.from(node.childNodes)) {
    translateNode(child, language);
  }
}

export default function LanguageRuntime() {
  const { language } = useLanguage();

  useEffect(() => {
    const root = document.body;

    if (!root) {
      return;
    }

    const applyTranslation = () => {
      translateNode(root, language);
    };

    applyTranslation();

    const observer = new MutationObserver(() => {
      applyTranslation();
    });

    observer.observe(root, {
      childList: true,
      subtree: true,
    });

    return () => {
      observer.disconnect();
    };
  }, [language]);

  return null;
}