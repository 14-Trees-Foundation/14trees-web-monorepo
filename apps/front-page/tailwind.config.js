/** @type {import('tailwindcss').Config} */
baseConfig = require("tailwind-config/tailwind.config.js");
const colors = {
    'dark-grey': '#1b1f23',
    'darker-grey': '#181d21',
    'darkish-grey': '#16191c',
    'primary-green': {
        1 : '#1b1f23',
        2 : '#9acd9a',
    }
}

const theme = {
    theme: {
        extend: {
            colors: {
                ...colors,
            },
        }
    }
}

module.exports = {
    ...baseConfig,
    ...theme,
}
