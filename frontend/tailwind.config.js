/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx,js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        title: ['Xystema', 'Impact', 'sans-serif'],
        body: ['Montserrat', 'system-ui', 'sans-serif']
      },
      colors: {
        lp: {
          bg: 'var(--lp-bg)',
          surface: 'var(--lp-surface)',
          border: 'var(--lp-border)',
          text: 'var(--lp-text)',
          muted: 'var(--lp-muted)',
          primary: 'var(--lp-primary)',
          accent: 'var(--lp-accent)',
          success: 'var(--lp-success)',
          warning: 'var(--lp-warning)',
          error: 'var(--lp-error)',
          navy: 'var(--lp-navy)',
          blue: 'var(--lp-blue)',
          cyan: 'var(--lp-cyan)',
          lime: 'var(--lp-lime)',
          orange: 'var(--lp-orange)'
        }
      },
      backgroundImage: {
        'lp-grad-primary': 'var(--lp-grad-primary)',
        'lp-grad-purple': 'var(--lp-grad-purple)',
        'lp-grad-mint': 'var(--lp-grad-mint)',
        'lp-grad-aurora': 'var(--lp-grad-aurora)'
      }
    }
  },
  plugins: []
};
