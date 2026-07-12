import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "../../packages/ui/src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Sample theme: mint actions + charcoal structure (no blue)
        brand: {
          50: "#e8faf3",
          100: "#c6f1df",
          200: "#92e4c2",
          300: "#54d3a0",
          400: "#22c08a",
          500: "#10b981",
          600: "#0d9b6c",
          700: "#0b7c57",
          800: "#0a6246",
          900: "#084f3a",
        },
        charcoal: {
          DEFAULT: "#121a21",
          soft: "#1c252e",
          muted: "#2a3440",
          faint: "#3d4854",
        },
        ink: {
          DEFAULT: "#111827",
          soft: "#374151",
          muted: "#6b7280",
          faint: "#9ca3af",
        },
        line: {
          DEFAULT: "#e5e7eb",
          soft: "#f3f4f6",
        },
        surface: {
          DEFAULT: "#ffffff",
          soft: "#f9fafb",
          dark: "#121a21",
        },
        muted: "#f9fafb",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "Segoe UI", "system-ui", "sans-serif"],
      },
      borderRadius: {
        xl: "12px",
        "2xl": "16px",
      },
      boxShadow: {
        panel: "0 24px 48px -16px rgba(18, 26, 33, 0.55)",
      },
    },
  },
  plugins: [],
};

export default config;
