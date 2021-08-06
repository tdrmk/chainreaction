module.exports = {
  purge: {
    content: ["./client/**/*.js", "./client/**/*.html"],
    options: {
      keyframes: true,
    },
  },
  darkMode: false, // or 'media' or 'class'
  theme: {
    extend: {},
  },
  variants: {
    extend: {
      opacity: ["disabled"],
      backgroundColor: ["disabled"],
      cursor: ["disabled"],
      inset: ["hover"],
    },
  },
  plugins: [require("@tailwindcss/forms")],
};
