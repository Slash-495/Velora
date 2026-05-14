import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./features/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-inter)", "sans-serif"],
      },
      colors: {
        background: "#0F172A",
        surface: "#111827",
        card: "#1E293B",
        primary: {
          DEFAULT: "#7C3AED",
          glow: "#22D3EE",
        },
        secondary: "#38BDF8",
        text: {
          primary: "#F8FAFC",
          secondary: "#CBD5E1",
          muted: "#94A3B8",
        },
      },
      boxShadow: {
        'glow-primary': '0 0 20px -5px rgba(124, 58, 237, 0.4), 0 0 10px -2px rgba(124, 58, 237, 0.2)',
        'glow-accent': '0 0 20px -5px rgba(34, 211, 238, 0.4), 0 0 10px -2px rgba(34, 211, 238, 0.2)',
        'card-elevation': '0 10px 30px -10px rgba(0, 0, 0, 0.5), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
      },
      transitionTimingFunction: {
        'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.5s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};
export default config;
