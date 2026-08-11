/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        "foundation-greendark": "var(--foundation-greendark)",
        "foundation-greendark-active": "var(--foundation-greendark-active)",
        "foundation-greendark-hover": "var(--foundation-greendark-hover)",
        "foundation-greendarker": "var(--foundation-greendarker)",
        "foundation-greenlight": "var(--foundation-greenlight)",
        "foundation-greenlight-active": "var(--foundation-greenlight-active)",
        "foundation-greenlight-hover": "var(--foundation-greenlight-hover)",
        "foundation-greennormal": "var(--foundation-greennormal)",
        "foundation-greennormal-active": "var(--foundation-greennormal-active)",
        "foundation-greennormal-hover": "var(--foundation-greennormal-hover)",
      },
    },
  },
  plugins: [],
};
