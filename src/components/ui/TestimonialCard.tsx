import React from 'react'
import { Star } from 'lucide-react'
import Card from './Card'

interface TestimonialCardProps {
  quote: string
  authorName: string
  authorRole?: string
  rating?: 1 | 2 | 3 | 4 | 5
  resultMetric?: string
  avatarUrl?: string
  avatarInitial?: string
  className?: string
}

const TestimonialCard: React.FC<TestimonialCardProps> = ({
  quote,
  authorName,
  authorRole,
  rating = 5,
  resultMetric,
  avatarUrl,
  avatarInitial,
  className = '',
}) => (
  <Card tone="default" padding="lg" rounded="xl2" interactive shine className={className}>
    <div className="flex items-center gap-1 text-accent-500" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: rating }).map((_, i) => (
        <Star key={i} className="h-4 w-4 fill-current" aria-hidden />
      ))}
    </div>
    <blockquote className="mt-4 text-surface-800 leading-relaxed">
      &ldquo;{quote}&rdquo;
    </blockquote>
    {resultMetric && (
      <p className="mt-4 text-sm font-semibold text-brand-700">{resultMetric}</p>
    )}
    <div className="mt-6 flex items-center gap-3 border-t border-surface-200 pt-4">
      {avatarUrl ? (
        <img src={avatarUrl} alt="" className="h-10 w-10 rounded-full object-cover ring-2 ring-white shadow-soft" loading="lazy" />
      ) : (
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-brand-gradient text-white font-semibold ring-2 ring-white shadow-soft" aria-hidden>
          {avatarInitial ?? authorName.charAt(0).toUpperCase()}
        </span>
      )}
      <div className="leading-tight">
        <div className="font-semibold text-surface-900">{authorName}</div>
        {authorRole && <div className="text-sm text-surface-500">{authorRole}</div>}
      </div>
    </div>
  </Card>
)

export default TestimonialCard
