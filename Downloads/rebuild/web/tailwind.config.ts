import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        background: '#0a0a0a',
        surface: '#141414',
        gold: '#F5C518',
        'gold-dark': '#d4a017',
      },
    },
  },
  plugins: [],
};

export default config;
