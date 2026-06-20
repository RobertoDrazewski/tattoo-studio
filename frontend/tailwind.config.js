/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink:    '#111111',   // negro principal (logo, titulares)
        soft:   '#6b6660',   // texto secundario
        line:   '#e7e3dd',   // hairlines / bordes
        paper:  '#faf9f7',   // gris muy claro de fondo
        snow:   '#ffffff',
        blood:  '#7a1418',   // acento óxido/sangre (uso mínimo)
        blood2: '#9a1c20',
      },
      fontFamily: {
        display: ['Archivo', 'system-ui', 'sans-serif'],
        body:    ['Inter', 'system-ui', 'sans-serif'],
      },
      letterSpacing: { tightest: '-0.04em' },
      keyframes: {
        fadeUp: { '0%': { opacity: 0, transform: 'translateY(20px)' }, '100%': { opacity: 1, transform: 'none' } },
      },
      animation: { fadeUp: 'fadeUp .7s cubic-bezier(.2,.7,.2,1) both' },
    },
  },
  plugins: [],
};
