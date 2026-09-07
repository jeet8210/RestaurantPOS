/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        leaf: '#2F5233',
        leafdark: '#1F3A22',
        gold: '#B8862F',
        goldsoft: '#E9C77B',
        ivory: '#FBF8F0',
      },
    },
  },
  plugins: [],
};
