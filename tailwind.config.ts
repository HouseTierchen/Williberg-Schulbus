import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Wappenfarben Wiliberg: weiss/blau, mit grüner Rebe und goldenem Mühlrad
        wili: {
          blue: "#0a5ea8",
          bluedark: "#074478",
          bluelight: "#e8f1fa",
          green: "#3a8a3a",
          gold: "#e8b923",
          ink: "#1a2b3c",
          paper: "#fafafa",
        },
      },
      fontFamily: {
        sans: [
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
        serif: ["Georgia", "Cambria", "Times New Roman", "serif"],
      },
    },
  },
  plugins: [],
};
export default config;
