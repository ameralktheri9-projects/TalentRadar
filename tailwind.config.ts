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
        // shadcn/ui tokens
        border:      "hsl(var(--border))",
        input:       "hsl(var(--input))",
        ring:        "hsl(var(--ring))",
        background:  "hsl(var(--background))",
        foreground:  "hsl(var(--foreground))",
        primary: {
          DEFAULT:    "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT:    "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT:    "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT:    "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT:    "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        card: {
          DEFAULT:    "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // TalentRadar brand tokens
        brand: {
          "deep-space":  "#0A0E27",
          "midnight":    "#1A1040",
          "teal":        "#00FFD1",
          "purple":      "#7B61FF",
          "teal-600":    "#00A88A",
          "teal-700":    "#008A72",
          "teal-50":     "#E6FAF7",
          "teal-100":    "#C0F5EC",
          "purple-600":  "#6B4FE0",
          "purple-50":   "#EDE9FD",
          "purple-100":  "#D4CCFB",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        sans:    ["Inter", "Noto Sans Arabic", "Cairo", "Arial", "sans-serif"],
        display: ["Inter", "Arial Black", "sans-serif"],
        arabic:  ["Noto Sans Arabic", "Cairo", "sans-serif"],
      },
      backgroundImage: {
        "brand-gradient":          "linear-gradient(90deg, #00FFD1 0%, #7B61FF 100%)",
        "brand-gradient-diagonal": "linear-gradient(135deg, #00FFD1 0%, #7B61FF 100%)",
        "sidebar-gradient":        "linear-gradient(180deg, #0A0E27 0%, #1A1040 100%)",
      },
      boxShadow: {
        "teal-glow":   "0 0 20px rgba(0, 255, 209, 0.25)",
        "purple-glow": "0 0 20px rgba(123, 97, 255, 0.25)",
      },
    },
  },
  plugins: [],
};

export default config;
