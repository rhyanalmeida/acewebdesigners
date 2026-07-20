/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        // Inter was dropped 2026-07-20. It is the default of every generated site
        // and every SaaS template, and under a serif display face it is most of
        // what makes a page read as machine output. Hanken Grotesk is humanist
        // enough to survive at body size without announcing itself, and is not
        // Jakarta/Manrope/DM Sans — the next wave of the same genericism.
        sans: ['Hanken Grotesk', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        display: ['Fraunces', 'ui-serif', 'Georgia', 'Cambria', 'Times New Roman', 'Times', 'serif'],
        // Real mono, not the system fallback. Carries the job-sheet numbering,
        // metadata labels and every date-stamped figure. See docs/ART_DIRECTION.md.
        mono: ['IBM Plex Mono', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      colors: {
        // ----- New editorial palette (Phase 3) -----
        // Ground pulled off the beige end of the range (was #FBF7F0). Still warm
        // paper, but out of the cream/beige band that reads as machine-default.
        cream: {
          50:  '#FAF8F4', // body paper
          100: '#F3F1EC', // section alt
          200: '#E8E5DE', // panels
          300: '#D8D4CB', // dividers / muted
          400: '#BDB8AC',
        },
        // Neutralised: the old ramp was a warm near-black (#1A1611) which reinforced
        // the cream-and-rust signature. Body text now sits near #404040, and nothing
        // is pure black — a convention every reference studio follows.
        ink: {
          50:  '#F4F3F1', // inverted-on-dark text
          100: '#D8D6D2',
          200: '#9C9994',
          500: '#5C5A56',
          700: '#4A4845', // body text muted
          800: '#404040', // body text default
          900: '#262625', // headlines / strong text
          950: '#141413',
        },
        // Primary accent. Was rust #C04E1A until 2026-07-20 — that hue, on a cream
        // ground under a serif display face, is the documented signature of
        // AI-generated web design (and is Claude's own brand colour), which is
        // precisely what we were being mocked for. Now a deliberate editorial red.
        // Token kept as `signal` so the name doesn't lie about the colour.
        // See docs/REDESIGN_PLAN_2026-07-20.md §0.
        signal: {
          50:  '#FDF2F2',
          100: '#FADEDE',
          200: '#F2B8B8',
          300: '#E58787',
          400: '#CC4444',
          500: '#A00909', // primary accent
          600: '#8A0808',
          700: '#6E0606',
          800: '#520505',
          900: '#3A0303',
        },
        forest: {
          50:  '#EEF3EF',
          100: '#D6E1D8',
          500: '#3F7558',
          700: '#1F4D3D', // secondary accent (trust/safety)
          800: '#163627',
          900: '#0E2218',
        },
        // The `brand` (indigo), `accent` (orange) and `surface` (cool grey) ramps
        // were deleted 2026-07-20. `brand` fed the blue→violet→magenta gradient
        // that is the single most recognisable generated-site signature, and it
        // survived the previous palette replacement untouched. Three registered
        // ramps that nothing intentionally used meant the palette was never
        // actually enforced. Editorial palette above is the whole system now:
        // cream ground, ink type, signal for the one thing being pointed at,
        // forest for confirmed states.
      },
      backgroundImage: {
        // `brand-gradient`, `brand-gradient-soft`, `mesh-1`, `mesh-2` deleted
        // 2026-07-20 — all four were blue/violet/magenta. One accent, never a
        // gradient. `paper-noise` is the only decorative background that remains
        // and it is two 4%-opacity washes of the real palette.
        'paper-noise': 'radial-gradient(at 0% 0%, rgba(160,9,9,0.04) 0px, transparent 55%), radial-gradient(at 100% 100%, rgba(31,77,61,0.04) 0px, transparent 55%)',
      },
      boxShadow: {
        soft:    '0 1px 2px rgba(38, 38, 37, 0.04), 0 8px 24px rgba(38, 38, 37, 0.06)',
        lift:    '0 4px 12px rgba(38, 38, 37, 0.08), 0 24px 48px rgba(38, 38, 37, 0.10)',
        ring:    '0 0 0 1px rgba(38, 38, 37, 0.08)',
        'glow-signal':  '0 10px 32px -10px rgba(160, 9, 9, 0.45), 0 4px 12px -4px rgba(160, 9, 9, 0.25)',
        'inner-soft':   'inset 0 1px 0 rgba(255, 255, 255, 0.6), inset 0 -1px 0 rgba(38, 38, 37, 0.04)',
      },
      borderRadius: {
        xl2: '1.25rem',
        xl3: '1.75rem',
        xl4: '2.25rem',
      },
      transitionTimingFunction: {
        premium: 'cubic-bezier(0.22, 1, 0.36, 1)',
        spring:  'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
      // 20 keyframes were registered here; 3 were used. The rest (blob, shimmer,
      // border-shine, float-soft, glow-pulse, marquee, the four directional
      // fades, scale-in, slide-up, gradient-shift) were deleted 2026-07-20.
      // glow-pulse and gradient-shift were also indigo/violet. A library of
      // unused decorative motion is how a site ends up decorated by default.
      keyframes: {
        'fade-in-up': { '0%': { opacity: '0', transform: 'translateY(24px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        'pulse-signal': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(160, 9, 9, 0.35)' },
          '50%':      { boxShadow: '0 0 0 8px rgba(160, 9, 9, 0)' },
        },
        'underline-draw': {
          '0%':   { transform: 'scaleX(0)' },
          '100%': { transform: 'scaleX(1)' },
        },
      },
      animation: {
        'fade-in-up':     'fade-in-up 0.7s cubic-bezier(0.22, 1, 0.36, 1) both',
        'pulse-signal':   'pulse-signal 2.4s ease-in-out infinite',
        'underline-draw': 'underline-draw 0.45s cubic-bezier(0.22, 1, 0.36, 1) both',
      },
    },
  },
  plugins: [],
  future: {
    hoverOnlyWhenSupported: true,
  },
};
