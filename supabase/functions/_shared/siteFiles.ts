/**
 * Model-output ↔ site-file helpers shared by generate-site (build) and site-edit
 * (post-purchase change requests). The model prints files behind marker lines:
 *   ===== FILE: index.html =====
 * and we split them into Netlify's { "/path": content } shape.
 */

export const FILE_MARKER = /^=====\s*FILE:\s*([\w./-]+)\s*=====\s*$/gm

/** Split model output on FILE markers into { "/name": content }. */
export function parseFiles(raw: string): Record<string, string> {
  const out: Record<string, string> = {}
  const matches = [...raw.matchAll(FILE_MARKER)]
  for (let i = 0; i < matches.length; i++) {
    const m = matches[i]
    const start = (m.index ?? 0) + m[0].length
    const end = i + 1 < matches.length ? matches[i + 1].index! : raw.length
    const name = m[1].replace(/^\/+/, '')
    const content = raw.slice(start, end).trim()
    if (name && content) out[`/${name}`] = content
  }
  return out
}

/** Drop a single wrapping ``` fence if the model added one despite instructions. */
export function stripFences(raw: string): string {
  let s = raw.trim()
  if (s.startsWith('```')) {
    s = s.replace(/^```[a-z]*\s*/i, '').replace(/```\s*$/, '').trim()
  }
  return s
}

/** Render { "/path": content } back into marker form for a prompt. */
export function renderFiles(files: Record<string, string>): string {
  return Object.entries(files)
    .map(([p, c]) => `===== FILE: ${p.replace(/^\/+/, '')} =====\n${c}`)
    .join('\n\n')
}
