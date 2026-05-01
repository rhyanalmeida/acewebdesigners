import React from 'react'
import { Check, X, Minus } from 'lucide-react'
import Section from '../ui/Section'
import Eyebrow from '../ui/Eyebrow'
import GradientHeading from '../ui/GradientHeading'

type Cell = 'yes' | 'no' | 'partial' | string

export interface ComparisonRow {
  feature: string
  diy: Cell
  freelancer: Cell
  agency: Cell
  ace: Cell
}

interface ComparisonTableProps {
  eyebrow?: string
  heading?: React.ReactNode
  accent?: React.ReactNode
  rows?: ComparisonRow[]
}

const DEFAULT_ROWS: ComparisonRow[] = [
  { feature: 'Free design before you pay',     diy: 'no',      freelancer: 'partial', agency: 'no',      ace: 'yes' },
  { feature: 'Built for contractors',          diy: 'no',      freelancer: 'partial', agency: 'partial', ace: 'yes' },
  { feature: 'Same-day launch available',      diy: 'partial', freelancer: 'no',      agency: 'no',      ace: 'yes' },
  { feature: 'Local SEO + Google Business',    diy: 'no',      freelancer: 'partial', agency: 'yes',     ace: 'yes' },
  { feature: 'Manages your social posts',      diy: 'no',      freelancer: 'no',      agency: 'partial', ace: 'yes' },
  { feature: 'Ongoing support included',       diy: 'no',      freelancer: 'no',      agency: 'yes',     ace: 'yes' },
  { feature: 'Combo pricing (web + social)',   diy: 'no',      freelancer: 'no',      agency: 'no',      ace: 'yes' },
]

const renderCell = (cell: Cell, isAce = false) => {
  if (cell === 'yes') {
    return (
      <Check
        className={`mx-auto h-5 w-5 ${isAce ? 'text-rust-300' : 'text-forest-600'}`}
        aria-label="Yes"
      />
    )
  }
  if (cell === 'no') {
    return <X className="mx-auto h-5 w-5 text-ink-700/40" aria-label="No" />
  }
  if (cell === 'partial') {
    return <Minus className="mx-auto h-5 w-5 text-amber-500" aria-label="Partial" />
  }
  return <span className="text-sm">{cell}</span>
}

const ComparisonTable: React.FC<ComparisonTableProps> = ({
  eyebrow = 'Why Ace',
  heading = 'How we stack up',
  accent = 'against the alternatives',
  rows = DEFAULT_ROWS,
}) => (
  <Section tone="default" padding="lg">
    <div className="text-center max-w-2xl mx-auto">
      <Eyebrow tone="brand">{eyebrow}</Eyebrow>
      <GradientHeading level={2} size="lg" className="mt-5" accent={accent}>
        {heading}
      </GradientHeading>
    </div>

    <div className="mt-12 max-w-5xl mx-auto overflow-x-auto">
      <table className="w-full border-separate border-spacing-0 text-sm sm:text-base">
        <thead>
          <tr>
            <th
              scope="col"
              className="text-left font-display font-semibold text-ink-900 px-4 py-3 align-bottom"
            >
              <span className="label-mono text-ink-700/70">Feature</span>
            </th>
            <th scope="col" className="px-3 py-3 text-center font-display font-medium text-ink-700">
              DIY (Wix/Squarespace)
            </th>
            <th scope="col" className="px-3 py-3 text-center font-display font-medium text-ink-700">
              Cheap freelancer
            </th>
            <th scope="col" className="px-3 py-3 text-center font-display font-medium text-ink-700">
              Big agency
            </th>
            <th
              scope="col"
              className="rounded-t-xl2 bg-ink-900 text-cream-50 px-3 py-3 text-center font-display font-semibold"
            >
              Ace (combo)
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => {
            const isLast = i === rows.length - 1
            return (
              <tr key={row.feature}>
                <th
                  scope="row"
                  className={`text-left font-medium text-ink-900 px-4 py-3 border-t border-ink-900/10 ${
                    i === 0 ? 'border-t-0' : ''
                  }`}
                >
                  {row.feature}
                </th>
                <td
                  className={`text-center px-3 py-3 border-t border-ink-900/10 ${
                    i === 0 ? 'border-t-0' : ''
                  }`}
                >
                  {renderCell(row.diy)}
                </td>
                <td
                  className={`text-center px-3 py-3 border-t border-ink-900/10 ${
                    i === 0 ? 'border-t-0' : ''
                  }`}
                >
                  {renderCell(row.freelancer)}
                </td>
                <td
                  className={`text-center px-3 py-3 border-t border-ink-900/10 ${
                    i === 0 ? 'border-t-0' : ''
                  }`}
                >
                  {renderCell(row.agency)}
                </td>
                <td
                  className={`text-center px-3 py-3 bg-ink-900 text-cream-50 ${
                    isLast ? 'rounded-b-xl2' : ''
                  } border-t border-cream-50/10 ${i === 0 ? 'border-t-0' : ''}`}
                >
                  {renderCell(row.ace, true)}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>

    <p className="mt-8 text-center text-sm text-ink-700/70 max-w-xl mx-auto">
      One team. One price. Free design, then a website + social plan that fits how contractors
      actually run.
    </p>
  </Section>
)

export default ComparisonTable
