import React from 'react'

/**
 * A photo slot.
 *
 * Rhyan is supplying real job-site photos (bathrooms, decks, tools, hands
 * working) and a photo of him and Valerie. Until those land, this renders
 * NOTHING — `src` is optional and an empty slot collapses completely rather
 * than showing a grey box, a spinner, or a "photo coming soon" placeholder.
 *
 * That is deliberate. A visible placeholder ships as a broken promise, and the
 * one thing this site cannot afford is looking unfinished while arguing that
 * lazy work is the problem. An absent section is honest; a stock photo standing
 * in for a real client is exactly what got the old site called fake.
 *
 * NEVER pass a stock or generated image to this component.
 *
 * `treatment="duotone"` exists because client photos arrive from a dozen
 * different phones in a dozen different lightings. Forcing them to hard
 * greyscale with a red lift unifies the set without pretending they were shot
 * by the same person on the same day.
 */

type Treatment = 'none' | 'duotone' | 'mono'

interface FigureProps {
  /** Omit until a real photograph exists. The slot collapses when absent. */
  src?: string
  /** Required whenever src is set. Describe the actual work in the photo. */
  alt?: string
  /** Mono metadata line under the image — location, trade, date. */
  caption?: string
  /** Small mono index, e.g. "01". Pairs with the ruled-row numbering. */
  index?: string
  treatment?: Treatment
  /** Tailwind aspect utility, e.g. "aspect-[4/5]". */
  aspect?: string
  className?: string
}

const TREATMENTS: Record<Treatment, string> = {
  none: '',
  mono: 'grayscale contrast-[1.15]',
  duotone: 'grayscale contrast-[1.2] sepia-[0.25] hue-rotate-[-20deg] saturate-[1.4]',
}

const Figure: React.FC<FigureProps> = ({
  src,
  alt,
  caption,
  index,
  treatment = 'mono',
  aspect = 'aspect-[4/3]',
  className = '',
}) => {
  // No photograph yet — render nothing at all.
  if (!src) return null

  return (
    <figure className={className}>
      <div className={`overflow-hidden border border-ink-900/20 bg-cream-200 ${aspect}`}>
        <img
          src={src}
          alt={alt ?? ''}
          className={`block h-full w-full object-cover ${TREATMENTS[treatment]}`}
          loading="lazy"
          decoding="async"
        />
      </div>
      {(caption || index) && (
        <figcaption className="mt-3 flex items-baseline gap-3">
          {index && <span className="label-num text-ink-700/50">{index}</span>}
          {caption && <span className="label-mono text-ink-700/70">{caption}</span>}
        </figcaption>
      )}
    </figure>
  )
}

export default Figure
