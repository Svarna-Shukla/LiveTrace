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
        canvas: "#F1F5F9",
        panel: "#FFFFFF",
        border: "#E2E8F0",
      },
      keyframes: {
        "dash-flow": {
          to: { strokeDashoffset: "-24" },
        },
        "pulse-ring": {
          "0%": { transform: "scale(0.6)", opacity: "0.9" },
          "100%": { transform: "scale(2.2)", opacity: "0" },
        },
        "fade-in-up": {
          "0%": { opacity: "0", transform: "translateY(4px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "dash-flow": "dash-flow 0.6s linear infinite",
        "pulse-ring": "pulse-ring 1.2s ease-out infinite",
        "fade-in-up": "fade-in-up 0.2s ease-out",
      },
    },
  },
  plugins: [],
};
export default config;
