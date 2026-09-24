/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // Screenshot palette
        primary: "#0B1623",
        "on-primary": "#ffffff",
        "primary-container": "#0B1623",
        secondary: "#00A8A8",
        "on-secondary": "#ffffff",
        "secondary-container": "#E6F7F7",
        "secondary-fixed": "#B2E8E8",
        tertiary: "#FF7A00",
        "on-tertiary": "#ffffff",
        "tertiary-container": "#FFF0E0",
        "on-tertiary-fixed": "#9A4A00",
        accent: "#C4A574",
        surface: "#F8F9FA",
        "on-surface": "#0B1623",
        "on-surface-variant": "#667085",
        "surface-container": "#EEF2F6",
        "surface-container-low": "#F1F3F5",
        "surface-container-lowest": "#ffffff",
        "surface-container-high": "#E5E7EB",
        outline: "#98A2B3",
        "outline-variant": "#D0D5DD",
      },
      fontFamily: {
        sans: ["'Plus Jakarta Sans'", "sans-serif"],
        display: ["'Plus Jakarta Sans'", "sans-serif"],
      },
      borderRadius: {
        DEFAULT: "0.25rem",
        lg: "0.5rem",
        xl: "0.75rem",
        "2xl": "1rem",
        full: "9999px",
      },
    },
  },
  plugins: [],
};
