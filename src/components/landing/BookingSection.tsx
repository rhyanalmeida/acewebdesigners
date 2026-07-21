import React from 'react'
import Section, { type SectionPadding } from '../ui/Section'
import Eyebrow from '../ui/Eyebrow'
import GradientHeading from '../ui/GradientHeading'
import TrustStack from '../ui/TrustStack'
import { BookingWidget } from '../BookingWidget'
import { CalendarConfig } from '../../config/calendars'

interface BookingSectionProps {
  /** External ref so parent can scroll-to. Forwarded onto the <section>. */
  sectionRef?: React.Ref<HTMLElement>
  eyebrow?: string
  heading: React.ReactNode
  accent?: React.ReactNode
  sub?: React.ReactNode
  calendarConfig: CalendarConfig
  containerId: string
  /** Hidden tracker element (preserves existing data-conversion-type attribute). */
  conversionType?: string
  trackerId?: string
  reminder?: React.ReactNode
  /** 3-bullet "what to expect on the call" block rendered above the calendar. */
  whatToExpect?: string[]
  /** Soft scarcity microcopy rendered just above the calendar (no numbers). */
  scarcityNote?: React.ReactNode
  /** Opt-in value panel beside the form (lg+) / below it (mobile). Omit and the
   *  section renders exactly as it did before the prop existed. */
  valueItems?: string[]
  valueTitle?: string
  padding?: SectionPadding
}

/**
 * Editorial-styled wrapper around BookingWidget.
 * BookingWidget itself is rendered with the same props as the existing
 * landing pages — calendar config and container ID. Conversions are
 * server-side via GHL, so there's no booking-completion callback here;
 * this wrapper only adds the surrounding markup.
 */
const BookingSection = React.forwardRef<HTMLElement, BookingSectionProps>(
  (
    {
      sectionRef,
      eyebrow = 'Book your spot',
      heading,
      accent,
      sub,
      calendarConfig,
      containerId,
      conversionType,
      trackerId,
      reminder,
      whatToExpect,
      scarcityNote,
      valueItems,
      valueTitle = "What you'll receive",
      padding = 'lg',
    },
    forwardedRef
  ) => {
    // Merge forwardedRef + sectionRef
    const setRef = React.useCallback(
      (node: HTMLElement | null) => {
        if (typeof forwardedRef === 'function') forwardedRef(node)
        else if (forwardedRef) (forwardedRef as React.MutableRefObject<HTMLElement | null>).current = node
        if (typeof sectionRef === 'function') sectionRef(node)
        else if (sectionRef) (sectionRef as React.MutableRefObject<HTMLElement | null>).current = node
      },
      [forwardedRef, sectionRef]
    )

    return (
      <Section
        as="section"
        tone="muted"
        padding={padding}
        containerSize="md"
        ref={setRef}
        className="scroll-mt-24"
      >
        <div className="text-center">
          <Eyebrow>{eyebrow}</Eyebrow>
          <GradientHeading level={2} size="lg" className="mt-5" accent={accent}>
            {heading}
          </GradientHeading>
          {sub && <p className="mt-5 text-base sm:text-lg text-ink-700 max-w-2xl mx-auto leading-relaxed">{sub}</p>}
          <div className="mt-8 flex justify-center">
            <TrustStack />
          </div>
        </div>

        {/* Form first — the CTA drops visitors here; supporting copy reads below.
            The value panel is second in the DOM on purpose: on mobile it stacks
            BELOW the form, so form-first order survives the two-column layout. */}
        <div className="mt-8 grid gap-6 lg:grid-cols-[1.6fr_1fr] lg:items-start">
          <div className="bg-cream-50 border border-ink-900/15 shadow-lift p-3 sm:p-6 md:p-10">
            <BookingWidget
              calendarConfig={calendarConfig}
              containerId={containerId}
            />
          </div>

          {valueItems && valueItems.length > 0 && (
            <div className="bg-cream-50 border border-ink-900/15 p-5 sm:p-6">
              <p className="label-mono text-ink-700/70">{valueTitle}</p>
              <ul className="mt-4 space-y-3">
                {valueItems.map(item => (
                  <li
                    key={item}
                    className="flex items-start gap-2 text-sm sm:text-base text-ink-800 leading-relaxed"
                  >
                    <span
                      aria-hidden
                      className="mt-1.5 inline-block h-2 w-2 shrink-0 bg-signal-500"
                    />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {scarcityNote && (
          <p className="mt-6 text-center text-sm text-ink-700/80 max-w-2xl mx-auto">
            {scarcityNote}
          </p>
        )}

        {whatToExpect && whatToExpect.length > 0 && (
          <div className="mt-6 mx-auto max-w-3xl">
            <div className="bg-cream-50 border border-ink-900/15 p-5 sm:p-6">
              <p className="label-mono text-ink-700/70 text-center">What to expect on the call</p>
              <ul className="mt-4 grid gap-3 sm:grid-cols-3">
                {whatToExpect.map((item, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-sm sm:text-base text-ink-800 leading-relaxed"
                  >
                    <span
                      aria-hidden
                      className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center bg-signal-500 text-white text-xs font-semibold"
                    >
                      {i + 1}
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {reminder && (
          <div className="mt-6 text-center">
            <p className="inline-block max-w-2xl text-sm text-ink-800 bg-cream-50 border border-ink-900/15 border-l-4 border-l-signal-500 p-4 text-left">
              {reminder}
            </p>
          </div>
        )}

        {/* Hidden conversion tracker — preserves existing data-conversion-type hook */}
        {conversionType && (
          <div
            id={trackerId}
            style={{ display: 'none' }}
            data-conversion-type={conversionType}
          />
        )}
      </Section>
    )
  }
)

BookingSection.displayName = 'BookingSection'

export default BookingSection
