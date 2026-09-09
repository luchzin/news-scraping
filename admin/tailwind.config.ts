import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: "#1e3a8a",
        brandred: "#dc2626",
        pagebg: "#f5f6fb",
      },
    },
  },
  plugins: [],
};

export default config;
