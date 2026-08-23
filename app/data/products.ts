export type Product = {
  name: string;
  slug: string;
  category: string;
  price: string;
  oldPrice: string;
  badge: string;
  image: string;
  description: string;
};

export const products: Product[] = [
  {
    name: "Premium Cookware Set",
    slug: "premium-cookware-set",
    category: "Cookware",
    price: "₹1,499",
    oldPrice: "₹1,999",
    badge: "BEST SELLER",
    image: "/products/premium-cookware-set.jpg",
    description:
      "Premium quality cookware designed for everyday cooking and modern kitchens.",
  },

  {
    name: "Elegant Dinner Set",
    slug: "elegant-dinner-set",
    category: "Dinner Sets",
    price: "₹2,299",
    oldPrice: "₹2,999",
    badge: "POPULAR",
    image: "/products/elegant-dinner-set.jpg",
    description:
      "Elegant dinner set perfect for everyday meals, family gatherings and special occasions.",
  },

  {
    name: "Kitchen Essentials Set",
    slug: "kitchen-essentials-set",
    category: "Kitchen Tools",
    price: "₹699",
    oldPrice: "₹999",
    badge: "NEW",
    image: "/products/kitchen-essentials-set.jpg",
    description:
      "Useful kitchen tools designed to make everyday cooking easier and more convenient.",
  },
];