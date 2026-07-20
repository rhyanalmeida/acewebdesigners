import React from 'react'
import { Plus, Minus } from 'lucide-react'
import Section from '../ui/Section'
import Eyebrow from '../ui/Eyebrow'
import GradientHeading from '../ui/GradientHeading'

export interface FaqItem {
  question: string
  answer: React.ReactNode
}

interface LandingFaqProps {
  eyebrow?: string
  heading: React.ReactNode
  accent?: React.ReactNode
  items: FaqItem[]
}

const LandingFaq: React.FC<LandingFaqProps> = ({
  eyebrow = 'Questions',
  heading,
  accent,
  items,
}) => {
  const [openIndex, setOpenIndex] = React.useState<number | null>(null)

  return (
    <Section tone="default" padding="lg" containerSize="md">
      <div className="max-w-2xl">
        <Eyebrow>{eyebrow}</Eyebrow>
        <GradientHeading level={2} size="lg" className="mt-5" accent={accent}>
          {heading}
        </GradientHeading>
      </div>

      <div className="mt-12 border-t border-ink-900/10">
        {items.map((item, i) => {
          const isOpen = openIndex === i
          return (
            <div key={i} className="border-b border-ink-900/10">
              <button
                type="button"
                aria-expanded={isOpen}
                aria-controls={`faq-panel-${i}`}
                id={`faq-trigger-${i}`}
                onClick={() => setOpenIndex(isOpen ? null : i)}
                className="w-full flex items-start justify-between gap-4 py-6 text-left ring-focus-signal"
              >
                <span className="font-display font-semibold text-base sm:text-lg text-ink-900">
                  {item.question}
                </span>
                <span className="shrink-0 mt-1 text-signal-600">
                  {isOpen ? <Minus className="h-5 w-5" aria-hidden /> : <Plus className="h-5 w-5 text-ink-700/60" aria-hidden />}
                </span>
              </button>
              <div
                id={`faq-panel-${i}`}
                role="region"
                aria-labelledby={`faq-trigger-${i}`}
                className={`grid transition-[grid-template-rows] duration-500 ease-premium ${isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}
              >
                <div className="overflow-hidden">
                  <div className="pb-6 -mt-1 text-ink-800 leading-relaxed max-w-3xl">
                    {item.answer}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </Section>
  )
}

export default LandingFaq
