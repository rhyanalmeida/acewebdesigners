import React from 'react'

const inputBaseClass =
  'w-full px-4 py-3 bg-white border border-ink-900/15 rounded-xl text-ink-900 placeholder:text-ink-500/60 focus:outline-none focus:ring-2 focus:ring-rust-500/40 focus:border-rust-500 hover:border-ink-900/30 transition-[border-color,box-shadow,transform] duration-300 ease-premium motion-safe:focus:-translate-y-px'

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
