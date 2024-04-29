/** @type {import('tailwindcss').Config} */
import * as baseConfig from "ui/tailwind.config";
const defaultTheme = require('tailwindcss/defaultTheme')

module.exports = {
    // extend the default theme to include some custom fonts
    theme: {
        extend: {
        fontFamily: {
            sans: ['"Roboto"', ...defaultTheme.fontFamily.sans],
        },
        }
    },
    darkMode: 'class',
    ...baseConfig,
}
