export const APP_BASE_URL =
  process.env.NEXT_PUBLIC_APP_URL || "https://bingo25game.vercel.app";

export const FIREBASE_CONFIG = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || ""
};

export const PLAYER_COLORS = [
  {
    name: "Blue",
    primary: "#2563EB",
    bg: "#EFF6FF",
    border: "#3B82F6",
    softTint: "rgba(37, 99, 235, 0.12)",
    text: "#1D4ED8",
    badge: "bg-blue-600 text-white"
  },
  {
    name: "Pink",
    primary: "#EC4899",
    bg: "#FDF2F8",
    border: "#F472B6",
    softTint: "rgba(236, 72, 153, 0.12)",
    text: "#BE185D",
    badge: "bg-pink-600 text-white"
  },
  {
    name: "Green",
    primary: "#059669",
    bg: "#ECFDF5",
    border: "#10B981",
    softTint: "rgba(5, 150, 105, 0.12)",
    text: "#047857",
    badge: "bg-emerald-600 text-white"
  },
  {
    name: "Amber",
    primary: "#D97706",
    bg: "#FFFBEB",
    border: "#F59E0B",
    softTint: "rgba(217, 119, 6, 0.12)",
    text: "#B45309",
    badge: "bg-amber-600 text-white"
  },
  {
    name: "Purple",
    primary: "#7C3AED",
    bg: "#F5F3FF",
    border: "#8B5CF6",
    softTint: "rgba(124, 58, 237, 0.12)",
    text: "#6D28D9",
    badge: "bg-purple-600 text-white"
  },
  {
    name: "Red",
    primary: "#DC2626",
    bg: "#FEF2F2",
    border: "#EF4444",
    softTint: "rgba(220, 38, 38, 0.12)",
    text: "#B91C1C",
    badge: "bg-rose-600 text-white"
  }
];

export const POINT_TABLE: Record<number, number[]> = {
  2: [10, 0],
  3: [15, 9, 0],
  4: [20, 14, 9, 0],
  5: [25, 18, 14, 9, 0],
  6: [30, 22, 17, 12, 8, 4, 0]
};

export const MOVE_TIME_LIMIT_SECONDS = 20;
export const SETUP_TIME_LIMIT_SECONDS = 60;
