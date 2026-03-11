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
                "primary": "#d4af35",
                "background-light": "#f8f7f6",
                "background-dark": "#12110a",
                "parchment": "#1a1811",
            },
            fontFamily: {
                "display": ["Montserrat", "sans-serif"],
                "body": ["Inter", "sans-serif"],
                "sans": ["Inter", "sans-serif"],
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
