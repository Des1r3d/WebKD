/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "var(--color-primary)",
          hover: "var(--color-primary-hover)",
          light: "var(--color-primary-light)",
          dark: "var(--color-primary-dark)",
        },
        accent: {
          DEFAULT: "var(--color-accent)",
          hover: "var(--color-accent-hover)",
          light: "var(--color-accent-light)",
        },
        bg: {
          app: "var(--color-bg-app)",
          surface: "var(--color-bg-surface)",
          subtle: "var(--color-bg-subtle)",
        },
        border: {
          default: "var(--color-border-default)",
          strong: "var(--color-border-strong)",
        },
        text: {
          primary: "var(--color-text-primary)",
          secondary: "var(--color-text-secondary)",
          muted: "var(--color-text-muted)",
          inverted: "var(--color-text-inverted)",
        },
        status: {
          available: "var(--status-available)",
          open: "var(--status-open)",
          locked: "var(--status-locked)",
          awaiting: "var(--status-awaiting)",
          paid: "var(--status-paid)",
          completed: "var(--status-completed)",
          cancelled: "var(--status-cancelled)",
          disputed: "var(--status-disputed)",
        },
        rep: {
          a: "var(--rep-a)",
          b: "var(--rep-b)",
          c: "var(--rep-c)",
          flagged: "var(--rep-flagged)",
        },
      },
      fontFamily: {
        sans: "var(--font-sans)",
        mono: "var(--font-mono)",
      },
      borderRadius: {
        sm: "var(--radius-sm)",
        md: "var(--radius-md)",
        lg: "var(--radius-lg)",
        xl: "var(--radius-xl)",
      },
      boxShadow: {
        sm: "var(--shadow-sm)",
        md: "var(--shadow-md)",
        lg: "var(--shadow-lg)",
      },
    },
  },
  plugins: [],
};
