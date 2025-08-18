/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      keyframes: {
        "fade-in": {
          from: { opacity: "0", transform: "translateY(-10px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "jump-in": {
          "0%": { transform: "scale(0.5) translateY(50px)", opacity: "0" },
          "80%": { transform: "scale(1.1) translateY(-10px)", opacity: "1" },
          "100%": { transform: "scale(1) translateY(0)", opacity: "1" },
        },
        "winner-text-anim": {
          "0%, 100%": {
            textShadow:
              "0 0 5px #fff, 0 0 10px #fff, 0 0 15px #fff, 0 0 20px #fde047, 0 0 30px #fde047, 0 0 40px #fde047, 0 0 55px #fde047",
          },
          "50%": { textShadow: "none" },
        },
        flutter: {
          "0%": { transform: "rotateY(0) rotateX(0)" },
          "100%": {
            transform:
              "rotateY(var(--flutter-rotate-y-end)) rotateX(var(--flutter-rotate-x-end))",
          },
        },
      },
      animation: {
        "fade-in": "fade-in 0.3s ease-out forwards",
        "jump-in": "jump-in 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards",
        "winner-text": "winner-text-anim 2s infinite",
        // Note: The 'flutter' animation is applied via inline style to use CSS variables
      },
    },
  },
  plugins: [],
};
