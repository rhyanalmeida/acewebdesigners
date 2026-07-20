# Redesign Plan — making the site look designed, not generated

Companion to `docs/CREDIBILITY_PLAN_2026-07-20.md` (truthfulness fixes, already shipped) and
`docs/REAL_TESTIMONIALS.md` (verified social proof).

---

## 0. A correction to the earlier analysis — the palette IS part of the tell

I previously wrote, twice, that the palette was fine and the problem was purely composition. **That was
about 70% right and 30% wrong in a way that matters.**

Kyle Chayka has documented an emergent "[generic style of AI web design](https://kylechayka.substack.com/p/the-generic-style-of-ai-web-design)"
whose signature is specifically: **cream and beige grounds, rust-orange accents, large serif display
type — often italicised for emphasis — and letter-spaced tracked-out subheadings.**

That is a precise description of our design system. Cream + ink + rust + Fraunces with an italic rust
accent word was a genuinely good, differentiated choice in 2024. In 2026 it reads as the **factory
default of the exact tool we're accused of using.** Rust is Claude's own brand colour.

So *"clearly made with Claude"* was not a lazy insult. Those commenters were pattern-matching on a
real, documented signature, and our tokens sit dead centre of it.

We do not have to abandon warmth. We have to break the **silhouette**:

| Token | Now | Change to | Why |
|---|---|---|---|
| Ground | `cream-50 #FBF7F0` | `#FAF8F4` (warmer, off-signature) or a cooler `#F7F7F7` | keeps paper feel, leaves the beige signature |
| Ink | `ink-900 #1A1611` | `#404040` for body; never pure black | reference studios universally avoid `#000` |
| Accent | `rust-500 #C04E1A` | **one decisive non-rust colour** — deep red `#A00909`, orange `#FF6500`, or navy `#10286F` | rust is the single most-named tell |
| Emphasis | italic Fraunces accent word | **stop.** Use weight, size or a rule instead | italic serif headings appear in every tell-list |

One accent. Never a gradient. This is the change with the highest signal-to-effort ratio on this
document.

*Confidence note:* Chayka is one critic, and this association may fade. But he is the critic the
developer commentariat reads, and the accusation we actually received matches his description almost
word for word. Treat as high-confidence.

---

## 1. Portfolio curation — an honest ranking

Seven live client sites, all verified 200 OK and screenshotted (`public/work/*.webp`).

**⚠️ First, a real bug:** `src/Work.tsx` links Dunn Construction to **`dunnconstruction.com`**, which
is *"Dunn Construction | Birmingham Alabama"* — an unrelated company. The real client is
**`dunnconstructionma.com`** ("Crafted Outdoor Living, Green Harbor MA"). We have been sending
portfolio traffic to a stranger's business.

### Lead with these

**1. Dunn Construction — `dunnconstructionma.com`** — the strongest work we have. Dark cinematic
ground, real project photography, gold accent, confident serif display, genuine editorial restraint.
This should be the hero of the work section.

**2. Conuco Takeout — `conucotakeout.com`** — full-bleed food photography, a real EN/ES language
toggle, and numbered editorial sections (`01 — BIENVENIDA`). Also the one client with a real,
signed Google review from owner Pedro Dipre-Rojas, so image and testimonial genuinely pair.

**3. Told History — `toldhistory.com`** — cohesive brand world, distinctive display type, real
product identity. Solid third.

### Do not feature these — they would confirm the accusation

| Site | Problem |
|---|---|
| **Chess Teaching USA** | The hero is an **obviously AI-generated composite** — a doctor, a businessman and a cityscape collaged over a chessboard, with a malformed reflected face. Showing this to an audience already shouting "AI slop" hands them the evidence. |
| **Champona Champona** | Purple-to-pink gradient wordmark, pill badge with a heart glyph, tilted card on a soft gradient glow, Inter throughout. This is the single most AI-looking site of the seven. |
| **Hot Pot One** | Hero image is heavily compression-damaged — visible blocking artifacts at full width. This is what *"did y'all do a QA check?"* looks like. |
| **Oliver's Cafe** | Hero image doesn't load at all — a grey block where the photograph should be. Broken, today, in production. |

**Recommendation:** show three excellent pieces, not seven uneven ones. A tight portfolio reads as
selective; a comprehensive one reads as undiscriminating. Middle Name and Otherkind (see §3) both win
trust by showing *less*.

Separately: Hot Pot One's compression and Oliver's missing hero are **live client-site bugs**. Worth
fixing for their sake regardless of what we feature.

---

## 2. What the developers were actually pattern-matching

From practitioner tell-lists ([utsubo](https://www.utsubo.com/blog/built-with-ai-trust-signals-2026),
[925studios](https://www.925studios.co/blog/ai-slop-web-design-guide)), scored against our site:

| Tell | Us |
|---|---|
| "Three equal cards, 16px radius, same 24px padding repeated down the page" | **direct hit** — 8 card grids |
| Identical spacing rhythm, no hierarchy through variation | **direct hit** — `padding="lg"` on nearly every section |
| Centred hero copy, centred everything | **direct hit** — `SectionHeading` defaults to centre, never overridden |
| Lucide icon in a rounded-square tint tile | **direct hit** — `IconTile` on 6 pages |
| Inter with no deliberate pairing | partial — we pair it, but Inter is the flagship tell |
| Italic serif headings | **direct hit** |
| Indigo→violet gradient | clean on the marketing site; still in `tailwind.config.js` and the admin |
| Uniform scroll fade-ins, same timing everywhere | **direct hit** |
| Emoji bullets / emoji as icons | **direct hit** — `🍽️ 🏗️ ⚕️` |
| Generic alt text, missing OG images | needs audit — this is what *"QA check"* meant |

Worth noting the dissent: one Hacker News commenter points out that *"people were complaining about
every startup website using the same shadcn format for years before AI-assisted design."* The
homogeneity predates AI; "slop" is partly a new name for template sameness. The fix is identical
either way — actually art-direct — so don't over-index on hiding AI versus designing well.

---

## 3. What to steal, from studios that get this right

All verified live. The pattern across them, ranked by signal per hour:

1. **Flat type scales.** Five of these cap at 16–28px. Komma Komma runs 68 / 57.6 / 24.8 / 14 — one
   enormous jump then a long flat tail. Tailwind's reflex is a smooth `text-6xl` ramp; **that reflex
   is the tell.**
2. **Off-white grounds, never `#FFF`. Ink at `#404040`, never `#000`.**
3. **Exactly one accent colour. Never a gradient.**
4. **Monospace for metadata only** — years, categories, counters. Never body.
5. **Parenthesised or coded numbering** — `(01)`, `S01`, `23.CS`. Costs nothing.
6. **Case studies titled as verb phrases about what you did** — Collection Industries: *"We brought
   the braaap back."* Free, and the highest-signal item on this list.
7. **Work as a text index, not a thumbnail grid** — subtractive, reads as confident.
8. **A live local-time clock** — ~20 lines of JS, reads instantly as hand-made.

Reference sites worth studying, closest-fit first:

- **[bureaurouge.com](https://bureaurouge.com)** — serif *body*, mono metadata, largest text 16px,
  `#FDFDFA` paper / `#404040` ink / one blood red `#A00909`. Case rows: title / CLIENT IN CAPS / year.
- **[designsystems.international](https://designsystems.international)** — letter-spaced wordmark
  stretched across the header instead of a logo; every case study opens with real written prose.
- **[kommakomma.is](https://kommakomma.is)** — services as `(01) Brand Strategy` … `(05) Website
  Development`, each with a three-line rationale.
- **[otherkind.design](https://otherkind.design)** — no type scale at all; hierarchy purely from
  whitespace and position. Work is a plain text index.
- **[burnstudio.co](https://burnstudio.co)** — sections coded `S01`, projects `23.CS` in mono.
- **[middlename.co.uk](https://middlename.co.uk)** — one typeface, no accent colour, 28px ceiling.
- **[collection.industries](https://collection.industries)** — first-person verb-phrase case titles.

---

## 4. Typography

**Now reading as AI-coded:** Inter (flagship), Geist, Instrument Sans, Inter Display. Plus Jakarta
Sans, Manrope and DM Sans are the *next* wave of generic — don't jump there.

**Body faces that pair with Fraunces and read designed** (all Google Fonts):

- **Source Serif 4** — serif-on-serif. The most editorially credible option and the *least*
  AI-adjacent, because almost nothing generated uses serif body text.
- **Hanken Grotesk** — strong x-height, genuinely under-used, more character than Inter.
- **Bricolage Grotesque** — most personality; variable and slightly odd.
- **Lora** — warm, proven long-read serif.

**Add a monospace for metadata** — JetBrains Mono / IBM Plex Mono / Space Mono, used *only* for years,
categories, counters, section codes. This does more work than the body face choice.

Two moves that matter more than which face wins:
1. **Flatten the scale** to one big jump plus a flat tail.
2. **Stop italicising Fraunces for emphasis.**

---

## 5. Layout techniques, in Tailwind

- **Arbitrary asymmetric tracks:** `grid-cols-[200px_minmax(900px,_1fr)_100px]` — the core escape
  hatch; editorial grids without leaving Tailwind.
- **Explicit placement, not spans:** `col-start-2 col-end-8`. Spans alone still produce symmetry;
  start/end produces asymmetry.
- **Deliberately unequal columns.** A grid that is ~8px "off" reads hand-made; a perfect one reads
  generated.
- **Full-bleed inside a contained page:** container gets `grid-cols-[1fr_min(65ch,100%)_1fr]`, bleed
  children take `col-span-full`. Cleaner than the `w-screen ml-[calc(50%-50vw)]` hack.
- **Marginalia:** 12-col grid, body at `col-start-3 col-end-9`, notes at `col-start-10 col-end-12` in
  `text-xs font-mono`.
- **Overlap:** negative margins plus `z-10` where two children share a `col-start`/`row-start`.
- **Sticky editorial case study:** `sticky top-0 h-screen` left column against a scrolling right
  column. No library.

**Motion:** vary duration and easing per section, or delete most of it. Uniform scroll fade-ins are a
named tell.

**Do not** buy a WebGL/Spline hero — a single scene loads 800kB–2MB of runtime and collapses mobile
performance. Kinetic typography also fights screen readers and causes layout shift. The credible path
here is typographic and compositional, which suits a Vite/Tailwind stack.

---

## 6. Sequenced plan

### Now — hours, highest signal
1. **Fix the Dunn URL** → `dunnconstructionma.com`.
2. **Curate the portfolio to three** — Dunn, Conuco, Told History. Screenshots already at
   `public/work/*.webp` (20–71KB, replacing multi-MB `i.ibb.co` GIFs).
3. **Change the accent off rust** to one decisive colour; move ink to `#404040`; shift the ground off
   `#FBF7F0`.
4. **Stop italicising Fraunces** for emphasis.
5. **Flip `SectionHeading` default to `align: 'left'`**, opt specific sections back into centre. Add
   an `align` prop to `PageHero`, which hard-codes centring.
6. **Remove emoji icons** (`Home.tsx:107-112`, `Reviews.tsx`, `LandingContractors.tsx:63,241`) and the
   production `console.log`s (`LandingContractors.tsx:175-177, 198`).
7. **Audit meta descriptions, OG images and alt text** — this is the literal answer to *"did y'all do
   a QA check?"*

### Next — days
8. Flatten the type scale; add a mono face for metadata; trial Source Serif 4 for body.
9. Break 3–4 of the nine sections out of centred-stack into `col-start`/`col-end` asymmetry. Not all
   nine — variation is the point.
10. Replace `IconTile` grids with numbered text or nothing.
11. Vary or remove uniform scroll fade-ins.
12. Add `(01)`-style numbering to services and process.

### Then — weeks
13. Two or three deep written case studies with live links, real problems, named people.
14. Consider a text-index work page rather than a card grid.
15. Finish the Phase 3 migration: delete `brand-gradient`, `mesh-*`, `glow-brand` and the dead
    `brand`/`accent`/`surface` palettes; migrate `TestimonialCard.tsx` off `bg-brand-gradient`.
16. Promote repeated hex values to CSS custom properties.

---

## 7. The one important caveat

**Treat `/contractorlanding` and the main marketing site as separate design problems.**

The main site is a **credibility artifact** — its audience includes developers, peers, and anyone
evaluating whether we can design. Austere editorial treatment is right there.

`/contractorlanding` is a **conversion instrument** aimed at cold contractors from Instagram ads, and
it is tuned by real evidence already recorded in `CLAUDE.md` (form-first ordering, phone-field
microcopy, low-commitment CTA phrasing). A 14px type scale and brutalism-lite optimise for peer
respect, not for a roofer on a phone. Applying this document wholesale to the landing page would
likely make it convert **worse**.

Redesign the main site freely. Change the landing page only with a test behind it.

**On justification:** the evidence that aesthetics drive *credibility* is solid — credibility
judgments form in ~50ms and are driven by visual appeal (Lindgaard et al.), and the aesthetic-usability
effect is well established. The evidence that "distinctive" design beats "competent generic" design on
*conversion* does not exist in any form I could verify. Don't justify this work with conversion
projections. Justify it as: **we are a web design company whose shop window currently argues against
us.** That is sufficient.
