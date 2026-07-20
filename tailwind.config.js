/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        // ONE family for display and body: Archivo, variable on weight AND width.
        // The width axis is the whole point — Expanded/Black gives signage-weight
        // headlines, Condensed gives spec-sheet labels, from a single file.
        //
        // Fraunces was removed 2026-07-20. A large serif display face over a warm
        // off-white ground is the documented signature of AI-generated web design,
        // which is exactly what the site was being mocked for.
        //
        // Also rejected, with reasons: Oswald / Anton / Bebas Neue are the reflexive
        // "make it look tough" faces and the default of every contractor and gym
        // template — they would have made the site MORE generic while feeling more
        // industrial. Geist now reads as developer-tool marketing. Bricolage
        // Grotesque is on its way to being the next Inter. Instrument Sans caps at
        // 700 with no width axis, so it cannot carry display.
        sans: ['Archivo', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        display: ['Archivo', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
        // Real mono, not the system fallback. Carries the numbering, the metadata
        // labels and every date-stamped figure. See docs/ART_DIRECTION.md.
        mono: ['IBM Plex Mono', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      colors: {
        // ----- Concrete palette (2026-07-20) -----
        // Warmth removed entirely. The previous ramp was warm paper (#FAF8F4 and
        // friends), and warm off-white under a display face is the AI-web-design
        // signature we keep getting caught by. These are neutral-cool greys —
        // concrete, not parchment. Industrial brands use white or near-black
        // grounds and never warm cream.
        //
        // Token names kept as `cream-*` deliberately: renaming would touch ~37
        // files for zero visual gain, and a rename is what buried the last palette
        // change in noise. The values are the contract, not the word.
        cream: {
          50:  '#F2F1EF', // ground
          100: '#EAE9E6', // section alt
          200: '#DEDCD8', // panels
          300: '#C9C7C2', // dividers / muted
          400: '#A9A7A1',
        },
        // Neutralised: the old ramp was a warm near-black (#1A1611) which reinforced
        // the cream-and-rust signature. Body text now sits near #404040, and nothing
        // is pure black — a convention every reference studio follows.
        ink: {
          50:  '#F2F1EF', // inverted-on-dark text
          100: '#D4D3D0',
          200: '#96958F',
          500: '#575652',
          700: '#3C3B38', // body text muted
          800: '#2A2927', // body text default
          900: '#111110', // headlines / strong text / inverted grounds
          950: '#000000',
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
      // `ring` and `inner-soft` deleted — zero uses. `glow-signal` deleted: a
      // coloured glow under a button is the soft/premium register being removed.
      // What survives is flat and structural; depth comes from 1px rules, not blur.
      boxShadow: {
        soft: '0 1px 2px rgba(17, 17, 16, 0.05)',
        lift: '0 2px 0 0 rgba(17, 17, 16, 1)',
      },
      // All three collapsed to 0 on 2026-07-20. This one edit squares 17 call
      // sites across the library without touching them. The keys are kept rather
      // than deleted precisely so those call sites keep compiling — `rounded-xl3`
      // now simply means "square", and the classes get cleaned up as each
      // component is touched. `xl4` was registered and never used once.
      //
      // Tailwind's built-in `rounded-full` is deliberately NOT overridden here:
      // ~37 of its ~72 uses are in admin/, RestaurantWizard and Scheduler, where
      // they are genuinely circles (status dots, avatars, skeleton bars).
      borderRadius: {
        xl2: '0px',
        xl3: '0px',
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
      },
      animation: {
        'fade-in-up':   'fade-in-up 0.7s cubic-bezier(0.22, 1, 0.36, 1) both',
        'pulse-signal': 'pulse-signal 2.4s ease-in-out infinite',
      },
    },
  },
  plugins: [],
  future: {
    hoverOnlyWhenSupported: true,
  },
};
