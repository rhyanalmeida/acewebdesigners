import React from 'react'
import Marquee from './Marquee'

interface LogoStripProps {
  logos: Array<{ name: string; node: React.ReactNode }>
  scrolling?: boolean
  className?: string
  label?: string
}

const LogoStrip: React.FC<LogoStripProps> = ({ logos, scrolling, className = '', label }) => {
  const useMarquee = scrolling ?? logos.length > 6
  const items = (
    <>
      {logos.map(l => (
        <div
          key={l.name}
          title={l.name}
          className="grayscale opacity-70 hover:opacity-100 hover:grayscale-0 transition-[opacity,filter] duration-500 ease-premium flex items-center"
        >
          {l.node}
        </div>
      ))}
    </>
  )

  return (
    <div className={className}>
      {label && (
        <p className="text-center text-xs font-semibold tracking-[0.2em] uppercase text-surface-500 mb-6">
          {label}
        </p>
      )}
      {useMarquee ? (
        <Marquee>{items}</Marquee>
      ) : (
        <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-12">{items}</div>
      )}
    </div>
  )
}

export default LogoStrip
