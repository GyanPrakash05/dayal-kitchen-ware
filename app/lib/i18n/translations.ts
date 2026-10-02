export type Language = "en" | "hi" | "hinglish";

export const LANGUAGE_STORAGE_KEY = "dayal_language";

export const LANGUAGE_OPTIONS: {
  code: Language;
  label: string;
  shortLabel: string;
}[] = [
  {
    code: "en",
    label: "English",
    shortLabel: "EN",
  },
  {
    code: "hi",
    label: "हिन्दी",
    shortLabel: "HI",
  },
  {
    code: "hinglish",
    label: "Hinglish",
    shortLabel: "HG",
  },
];

export const translations = {
  en: {
    nav: {
      home: "Home",
      products: "Products",
      cart: "Cart",
      account: "Account",
      login: "Login",
      about: "About",
      contact: "Contact",
      whatsapp: "WhatsApp Us",
    },

    common: {
      search: "Search",
      addToCart: "Add to Cart",
      buyNow: "Buy Now",
      viewAll: "View All",
      continue: "Continue",
      back: "Back",
      save: "Save",
      cancel: "Cancel",
      clear: "Clear",
      loading: "Loading...",
      yes: "Yes",
      no: "No",
    },

    home: {
      shopNow: "Shop Now",
      exploreProducts: "Explore Products",
      featuredProducts: "Featured Products",
      categories: "Categories",
      whyUs: "Why Choose Us?",
      howToOrder: "How to Order",
      location: "Your Location",
      aboutUs: "About Us",
      contactUs: "Contact Us",
    },

    product: {
      productDetails: "Product Details",
      price: "Price",
      quantity: "Quantity",
      available: "Available",
      unavailable: "Currently unavailable",
      description: "Description",
      reviews: "Reviews",
      delivery: "Delivery",
      deliveryAvailable: "Delivery available",
      checkDelivery: "Check delivery availability",
    },

    cart: {
      title: "Your Cart",
      empty: "Your cart is empty.",
      subtotal: "Subtotal",
      total: "Total",
      checkout: "Proceed to Checkout",
    },

    checkout: {
      title: "Checkout",
      deliveryDetails: "Delivery Details",
      placeOrder: "Place Order",
      orderPlaced: "Order placed successfully.",
    },

    location: {
      setLocation: "Set your location",
      detect: "Detect",
      detecting: "Detecting your location...",
      usePincode: "Use your pincode instead",
      enterPincode: "Enter pincode",
      savePincode: "Save",
      locationDetected: "Location detected",
      updateLocation: "Update location",
      clearLocation: "Clear saved location",
      deliveryAvailable: "Delivery available",
      outsideArea: "Outside current delivery area",
    },

    footer: {
      quickLinks: "Quick Links",
      customerSupport: "Customer Support",
      followUs: "Follow Us",
      allRightsReserved: "All rights reserved.",
    },
  },

  hi: {
    nav: {
      home: "होम",
      products: "प्रोडक्ट्स",
      cart: "कार्ट",
      account: "अकाउंट",
      login: "लॉगिन",
      about: "हमारे बारे में",
      contact: "संपर्क",
      whatsapp: "WhatsApp करें",
    },

    common: {
      search: "खोजें",
      addToCart: "कार्ट में डालें",
      buyNow: "अभी खरीदें",
      viewAll: "सभी देखें",
      continue: "जारी रखें",
      back: "वापस",
      save: "सेव करें",
      cancel: "रद्द करें",
      clear: "हटाएँ",
      loading: "लोड हो रहा है...",
      yes: "हाँ",
      no: "नहीं",
    },

    home: {
      shopNow: "अभी खरीदें",
      exploreProducts: "प्रोडक्ट्स देखें",
      featuredProducts: "खास प्रोडक्ट्स",
      categories: "कैटेगरी",
      whyUs: "हमें क्यों चुनें?",
      howToOrder: "ऑर्डर कैसे करें",
      location: "आपकी लोकेशन",
      aboutUs: "हमारे बारे में",
      contactUs: "संपर्क करें",
    },

    product: {
      productDetails: "प्रोडक्ट की जानकारी",
      price: "कीमत",
      quantity: "मात्रा",
      available: "उपलब्ध",
      unavailable: "अभी उपलब्ध नहीं है",
      description: "जानकारी",
      reviews: "रिव्यू",
      delivery: "डिलीवरी",
      deliveryAvailable: "डिलीवरी उपलब्ध है",
      checkDelivery: "डिलीवरी उपलब्धता देखें",
    },

    cart: {
      title: "आपकी कार्ट",
      empty: "आपकी कार्ट खाली है।",
      subtotal: "सबटोटल",
      total: "कुल",
      checkout: "चेकआउट करें",
    },

    checkout: {
      title: "चेकआउट",
      deliveryDetails: "डिलीवरी की जानकारी",
      placeOrder: "ऑर्डर करें",
      orderPlaced: "ऑर्डर सफलतापूर्वक हो गया।",
    },

    location: {
      setLocation: "अपनी लोकेशन सेट करें",
      detect: "पता लगाएँ",
      detecting: "लोकेशन पता की जा रही है...",
      usePincode: "पिनकोड का उपयोग करें",
      enterPincode: "पिनकोड डालें",
      savePincode: "सेव करें",
      locationDetected: "लोकेशन मिल गई",
      updateLocation: "लोकेशन अपडेट करें",
      clearLocation: "सेव की गई लोकेशन हटाएँ",
      deliveryAvailable: "डिलीवरी उपलब्ध है",
      outsideArea: "वर्तमान डिलीवरी क्षेत्र से बाहर",
    },

    footer: {
      quickLinks: "क्विक लिंक्स",
      customerSupport: "कस्टमर सपोर्ट",
      followUs: "हमें फॉलो करें",
      allRightsReserved: "सर्वाधिकार सुरक्षित।",
    },
  },

  hinglish: {
    nav: {
      home: "Home",
      products: "Products",
      cart: "Cart",
      account: "Account",
      login: "Login",
      about: "About",
      contact: "Contact",
      whatsapp: "WhatsApp Us",
    },

    common: {
      search: "Search karo",
      addToCart: "Cart mein add karo",
      buyNow: "Abhi Buy karo",
      viewAll: "Sab dekho",
      continue: "Continue karo",
      back: "Back",
      save: "Save karo",
      cancel: "Cancel karo",
      clear: "Clear karo",
      loading: "Load ho raha hai...",
      yes: "Haan",
      no: "Nahi",
    },

    home: {
      shopNow: "Abhi Shop karo",
      exploreProducts: "Products dekho",
      featuredProducts: "Featured Products",
      categories: "Categories",
      whyUs: "Humein kyun choose karein?",
      howToOrder: "Order kaise karein",
      location: "Aapki Location",
      aboutUs: "Hamare baare mein",
      contactUs: "Contact karein",
    },

    product: {
      productDetails: "Product Details",
      price: "Price",
      quantity: "Quantity",
      available: "Available hai",
      unavailable: "Abhi available nahi hai",
      description: "Description",
      reviews: "Reviews",
      delivery: "Delivery",
      deliveryAvailable: "Delivery available hai",
      checkDelivery: "Delivery availability check karein",
    },

    cart: {
      title: "Aapki Cart",
      empty: "Aapki cart empty hai.",
      subtotal: "Subtotal",
      total: "Total",
      checkout: "Checkout karein",
    },

    checkout: {
      title: "Checkout",
      deliveryDetails: "Delivery Details",
      placeOrder: "Order Place karein",
      orderPlaced: "Order successfully place ho gaya.",
    },

    location: {
      setLocation: "Apni location set karein",
      detect: "Detect",
      detecting: "Aapki location detect ho rahi hai...",
      usePincode: "Pincode se location set karein",
      enterPincode: "Pincode enter karein",
      savePincode: "Save karein",
      locationDetected: "Location detect ho gayi",
      updateLocation: "Location update karein",
      clearLocation: "Saved location clear karein",
      deliveryAvailable: "Delivery available hai",
      outsideArea: "Current delivery area se bahar hai",
    },

    footer: {
      quickLinks: "Quick Links",
      customerSupport: "Customer Support",
      followUs: "Follow Us",
      allRightsReserved: "All rights reserved.",
    },
  },
} as const;

export type TranslationDictionary =
  (typeof translations)[Language];