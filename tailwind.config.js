/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#0A0B10",
        surface: "#11131C",
        "surface-card": "#161824",
        "surface-hover": "#1F2233",
        border: "rgba(255, 255, 255, 0.08)",
        "border-light": "rgba(255, 255, 255, 0.15)",
        gold: "#F5C518",
        brand: {
          50: "#EEF2FF",
          100: "#E0E7FF",
          500: "#6366F1",
          600: "#4F46E5",
          700: "#4338CA",
        },
        whatsapp: "#25D366",
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "cinema-glow": "radial-gradient(circle at 50% 0%, rgba(99, 102, 241, 0.12), transparent 70%)",
        "card-gradient": "linear-gradient(180deg, rgba(255,255,255,0.03) 0%, rgba(10,11,16,0.9) 100%)",
        "hero-gradient": "linear-gradient(180deg, rgba(10,11,16,0) 0%, rgba(10,11,16,0.95) 100%)",
      },
      boxShadow: {
        "glow-gold": "0 0 25px -3px rgba(245, 197, 24, 0.35)",
        "glow-brand": "0 0 30px -5px rgba(99, 102, 241, 0.35)",
        "glow-card": "0 10px 30px -10px rgba(0, 0, 0, 0.8)",
      }
    },
  },
  plugins: [
    function ({ addUtilities }) {
      addUtilities({
        ".perspective-1000": {
          perspective: "1000px",
        },
        ".perspective-1200": {
          perspective: "1200px",
        },
        ".preserve-3d": {
          transformStyle: "preserve-3d",
        },
        ".backface-hidden": {
          backfaceVisibility: "hidden",
        },
      });
    },
  ],
};
