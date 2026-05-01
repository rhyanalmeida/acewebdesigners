import React from 'react'
import Section from '../ui/Section'
import Eyebrow from '../ui/Eyebrow'
import GradientHeading from '../ui/GradientHeading'
import Reveal from '../ui/Reveal'

export interface ProcessStep {
  title: string
  description: string
  icon?: React.ReactNode
}

interface ProcessStepsProps {
  eyebrow?: string
  heading: React.ReactNode
  accent?: React.ReactNode
  steps: ProcessStep[]
  tone?: 'default' | 'muted'
}

const ProcessSteps: React.FC<ProcessStepsProps> = ({
  eyebrow = 'How it works',
  heading,
  accent,
  steps,
  tone = 'default',
}) => (
  <Section tone={tone} padding="lg">
    <div className="text-center max-w-2xl mx-auto">
      <Eyebrow>{eyebrow}</Eyebrow>
      <GradientHeading level={2} size="lg" className="mt-5" accent={accent}>
        {heading}
      </GradientHeading>
    </div>

    <Reveal variant="stagger" className="mt-14 relative">
      <div
        className="hidden lg:block absolute top-7 left-[10%] right-[10%] h-px bg-gradient-to-r from-transparent via-ink-900/15 to-transparent"
        aria-hidden
      />
      <ol className="grid gap-8 lg:grid-cols-3 relative">
        {steps.map((step, i) => (
          <li
            key={i}
            data-reveal-stagger-child
            style={{ transitionDelay: `${i * 80}ms` }}
            className="text-center"
          >
            <span className="relative inline-flex h-14 w-14 items-center justify-center rounded-full bg-ink-900 text-cream-50 font-display text-base font-semibold ring-4 ring-cream-50">
              {String(i + 1).padStart(2, '0')}
            </span>
            <h3 className="mt-5 font-display text-xl font-semibold text-ink-900">{step.title}</h3>
            <p className="mt-2 text-ink-800 leading-relaxed">{step.description}</p>
          </li>
        ))}
      </ol>
    </Reveal>
  </Section>
)

export default ProcessSteps
