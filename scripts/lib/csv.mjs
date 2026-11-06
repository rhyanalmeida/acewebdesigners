// Minimal RFC-4180 CSV helpers for the newer list-pipeline scripts (verify-emails.mjs,
// instantly-remove-leads.mjs). Pure — no I/O — so csv.test.mjs covers them. Quoted fields,
// doubled quotes, CRLF, embedded commas / newlines. (The older scripts keep their inline copies;
// the column contract of every CSV is unchanged.)

/** Parse CSV text into rows of strings. Fully blank lines are dropped. */
export function parseCsv(text) {
  const rows = []
  let row = [], cell = '', q = false
  const src = String(text ?? '')
  for (let i = 0; i < src.length; i++) {
    const ch = src[i]
    if (q) {
      if (ch === '"') {
        if (src[i + 1] === '"') { cell += '"'; i++ } else q = false
      } else cell += ch
    } else if (ch === '"') q = true
    else if (ch === ',') { row.push(cell); cell = '' }
    else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && src[i + 1] === '\n') i++
      row.push(cell); rows.push(row); row = []; cell = ''
    } else cell += ch
  }
  if (cell.length || row.length) { row.push(cell); rows.push(row) }
  return rows.filter((r) => r.length > 1 || r[0] !== '')
}

/** Quote a cell only when it needs it (same rule as export-instantly.mjs / enrich-emails.mjs). */
export function csvEscape(v) {
  const s = String(v ?? '')
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

/** Rows → CSV text with a trailing newline. */
export function toCsv(rows) {
  return rows.map((r) => r.map(csvEscape).join(',')).join('\n') + '\n'
}

/** Index of the first header matching any candidate, case / punctuation-insensitive ("emails/0" ≡ "Emails 0"). */
export function findColumn(headers, ...names) {
  const norm = (h) => String(h ?? '').toLowerCase().replace(/[^a-z0-9]/g, '')
  const normalized = (headers ?? []).map(norm)
  for (const n of names) {
    const i = normalized.indexOf(norm(n))
    if (i >= 0) return i
  }
  return -1
}
