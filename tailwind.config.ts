import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#FFFFFF",
        foreground: "#0e121b",
        card: {
          DEFAULT: "#F6F7F9",
          foreground: "#0e121b",
        },
        primary: {
          DEFAULT: "#3A443E",
          foreground: "#FFFFFF",
        },
        secondary: {
          DEFAULT: "#3A443E",
          foreground: "#FFFFFF",
        },
        accent: {
          DEFAULT: "#FF6F12",
          foreground: "#FFFFFF",
        },
        muted: {
          DEFAULT: "#E5E7EB",
          foreground: "#6b7280",
        },
        destructive: {
          DEFAULT: "#ef4444",
          foreground: "#FFFFFF",
        },
        border: "#E5E7EB",
        input: "#E5E7EB",
        ring: "#3A443E",
      },
      borderRadius: {
        lg: "0.5rem",
        md: "0.375rem",
        sm: "0.25rem",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;

