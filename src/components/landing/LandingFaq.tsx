import React from 'react'
import { Plus, Minus } from 'lucide-react'
import Section from '../ui/Section'
import Eyebrow from '../ui/Eyebrow'
import GradientHeading from '../ui/GradientHeading'
import Reveal from '../ui/Reveal'

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
      <div className="text-center">
        <Eyebrow>{eyebrow}</Eyebrow>
        <GradientHeading level={2} size="lg" className="mt-4" accent={accent}>
          {heading}
        </GradientHeading>
      </div>

      <Reveal variant="up" className="mt-12 space-y-3">
        {items.map((item, i) => {
          const isOpen = openIndex === i
          return (
            <div
              key={i}
              className={`rounded-xl2 ring-1 transition-all duration-500 ease-premium ${
                isOpen
                  ? 'bg-white ring-brand-200 shadow-soft'
                  : 'bg-surface-50 ring-surface-200 hover:ring-surface-300'
              }`}
            >
              <button
                type="button"
                aria-expanded={isOpen}
                aria-controls={`faq-panel-${i}`}
                id={`faq-trigger-${i}`}
                onClick={() => setOpenIndex(isOpen ? null : i)}
                className="w-full flex items-center justify-between gap-4 p-5 sm:p-6 text-left ring-focus-brand rounded-xl2"
              >
                <span className="font-display font-semibold text-base sm:text-lg text-surface-900">
                  {item.question}
                </span>
                <span className={`shrink-0 inline-flex h-8 w-8 items-center justify-center rounded-full transition-colors ${isOpen ? 'bg-brand-500 text-white' : 'bg-white text-surface-700 ring-1 ring-surface-200'}`}>
                  {isOpen ? <Minus className="h-4 w-4" aria-hidden /> : <Plus className="h-4 w-4" aria-hidden />}
                </span>
              </button>
              <div
                id={`faq-panel-${i}`}
                role="region"
                aria-labelledby={`faq-trigger-${i}`}
                className={`grid transition-[grid-template-rows] duration-500 ease-premium ${isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}
              >
                <div className="overflow-hidden">
                  <div className="px-5 sm:px-6 pb-5 sm:pb-6 text-surface-600 leading-relaxed">
                    {item.answer}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </Reveal>
    </Section>
  )
}

export default LandingFaq
