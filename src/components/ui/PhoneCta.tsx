import React from 'react'
import { Phone, Mail } from 'lucide-react'
import { trackPhoneClick } from '../../utils/pixelTracking'

export interface PhoneCtaProps {
  phone?: string
  email?: string
  /** Display variant — `inline` for hero, `stacked` for footer-style */
  variant?: 'inline' | 'stacked'
  tone?: 'default' | 'inverted'
  showLabels?: boolean
  /** Where this CTA appears — passed to Meta as the click source for attribution. */
  source?: string
  className?: string
}

const formatPhoneHref = (phone: string) => `tel:+1${phone.replace(/[^\d]/g, '')}`

const PhoneCta: React.FC<PhoneCtaProps> = ({
  phone = '(774) 446-7375',
  email = 'hello@acewebdesigners.com',
  variant = 'inline',
  tone = 'default',
  showLabels = true,
  source = 'unknown',
  className = '',
}) => {
  const isDark = tone === 'inverted'
  const baseLink = isDark
    ? 'text-cream-50 hover:text-rust-300'
    : 'text-ink-900 hover:text-rust-600'
  const subText = isDark ? 'text-cream-100/60' : 'text-ink-700/70'

  return (
    <div
      className={`flex ${
        variant === 'stacked' ? 'flex-col gap-2' : 'flex-wrap items-center gap-x-6 gap-y-2'
      } ${className}`}
    >
      <a
        href={formatPhoneHref(phone)}
        onClick={() => trackPhoneClick(source)}
        className={`group inline-flex items-center gap-2.5 ring-focus-rust rounded ${baseLink} transition-colors duration-200 ease-premium`}
        aria-label={`Call ${phone}`}
      >
        <Phone className="h-4 w-4 shrink-0" aria-hidden />
        <span className="flex flex-col leading-tight">
          {showLabels && <span className={`label-mono ${subText}`}>Call us</span>}
          <span className="font-display text-base sm:text-lg font-medium underline decoration-rust-500/40 underline-offset-4 group-hover:decoration-rust-500 transition-colors">
            {phone}
          </span>
        </span>
      </a>

      <a
        href={`mailto:${email}`}
        className={`group inline-flex items-center gap-2.5 ring-focus-rust rounded ${baseLink} transition-colors duration-200 ease-premium`}
        aria-label={`Email ${email}`}
      >
        <Mail className="h-4 w-4 shrink-0" aria-hidden />
        <span className="flex flex-col leading-tight">
          {showLabels && <span className={`label-mono ${subText}`}>Email</span>}
          <span className="font-display text-base sm:text-lg font-medium underline decoration-rust-500/40 underline-offset-4 group-hover:decoration-rust-500 transition-colors">
            {email}
          </span>
        </span>
      </a>
    </div>
  )
}

export default PhoneCta
