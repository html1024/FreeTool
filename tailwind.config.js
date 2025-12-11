/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./index.tsx",
    "./App.tsx",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./services/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary: "#607AFB",
        "background-light": "#f5f6f8",
        "background-dark": "#0f1323",
        "text-light": "#1e293b",
        "text-dark": "#e2e8f0",
        "subtle-light": "#64748b",
        "subtle-dark": "#94a3b8",
        "border-light": "#e2e8f0",
        "border-dark": "#334155",
        "surface-light": "#ffffff",
        "surface-dark": "#1e293b"
      },
      fontFamily: {
        display: "Inter, sans-serif",
        mono: "'Fira Code', 'JetBrains Mono', monospace",
      },
      borderRadius: {
        DEFAULT: "0.25rem",
        lg: "0.5rem",
        xl: "0.75rem",
        full: "9999px"
      }
    }
  },
  plugins: [],
}
