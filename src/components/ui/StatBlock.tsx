import React from 'react'

interface StatBlockProps {
  value: string
  label: string
  sub?: string
  tone?: 'default' | 'inverted'
  align?: 'left' | 'center'
  className?: string
}

const StatBlock: React.FC<StatBlockProps> = ({
  value,
  label,
  sub,
  tone = 'default',
  align = 'left',
  className = '',
}) => (
  <div className={`flex flex-col ${align === 'center' ? 'items-center text-center' : ''} ${className}`}>
    <span
      className={`font-display font-bold tracking-tight text-4xl sm:text-5xl ${
        tone === 'inverted' ? 'text-white' : 'text-gradient-brand'
      }`}
    >
      {value}
    </span>
    <span className={`mt-2 text-sm font-semibold uppercase tracking-[0.15em] ${tone === 'inverted' ? 'text-white/70' : 'text-surface-500'}`}>
      {label}
    </span>
    {sub && (
      <span className={`mt-1 text-sm ${tone === 'inverted' ? 'text-white/60' : 'text-surface-500'}`}>{sub}</span>
    )}
  </div>
)

export default StatBlock
