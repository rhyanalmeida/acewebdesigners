import React from 'react'

interface MarqueeProps extends React.HTMLAttributes<HTMLDivElement> {
  pauseOnHover?: boolean
  fade?: boolean
}

/**
 * Pure CSS infinite marquee. Children are duplicated once for seamless looping.
 * The .marquee-track utility (in index.css) handles the keyframe.
 */
const Marquee: React.FC<MarqueeProps> = ({
  pauseOnHover = true,
  fade = true,
  className = '',
  children,
  ...rest
}) => (
  <div
    className={`relative overflow-hidden ${fade ? '[mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]' : ''} ${className}`}
    aria-hidden
    {...rest}
  >
    <div className={`marquee-track ${pauseOnHover ? '' : 'pointer-events-none'}`}>
      <div className="flex shrink-0 items-center gap-12 pr-12">{children}</div>
      <div className="flex shrink-0 items-center gap-12 pr-12">{children}</div>
    </div>
  </div>
)

export default Marquee
