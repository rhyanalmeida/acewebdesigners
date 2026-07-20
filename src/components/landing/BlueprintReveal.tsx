import React from 'react'
import { ArrowRight } from 'lucide-react'
import { motion, useReducedMotion, type Variants } from 'framer-motion'
import Container from '../ui/Container'
import Eyebrow from '../ui/Eyebrow'
import GradientHeading from '../ui/GradientHeading'
import Button from '../ui/Button'

/**
 * BlueprintReveal — the signature scroll moment on /contractorlanding.
 *
 * A full-bleed drafting-navy panel with slightly angled top/bottom edges
 * (clip-path) that, as it scrolls into view, DRAWS its own technical schematic
 * of the website + social "system": module outlines stroke on, the red
 * lead-flow connector draws, dimension lines extend, redline labels fade in.
 *
 * The heading, copy, benefits and CTA are plain (never hidden) — only the
 * decorative line drawing animates, so the section is fully readable even with
 * JS off, in a full-page screenshot, or under prefers-reduced-motion (which
 * renders the finished drawing with no motion).
 *
 * Technique: Framer Motion `pathLength` on <motion.path>, driven by whileInView
 * (once). No new dependencies — Framer Motion is already used by the heroes.
 */

interface BlueprintRevealProps {
  onCta: () => void
  ctaLabel?: string
}

const COMBO_BENEFITS = [
  { title: 'Posts that show real work', desc: 'Job-site photos and reels — no stock images, no AI fluff.' },
  { title: 'Found by neighbors', desc: 'Google Business Profile and local SEO so the right homes find you.' },
  { title: 'One team, no hand-offs', desc: 'The people who built your site run your social. Calls land where they convert.' },
]

// Drafting-ink colours tuned for the deep navy ground.
const LINE = '#CBDCEC'   // module line work
const DIM = '#8AA4BC'    // dimension lines
const RED = '#E06A6A'    // lead-flow connector (redline)
const REDTXT = '#EE9393' // red annotations
const DIMTXT = '#9DB4CA' // dimension labels

const EASE = [0.22, 1, 0.36, 1] as const

const draw: Variants = {
  hidden: { pathLength: 0, opacity: 0 },
  show: { pathLength: 1, opacity: 1, transition: { pathLength: { duration: 0.7, ease: EASE }, opacity: { duration: 0.2 } } },
}
const fade: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.45, ease: EASE } },
}

/** A drawable outline (rect/line as a path so pathLength animates uniformly). */
const P: React.FC<{ d: string; stroke?: string; width?: number }> = ({ d, stroke = LINE, width = 1.6 }) => (
  <motion.path
    d={d}
    fill="none"
    stroke={stroke}
    strokeWidth={width}
    strokeLinecap="square"
    strokeLinejoin="miter"
    vectorEffect="non-scaling-stroke"
    variants={draw}
  />
)

const BlueprintReveal: React.FC<BlueprintRevealProps> = ({
  onCta,
  ctaLabel = 'Book a call to set up the combo',
}) => {
  const reduced = useReducedMotion()

  // When reduced-motion: render the finished drawing immediately, no scroll trigger.
  const svgAnim = reduced
    ? { initial: 'show' as const, animate: 'show' as const }
    : {
        initial: 'hidden' as const,
        whileInView: 'show' as const,
        viewport: { once: true, amount: 0.35 },
      }

  const container: Variants = {
    hidden: {},
    show: { transition: { staggerChildren: 0.1, delayChildren: 0.05 } },
  }

  return (
    <section
      className="relative isolate overflow-hidden surface-blueprint-dark text-cream-50"
      style={{ clipPath: 'polygon(0 2.4%, 100% 0, 100% 97.6%, 0 100%)' }}
      aria-label="Website and social media, working as one system"
    >
      <Container size="lg" className="py-24 sm:py-28 lg:py-32">
        <div className="grid gap-12 lg:grid-cols-[0.92fr_1.08fr] lg:items-center">
          {/* Copy — plain, always visible */}
          <div>
            <Eyebrow tone="inverted">Website + Social Media</Eyebrow>
            <GradientHeading level={2} size="lg" tone="inverted" className="mt-5" accent="that work together">
              Two channels,
            </GradientHeading>
            <p className="mt-5 text-base sm:text-lg text-cream-100/85 leading-relaxed max-w-xl">
              Your website turns clicks into booked jobs. Your social keeps you top-of-mind for the
              next one. We handle both so neither falls behind.
            </p>

            <ul className="mt-8 space-y-5 max-w-xl">
              {COMBO_BENEFITS.map((b, i) => (
                <li key={b.title} className="flex items-start gap-4">
                  <span className="label-num text-signal-400 shrink-0 leading-none pt-1">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <div>
                    <h3 className="font-display text-lg font-semibold text-cream-50">{b.title}</h3>
                    <p className="mt-1 text-sm text-cream-100/75 leading-relaxed">{b.desc}</p>
                  </div>
                </li>
              ))}
            </ul>

            <div className="mt-9">
              <Button variant="primary" size="lg" tone="inverted" onClick={onCta}>
                {ctaLabel}
                <ArrowRight className="h-5 w-5 icon-nudge" aria-hidden />
              </Button>
            </div>
            <p className="mt-3 text-xs text-cream-100/60">
              No card on file. Discuss the combo on the call — buy only if you love it.
            </p>
          </div>

          {/* The drawn schematic — the animated blueprint */}
          <div className="relative">
            <motion.svg
              viewBox="0 0 620 400"
              className="w-full h-auto"
              role="img"
              aria-label="Schematic: a website module and a social feed module linked as one system"
              variants={container}
              {...svgAnim}
            >
              {/* ── WEBSITE module (browser) ── */}
              <P d="M30 70 H360 V280 H30 Z" width={1.8} />
              <P d="M30 102 H360" />
              <P d="M100 80 H300 V92 H100 Z" />
              <P d="M52 120 H190 V138 H52 Z" />
              <P d="M52 150 H338 V220 H52 Z" />
              <P d="M52 232 H250" />
              <P d="M52 248 H208" />
              {/* browser dots */}
              <motion.circle cx="48" cy="86" r="3.4" fill={LINE} variants={fade} />
              <motion.circle cx="62" cy="86" r="3.4" fill={LINE} variants={fade} />
              <motion.circle cx="76" cy="86" r="3.4" fill={LINE} variants={fade} />

              {/* ── SOCIAL module (phone) ── */}
              <P d="M440 108 H590 V362 H440 Z" width={1.8} />
              <P d="M492 120 H538" />
              <P d="M456 138 H574 V202 H456 Z" />
              <P d="M456 214 H574 V250 H456 Z" />
              <P d="M456 262 H574 V300 H456 Z" />

              {/* ── Lead-flow connector (redline) ── */}
              <P d="M362 176 H438" stroke={RED} width={1.9} />
              <P d="M431 170 L440 176 L431 182" stroke={RED} width={1.9} />
              <P d="M369 170 L360 176 L369 182" stroke={RED} width={1.9} />

              {/* ── Dimension: width of website ── */}
              <P d="M30 292 V312" stroke={DIM} width={1.1} />
              <P d="M360 292 V312" stroke={DIM} width={1.1} />
              <P d="M30 302 H360" stroke={DIM} width={1.1} />
              {/* ── Dimension: height of phone ── */}
              <P d="M604 108 V362" stroke={DIM} width={1.1} />
              <P d="M598 108 H610" stroke={DIM} width={1.1} />
              <P d="M598 362 H610" stroke={DIM} width={1.1} />

              {/* ── Labels ── */}
              <motion.text x="30" y="58" fill={REDTXT} className="bp-label" variants={fade}>WEBSITE</motion.text>
              <motion.text x="440" y="98" fill={REDTXT} className="bp-label" variants={fade}>SOCIAL</motion.text>
              <motion.text x="401" y="164" fill={REDTXT} className="bp-label" textAnchor="middle" variants={fade}>One team</motion.text>
              <motion.text x="195" y="328" fill={DIMTXT} className="bp-label" textAnchor="middle" variants={fade}>Responsive</motion.text>
              <motion.text
                x="620" y="235" fill={DIMTXT} className="bp-label" textAnchor="middle"
                transform="rotate(90 620 235)" variants={fade}
              >Feed</motion.text>
            </motion.svg>
          </div>
        </div>
      </Container>
    </section>
  )
}

export default BlueprintReveal
