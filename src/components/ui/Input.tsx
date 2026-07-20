import React from 'react'

const inputBaseClass =
  'w-full px-4 py-3 bg-cream-50 border border-ink-900/30 text-ink-900 placeholder:text-ink-500/70 focus:outline-none focus:border-signal-500 focus:ring-1 focus:ring-signal-500 hover:border-ink-900/50 transition-[border-color] duration-150 ease-out'

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className = '', ...rest }, ref) => (
    <input ref={ref} className={`${inputBaseClass} ${className}`} {...rest} />
  )
)
Input.displayName = 'Input'

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className = '', ...rest }, ref) => (
  <textarea ref={ref} className={`${inputBaseClass} ${className}`} {...rest} />
))
Textarea.displayName = 'Textarea'

export default Input
