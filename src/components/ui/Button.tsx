import React from 'react'

/**
 * The button.
 *
 * Before this existed the primary CTA class string was copy-pasted **11 times**
 * across FinalCta, LandingHero, LandingContractors (×2), WebsiteSocialCombo,
 * SiteHeader (×2), SiteFooter, MobileStickyCta, Refer and Home — each copy
 * subtly different, so there was no search-and-replace. It had already started
 * to rot: Home's copy had silently lost its shadow and nobody noticed.
 * docs/CREDIBILITY_PLAN_2026-07-20.md counted 4. It was 11.
 *
 * Shape language, 2026-07-20: square. No radius, no glow, no magnetic hover,
 * no gradient. A button is a rectangle you press. Feedback is a 1px shift
 * against a hard offset shadow — mechanical, like a real switch, rather than
 * the float-and-scale that reads as generated.
 *
 * `ring-focus-signal` is kept on every variant: keyboard focus is not optional.
 */

type ButtonVariant = 'primary' | 'secondary' | 'ghost'
type ButtonSize = 'sm' | 'md' | 'lg'

interface ButtonBaseProps {
  variant?: ButtonVariant
  size?: ButtonSize
  fullWidth?: boolean
  tone?: 'default' | 'inverted'
  className?: string
  children: React.ReactNode
}

type ButtonProps = ButtonBaseProps &
  Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, keyof ButtonBaseProps>

const SIZES: Record<ButtonSize, string> = {
  sm: 'px-4 py-2 text-sm',
  md: 'px-6 py-3 text-base',
  lg: 'px-8 py-4 text-base sm:text-lg',
}

/**
 * `translate` + `shadow` pair: the button sits 2px proud of a solid black block
 * and presses flush on :active. Nothing blurs.
 */
const VARIANTS: Record<ButtonVariant, Record<'default' | 'inverted', string>> = {
  primary: {
    default:
      'bg-signal-500 text-white border border-signal-500 hover:bg-signal-600 hover:border-signal-600 shadow-[3px_3px_0_0_#111110] hover:shadow-[1px_1px_0_0_#111110] hover:translate-x-[2px] hover:translate-y-[2px] active:shadow-none active:translate-x-[3px] active:translate-y-[3px]',
    inverted:
      'bg-signal-500 text-white border border-signal-500 hover:bg-signal-600 hover:border-signal-600 shadow-[3px_3px_0_0_#F2F1EF] hover:shadow-[1px_1px_0_0_#F2F1EF] hover:translate-x-[2px] hover:translate-y-[2px] active:shadow-none active:translate-x-[3px] active:translate-y-[3px]',
  },
  secondary: {
    default:
      'bg-transparent text-ink-900 border border-ink-900 hover:bg-ink-900 hover:text-cream-50',
    inverted:
      'bg-transparent text-cream-50 border border-cream-50 hover:bg-cream-50 hover:text-ink-900',
  },
  ghost: {
    default:
      'bg-transparent text-ink-900 border border-transparent hover:border-ink-900 px-0 hover:px-6',
    inverted:
      'bg-transparent text-cream-50 border border-transparent hover:border-cream-50 px-0 hover:px-6',
  },
}

const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  tone = 'default',
  className = '',
  children,
  ...rest
}) => (
  <button
    className={[
      'group inline-flex items-center justify-center gap-2 font-semibold uppercase tracking-[0.08em]',
      'transition-[background-color,color,box-shadow,transform,border-color,padding] duration-150 ease-out',
      'ring-focus-signal disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
      SIZES[size],
      VARIANTS[variant][tone],
      fullWidth ? 'w-full' : '',
      className,
    ]
      .filter(Boolean)
      .join(' ')}
    {...rest}
  >
    {children}
  </button>
)

export default Button
