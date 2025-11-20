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
        // Base
        background: "#FFFFFF",
        foreground: "#1a1d1b",
        
        // Card surfaces
        card: {
          DEFAULT: "#f4f7f5",
          foreground: "#1a1d1b",
        },
        
        // Primary (Military Green)
        primary: {
          DEFAULT: "#3A443E",
          dark: "#2a3329",
          light: "#4a544e",
          lighter: "#5a645e",
          tint: "#e8ebe9",
          foreground: "#FFFFFF",
        },
        
        // Accent (Orange)
        accent: {
          DEFAULT: "#FF6F12",
          dark: "#e05500",
          light: "#ff8534",
          lighter: "#ffb380",
          tint: "#fff3eb",
          foreground: "#FFFFFF",
        },
        
        // Neutrals (Warm grays)
        muted: {
          DEFAULT: "#f4f7f5",
          foreground: "#6b716f",
        },
        
        // Semantic
        success: "#10b981",
        warning: "#FF6F12",
        destructive: {
          DEFAULT: "#ef4444",
          foreground: "#FFFFFF",
        },
        
        // Borders & Inputs
        border: "#e8ebe9",
        input: "#d1d5d3",
        ring: "#FF6F12",
        
        // Grays
        gray: {
          100: "#f4f7f5",
          200: "#e8ebe9",
          300: "#d1d5d3",
          400: "#9ca09e",
          500: "#6b716f",
          900: "#1a1d1b",
        },
      },
      borderRadius: {
        lg: "0.5rem",
        md: "0.375rem",
        sm: "0.25rem",
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Menlo', 'Monaco', 'Courier New', 'monospace'],
      },
      letterSpacing: {
        tight: '-0.015em',
        normal: '0',
        wide: '0.025em',
        wider: '0.05em',
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
