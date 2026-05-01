import React from 'react'
import { Helmet } from 'react-helmet-async'
import { getRouteMeta, type RouteMeta } from './routeMeta'

interface SeoMetaProps {
  /** The route path this page represents. Used to look up metadata. */
  path?: string
  /** Optional explicit override (skips the route-meta lookup). */
  override?: Partial<RouteMeta>
  /** Additional JSON-LD blocks to inject as <script type="application/ld+json"> tags. */
  jsonLd?: Array<Record<string, unknown>>
}

/**
 * Sets per-route <head> tags: title, meta description, canonical, OG, Twitter,
 * robots, and any provided JSON-LD blocks.
 *
 * Drop on every page component: `<SeoMeta path="/contractorlanding" jsonLd={[...]} />`.
 */
const SeoMeta: React.FC<SeoMetaProps> = ({ path, override, jsonLd }) => {
  const resolvedPath =
    path ?? (typeof window !== 'undefined' ? window.location.pathname : '/')
  const base = getRouteMeta(resolvedPath)
  const meta: RouteMeta = { ...base, ...override }

  return (
    <Helmet>
      <title>{meta.title}</title>
      <meta name="description" content={meta.description} />
      {meta.keywords && <meta name="keywords" content={meta.keywords} />}
      <meta name="robots" content={meta.robots ?? 'index, follow'} />
      <link rel="canonical" href={meta.canonical} />

      {/* Open Graph */}
      <meta property="og:type" content="website" />
      <meta property="og:title" content={meta.title} />
      <meta property="og:description" content={meta.description} />
      <meta property="og:url" content={meta.canonical} />
      {meta.ogImage && <meta property="og:image" content={meta.ogImage} />}
      <meta property="og:site_name" content="Ace Web Designers" />

      {/* Twitter / X */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={meta.title} />
      <meta name="twitter:description" content={meta.description} />
      {meta.ogImage && <meta name="twitter:image" content={meta.ogImage} />}

      {/* JSON-LD blocks */}
      {jsonLd?.map((block, i) => (
        <script key={i} type="application/ld+json">
          {JSON.stringify(block)}
        </script>
      ))}
    </Helmet>
  )
}

export default SeoMeta
