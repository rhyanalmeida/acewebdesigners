import React from 'react'
import { LucideIcon } from 'lucide-react'

type Variant = 'primary' | 'brand' | 'rust' | 'secondary' | 'outline' | 'ghost' | 'link' | 'inverted'
type Size = 'sm' | 'md' | 'lg' | 'xl'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  icon?: LucideIcon
  iconPosition?: 'left' | 'right'
  loading?: boolean
  fullWidth?: boolean
  magnetic?: boolean
  children: React.ReactNode
}

const baseClasses =
  'inline-flex items-center justify-center font-semibold rounded-full transition-all duration-300 ease-premium disabled:opacity-50 disabled:cursor-not-allowed ring-focus-rust'

const variantClasses: Record<Variant, string> = {
  // Editorial primary — ink-on-cream filled pill
  primary:
    'bg-ink-900 text-cream-50 hover:bg-ink-800 shadow-soft hover:shadow-lift',
  // Editorial brand-equivalent — same as primary (kept for backward compat)
  brand:
    'bg-ink-900 text-cream-50 hover:bg-ink-800 shadow-soft hover:shadow-lift',
  // Rust — primary CTA when contrast on cream is wanted
  rust:
    'bg-rust-500 text-white hover:bg-rust-600 shadow-glow-rust',
  secondary:
    'bg-cream-100 text-ink-900 ring-1 ring-ink-900/15 hover:bg-cream-200 shadow-soft',
  outline:
    'border-2 border-ink-900/20 text-ink-900 hover:border-rust-500 hover:text-rust-700 hover:bg-rust-50',
  ghost:
    'text-ink-800 hover:text-rust-700 hover:bg-rust-50',
  link:
    'text-rust-700 underline-offset-4 hover:underline px-0 py-0 rounded-none shadow-none',
  inverted:
    'bg-cream-50 text-ink-900 hover:bg-cream-100 shadow-soft hover:shadow-lift',
}

const sizeClasses: Record<Size, string> = {
  sm: 'px-4 py-2 text-sm',
  md: 'px-6 py-3 text-base',
  lg: 'px-8 py-4 text-lg',
  xl: 'px-10 py-5 text-xl',
}

const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  icon: Icon,
  iconPosition = 'right',
  loading = false,
  fullWidth = false,
  magnetic = false,
  className = '',
  children,
  disabled,
  ...props
}) => {
  const widthClass = fullWidth ? 'w-full' : ''
  const magneticClass = magnetic ? 'magnetic-btn' : ''
  const sizeClass = variant === 'link' ? '' : sizeClasses[size]

  const classes = `${baseClasses} ${variantClasses[variant]} ${sizeClass} ${widthClass} ${magneticClass} ${className}`

  return (
    <button className={classes} disabled={disabled || loading} {...props}>
      {loading && (
        <svg
          className="animate-spin -ml-1 mr-3 h-5 w-5"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          aria-hidden
        >
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      )}
      {Icon && iconPosition === 'left' && !loading && <Icon className="w-5 h-5 mr-2" />}
      {children}
      {Icon && iconPosition === 'right' && !loading && <Icon className="w-5 h-5 ml-2" />}
    </button>
  )
}

export default Button
