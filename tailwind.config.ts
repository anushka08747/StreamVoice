import type { Config } from "tailwindcss";
export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "var(--bg)", "bg-2": "var(--bg-2)", surface: "var(--surface)", ink: "var(--ink)", "ink-soft": "var(--ink-soft)", muted: "var(--muted)",
        primary: "var(--primary)", "primary-soft": "var(--primary-soft)", teal: "var(--teal)",
        good: "var(--good)", "good-soft": "var(--good-soft)", warn: "var(--warn)", "warn-soft": "var(--warn-soft)",
        bad: "var(--bad)", "bad-soft": "var(--bad-soft)", unknown: "var(--unknown)", "unknown-soft": "var(--unknown-soft)",
      },
      fontFamily: { sans: ["var(--font-sans)", "system-ui", "sans-serif"], mono: ["var(--font-mono)", "ui-monospace", "monospace"] },
    },
  },
  plugins: [],
} satisfies Config;
