import React from 'react'

const inputBaseClass =
  'w-full px-4 py-3 bg-white border border-surface-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-transparent focus:outline-none transition-all duration-300 ease-premium'

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
