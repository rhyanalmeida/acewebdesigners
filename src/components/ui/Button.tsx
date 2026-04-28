import React from 'react'
import { LucideIcon } from 'lucide-react'

type Variant = 'primary' | 'brand' | 'secondary' | 'outline' | 'ghost' | 'link' | 'inverted'
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
  'inline-flex items-center justify-center font-semibold rounded-full transition-all duration-300 ease-premium disabled:opacity-50 disabled:cursor-not-allowed ring-focus-brand'

const variantClasses: Record<Variant, string> = {
  // Legacy primary kept identical so existing pages don't shift visually
  primary:
    'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 hover:scale-105 shadow-lg hover:shadow-xl',
  // New premium variant — use this in redesigned pages
  brand:
    'bg-brand-gradient text-white shadow-glow-brand hover:shadow-lift',
  secondary:
    'bg-surface-800 text-white hover:bg-surface-900 shadow-soft hover:shadow-lift',
  outline:
    'border-2 border-surface-300 text-surface-700 hover:border-brand-500 hover:text-brand-700 hover:bg-brand-50',
  ghost:
    'text-surface-700 hover:text-brand-700 hover:bg-brand-50',
  link:
    'text-brand-700 underline-offset-4 hover:underline px-0 py-0 rounded-none shadow-none',
  inverted:
    'bg-white text-surface-900 hover:bg-surface-100 shadow-soft hover:shadow-lift',
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
