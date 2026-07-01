/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#172033",
        ocean: "#1c77c3",
        mint: "#3bb273",
        sand: "#f7f9fc",
        coral: "#ff6f61"
      },
      boxShadow: {
        flat: "0 10px 30px rgba(23, 32, 51, 0.1)",
      },
      fontFamily: {
        sans: ["Manrope", "ui-sans-serif", "system-ui"],
      },
    },
  },
  plugins: [],
};
