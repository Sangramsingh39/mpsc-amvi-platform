/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#F7F9FC",
        surface: "#FFFFFF",
        primary: {
          DEFAULT: "#5B6EE1",
          hover: "#4A5CD0",
          light: "#EAF0FF"
        },
        success: {
          DEFAULT: "#3FA66B",
          light: "#E8F7EF",
          softBg: "#E8F7EF"
        },
        error: {
          DEFAULT: "#D9534F",
          light: "#FDECEC",
          softBg: "#FDECEC"
        },
        warning: {
          DEFAULT: "#F59E0B",
          light: "#FFF8E1"
        },
        dark: {
          DEFAULT: "#263238",
          secondary: "#6B7280"
        },
        borderSoft: "#E5E7EB"
      }
    },
  },
  plugins: [],
}
