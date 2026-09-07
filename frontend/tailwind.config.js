/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          950: "#040B1B",
          900: "#07142F", // Midnight Navy
          800: "#0E2147",
          700: "#163166",
        },
        royal: {
          600: "#1C48B8",
          500: "#2457D6", // Royal Blue
          400: "#3B6FF0",
        },
        electric: {
          500: "#4D8DFF", // Electric Blue
          400: "#70A4FF",
          300: "#94BBFF",
        },
        soft: "#F8FAFC",
        deep: "#0B1220",
      },
      backgroundImage: {
        'royal-gradient': 'linear-gradient(135deg, #07142F 0%, #0E2147 50%, #163166 100%)',
        'card-gradient': 'linear-gradient(180deg, rgba(14, 33, 71, 0.6) 0%, rgba(7, 20, 47, 0.8) 100%)',
        'glow-gradient': 'radial-gradient(circle at 50% 0%, rgba(77, 141, 255, 0.12) 0%, transparent 70%)',
      },
      boxShadow: {
        'electric-glow': '0 0 25px -5px rgba(77, 141, 255, 0.3)',
        'card-hover': '0 8px 30px rgba(0, 0, 0, 0.15), 0 0 15px rgba(77, 141, 255, 0.15)',
        'light-card': '0 4px 20px -2px rgba(0, 0, 0, 0.05), 0 2px 6px -1px rgba(0, 0, 0, 0.03)',
      }
    },
  },
  plugins: [],
}
