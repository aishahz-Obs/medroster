import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  "#eff4ff",
          100: "#dce8ff",
          200: "#b9d0ff",
          300: "#85aeff",
          400: "#4f82e0",
          500: "#2a5bb7",
          600: "#1e449a",
          700: "#17347d",
          800: "#122665",
          900: "#0f1c51",
        },
        teal: {
          50:  "#ecfdf5",
          100: "#d4f4ea",
          500: "#0e9e78",
          600: "#0a8064",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
