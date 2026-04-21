import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/app/**/*.{ts,tsx}', './src/components/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // ダークトーンのベース
        ink: {
          50: '#f4f4f6',
          100: '#e2e2e7',
          200: '#b8b8c2',
          300: '#8b8b9a',
          400: '#5a5a68',
          500: '#3b3b46',
          600: '#2a2a33',
          700: '#1e1e26',
          800: '#16161c',
          900: '#0e0e14',
        },
        // 感情ごとの固定色 (task 指定)
        emotion: {
          anger: '#E05252',
          sadness: '#5B8BD6',
          fear: '#9B6FD4',
          joy: '#F0B429',
          disgust: '#4CAF7D',
          surprise: '#F07B29',
          numbness: '#8a8a95',
          guilt: '#7f6d5e',
          shame: '#c48da8',
        },
      },
      fontFamily: {
        sans: [
          'var(--font-sans)',
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Helvetica Neue',
          'Hiragino Sans',
          'Yu Gothic UI',
          'sans-serif',
        ],
      },
    },
  },
  plugins: [],
};

export default config;
