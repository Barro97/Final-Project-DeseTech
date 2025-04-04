/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // The key “border” => color name = border-border
        border: "var(--border)",
        // The key “ring” => color name = ring-ring, or outline-ring, etc.
        ring: "var(--ring)",
        // background: "var(--background)",
        // foreground: "var(--foreground)",
        primary: "hsl(var(--primary) / <alpha-value>)",
        border: "hsl(var(--border) / <alpha-value>)",
        background: "hsl(var(--background) / <alpha-value>)",
      },
    },
  },
  plugins: [],
};
