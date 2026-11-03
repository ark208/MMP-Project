import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './client/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './client/components/**/*.{js,ts,jsx,tsx,mdx}',
    './client/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        campus: {
          bg: '#F8F5F0',
          sidebar: '#F1ECE5',
          primary: '#B9573B',
          secondary: '#6698C2',
          card: '#FFFFFF',
          text: '#242424',
          muted: '#77716D',
          border: '#E8DED5',
          hover: '#EAE3D9',
          active: '#F4ECE4',
        },
        terracotta: {
          50: '#FDF8F6',
          100: '#FAF0EB',
          200: '#F4E0D7',
          300: '#E7C1B2',
          400: '#D5947F',
          500: '#C76F53',
          600: '#B9573B', // Main primary terracotta
          700: '#9B452D',
          800: '#7E3A27',
          900: '#673324',
        },
        sky: {
          50: '#F0F7FC',
          100: '#E0EFF9',
          200: '#C2DFF3',
          300: '#97C7EB',
          400: '#7BB5DC',
          500: '#6698C2', // Secondary sky blue
          600: '#4E7FA8',
          700: '#3E6688',
        },
        primary: {
          50: '#FDF8F6',
          100: '#FAF0EB',
          200: '#F4E0D7',
          300: '#E7C1B2',
          400: '#D5947F',
          500: '#C76F53',
          600: '#B9573B',
          700: '#9B452D',
          800: '#7E3A27',
          900: '#673324',
        },
        secondary: {
          50: '#F0F7FC',
          100: '#E0EFF9',
          200: '#C2DFF3',
          300: '#97C7EB',
          400: '#7BB5DC',
          500: '#6698C2',
          600: '#4E7FA8',
          700: '#3E6688',
        },
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
    },
  },
  plugins: [],
};

export default config;
