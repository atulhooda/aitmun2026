/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./committees.html",
        "./secretariat.html",
        "./registration.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                "primary": "#d4af37",
                "midnight": "#0A0F0A",
                "mithril": "#f1f5f9",
                "gold-leaf": "#d4af37",
                "gold-bright": "#f9e498",
                "gold-deep": "#7a5a2a",
                "deep-blue": "#0a192f",
                "background-light": "#f1f5f9",
                "background-dark": "#030508",
            },
            fontFamily: {
                "serif-title": ["Cinzel", "serif"],
                "serif-body": ["Cormorant Garamond", "serif"],
                "display": ["Cinzel", "serif"],
                "body": ["Cormorant Garamond", "serif"],
                "sans": ["Cormorant Garamond", "serif"],
            },
            borderRadius: {
                "DEFAULT": "0.25rem",
                "lg": "0.5rem",
                "xl": "0.75rem",
                "full": "9999px"
            },
        },
    },
    plugins: [],
}
