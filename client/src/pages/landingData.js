import { Brain, Palette, Pencil, Laptop, Shirt, Cherry } from "lucide-react";
import { featureStar, location, chat, verified } from "@/assets";

export const header = "Sa Polymart, lahat ng Isko may pwesto!";

export const description =
  "Polymart is a student-powered marketplace made for campus communities, where buyers and sellers connect with ease. Whether it’s pre-loved items, student services, or one-of-a-kind finds, Polymart offers a trusted space to discover, list, and transact. Built with students in mind, Polymart ensures convenient meet-ups, secure exchanges, and a platform that supports hustle, creativity, and connection—all in one place.";
export const goals = [
  {
    title: "A Student-Friendly Marketplace for PUPian-Owned Hustles",
    icon: featureStar,
  },
  {
    title: "Campus-Centric Meet-Ups for Convenience & Safety",
    icon: featureStar,
  },
  { title: "Exclusive to PUPians Only", icon: featureStar },
];

export const productInformation = [
  {
    title: "Academic Essentials",
    description:
      "Find affordable textbooks, reviewers, supplies, and everything else you need to survive (and thrive) through the academic grind. Perfect for students looking to save, share, or swap essentials.",
    icon: Brain,
  },
  {
    title: "Creative Works",
    description:
      "Showcase or support student creativity with handmade crafts, artworks, digital designs, music, and more. Ideal for artists, creators, and anyone who loves one-of-a-kind finds.",
    icon: Palette,
  },
  {
    title: "Services",
    description:
      "Offer or avail services like tutoring, layouting, printing, haircuts, photography, and more. If it’s a skill you can provide, or a task you need help with—this is your space.",
    icon: Pencil,
  },
  {
    title: "Tech & Gadgets",
    description:
      "Buy or sell pre-loved gadgets, accessories, or student-friendly tech. From headphones to hard drives, get what you need to stay connected and productive.",
    icon: Laptop,
  },
  {
    title: "Fashion",
    description:
      "Explore campus-friendly fashion pieces from thrifted gems to student-made styles. Buy, sell, or trade clothing, bags, shoes, and accessories with flair and purpose.",
    icon: Shirt,
  },
  {
    title: "At Kung Anik-Anik!",
    description:
      "Anything and everything else—stickers, collectibles, K-pop merch, dorm finds, mystery items, and more. This category is for all the quirky, fun, and unique listings!",
    icon: Cherry,
  },
];

export const features = [
  {
    icon: location,
    label: "Set a meet up",
    description:
      "Coordinate safe and convenient meet-ups within PUP using location pins and suggested common spots — no deliveries needed.",
  },
  {
    icon: chat,
    label: "Chat System",
    description:
      "Message buyers or sellers directly to ask questions, finalize details, and stay updated — all within the platform.",
  },
  {
    icon: verified,
    label: "Verified Users",
    description:
      "Only PUP-verified students can create listings or transact, ensuring a trusted and secure campus-exclusive marketplace.",
  },
];

export const faqslist = [
  {
    question: "What is PolyMart?",
    answer:
      "PolyMart is a campus-based e-commerce platform made exclusively for PUP Main students, where you can buy and sell products or services and coordinate meet-ups safely on campus.",
  },
  {
    question: "What can I sell on PolyMart?",
    answer:
      "You can sell a wide range of products, including textbooks, school supplies, and handmade crafts.",
  },
  {
    question: "What is not allowed on PolyMart?",
    answer:
      "Consumable items such as food and drinks are not allowed due to school regulations. This helps us ensure the safety and well-being of all students using the platform.",
  },
  {
    question: "Is there any payment system inside the app?",
    answer:
      "At the moment, Polymart does not support in-app payments. All transactions should be coordinated directly through the in-app chat between buyer and seller.",
  },
  {
    question: "What if I encounter a bogus buyer or seller?",
    answer:
      "Polymart has a reporting feature to flag bogus users. Once verified, these accounts will be marked and restricted from further transactions to protect the community.",
  },
  {
    question: "Do accounts expire when I graduate?",
    answer:
      "Yes. To maintain a secure student-only environment, Polymart requires users to upload a valid COR every academic year. This helps us ensure that only current PUP students can access the platform.",
  },
];
