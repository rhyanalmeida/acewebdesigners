import React from 'react'
import Section from '../ui/Section'
import Eyebrow from '../ui/Eyebrow'
import GradientHeading from '../ui/GradientHeading'

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
    <div className="max-w-2xl">
      <Eyebrow>{eyebrow}</Eyebrow>
      <GradientHeading level={2} size="lg" className="mt-5" accent={accent}>
        {heading}
      </GradientHeading>
    </div>

    <div className="mt-14 relative">
      <div
        className="hidden lg:block absolute top-7 left-[10%] right-[10%] h-px bg-ink-900/15"
        aria-hidden
      />
      <ol className="grid gap-8 lg:grid-cols-3 relative">
        {steps.map((step, i) => (
          <li
            key={i}
            className="text-center"
          >
            <span className="relative inline-flex h-14 w-14 items-center justify-center bg-ink-900 text-cream-50 font-mono text-base font-medium tracking-[0.04em] ring-4 ring-cream-50">
              {String(i + 1).padStart(2, '0')}
            </span>
            <h3 className="mt-5 font-display text-xl font-semibold text-ink-900">{step.title}</h3>
            <p className="mt-2 text-ink-800 leading-relaxed">{step.description}</p>
          </li>
        ))}
      </ol>
    </div>
  </Section>
)

export default ProcessSteps
