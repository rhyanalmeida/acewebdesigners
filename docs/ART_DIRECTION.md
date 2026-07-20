# Art direction

Written 2026-07-20. Supersedes the typography, palette and layout sections of
`REDESIGN_PLAN_2026-07-20.md`.

**This is v2.** The first version of this document argued for keeping the cream ground and the
Fraunces serif. That was wrong. Warm off-white under a large serif display face is the documented
signature of AI-generated web design — `REDESIGN_PLAN` §0 said so, and v1 talked itself out of it.
The owner's verdict on v1 was: *"the actual content direction is good but UI looks like Claude made
it."* He was right.

Every choice below states what it beats. If a future change can't answer "what does this beat," it
isn't a decision, it's a preference.

---

## Who this is for

One person: a contractor who is excellent at the physical work, who has built a team, and who has
nothing left at 9pm after a thirteen-hour day. He wants to be with his family. The website is the job
he keeps not doing.

**The product is his time.** Not leads, not growth, not conversion. Every page is judged by whether
it takes work off this man or adds it.

He should feel, inside five seconds, that someone is genuinely taking care of him and that he doesn't
have to wonder what's real here.

---

## Two grounds

### Sitewide — concrete

| Token | Hex | Job |
|---|---|---|
| `cream-50` | `#F2F1EF` | Ground. Cool concrete. **Zero warmth** — the deliberate opposite of the cream it replaced. |
| `cream-100` | `#EAE9E6` | Alternate sections |
| `ink-900` | `#111110` | Headlines, inverted grounds |
| `ink-800` | `#2A2927` | Body |
| `signal-500` | `#A00909` | The only saturated colour. Once per screen. |
| `forest-700` | `#1F4D3D` | Confirmed/complete states only. Never decorative. |

If `signal` appears twice in one viewport, one of them is wrong.

Token names are still `cream-*` on purpose. Renaming would touch ~37 files for zero visual gain, and
a rename is exactly what buried the previous palette change in noise. **The values are the contract,
not the word.**

*Beats the alternative* (a warm editorial ground): industrial brands use white or near-black and
never warm off-white. Warm cream is editorial/wellness territory, and on this site it was the single
thing most reliably identifying the page as generated.

### `/contractorlanding` — blueprint

Same tokens, same components, drafting-sheet surface: `.surface-blueprint` — cool near-white with a
hairline grid at 24px, black line work, red annotation.

**Why red earns its place there:** contractors and architects redline drawings. Correction ink. Same
token, real reason, no third palette.

**The costume risk is the thing to manage.** A literal cyan-on-navy cyanotype is fancy dress. If it
starts reading as a theme, the grid opacity is too high or the blue is too saturated. Both are
deliberately near the floor.

*Beats the alternative* (blueprint everywhere): the studio's shop window shouldn't be dressed in one
trade's visual language. The contractor landing page speaks to one audience and is the paid-ad
destination; the main site speaks to everyone else.

---

## Shape: 0px radius, everywhere

Sharp corners, 1px solid borders, no soft rings, no glass, no glow, no gradient.

The library carried 69 `rounded-full`, 18 `rounded-xl2/3/4` and 26 soft `ring-1`. Setting the three
custom radius tokens to `0px` squared 17 call sites in one edit. `rounded-full` is edited per call
site and deliberately **not** overridden centrally — ~37 of its uses are in `admin/`,
`RestaurantWizard` and `Scheduler`, where they are genuinely circles (status dots, avatars, skeletons).

Button feedback is a 1px shift against a hard offset shadow. Mechanical, like a real switch.

*Beats the alternative* (softening a few corners): rounded geometry is the most reliable single tell
of a generated page, and half-measures read as indecision. This is the fastest, cheapest change with
the largest effect.

---

## Typography: no serif

| Role | Family |
|---|---|
| Display + body | **Archivo** — variable, weight **and width** axes |
| Labels, numbers, metadata | **IBM Plex Mono** |

One family does display and body because Archivo's width axis carries the hierarchy: headings run
`wdth` 100→118 as they scale up, so display type reads as signage while body stays normal. Weight and
width do what the serif used to.

**Rejected, with reasons:**
- **Oswald / Anton / Bebas Neue** — the reflexive "make it look tough" faces, and the default of
  every contractor and gym template. They'd make the site *more* generic while feeling more
  industrial.
- **Geist** — now the signature of developer-tool marketing.
- **Bricolage Grotesque** — on track to be the next Inter.
- **Instrument Sans** — caps at 700 with no width axis, so it can't carry display.
- **Inter / Jakarta / Manrope / DM Sans / Poppins / Montserrat** — the generic wave.

**Fixed on the way through:** `Eyebrow` carried an inline `style={{ fontFamily: 'ui-monospace…' }}`
that overrode Tailwind, so every section label on the site rendered in the *system* mono and the IBM
Plex Mono token never applied where it was most visible.

### Scale
One big jump, then a flat tail. `h1` is `clamp(3rem, 6vw, 5rem)`; everything below is close together
on purpose. A strict modular ratio gives six sizes that all look alike, which is what the previous
scale produced.

---

## Layout

**The structural idea is the job sheet.** A contractor's native document is the estimate:
left-aligned, ruled, numbered, figures in a mono column, nothing centred. It's the format the
customer already trusts because it's the one he writes himself.

Three structurally distinct section types, no page using only one:

1. **Ruled rows** — mono label left, content right, hairline between. Replaces the three-column
   icon-card grid, which appeared nine times with the class string `mt-12 grid gap-6 md:grid-cols-3`
   byte-identical across four files.
2. **Asymmetric split** — image bleeding off one edge, text in a narrow column of a different height.
3. **Full-bleed image with overlaid caption** — one client at full width, not seven as thumbnails.

Centred stacks survive in exactly one place: `FinalCta`, as a deliberate close.

---

## Motion

**What moves:** the hero, once, on load.
**What deliberately does not:** everything below the fold.

Uniform fade-up-on-scroll is a named tell, and it had a real cost — `FinalCta` was wrapped in
`Reveal`, so the closing CTA rendered as an empty black block in every full-page screenshot,
including the ones `generate-site` produces for client previews.

Deleted: `Magnetic`/`.magnetic-btn` (cursor-attraction on buttons), `.attention-ring` (pulsing red
halo), `.premium-card-shine` (conic sheen sweep), `CursorHalo` (soft radial glow, still painting the
deleted rust `rgba(192,78,26,0.22)` three days after the palette changed), `RotatingText` (seven
words on a 2.2s loop), and the `StatBlock` count-up. `prefers-reduced-motion` is honoured in both
motion systems.

*Beats the alternative* (varied, characterful motion): more motion is more reasons to distrust the
page. The visitor is a tired man on a phone. Restraint is the message.

---

## Warmth

A spec sheet on its own is cold, and nothing about the thesis is cold. The heat comes from content,
not decoration:

- **Real photographs.** Job sites, hands, materials — and Rhyan and Valerie themselves. Rendered
  through `Figure`, which shows **nothing at all** until a real image exists. No grey box, no
  "coming soon". An absent section is honest; a stock photo standing in for a real client is what
  got the old site called fake.
- **Verbatim reviews**, unedited. Yolanda Quesada's broken English stays broken. The imperfection is
  the proof.
- **First person.** Sentences with "I" in them.

No glow, no glass, no gradient doing emotional work the writing should be doing.

---

## The thing they remember

**Homepage:** Rhyan and Valerie were eating at Hank's restaurant, noticed he had no website, and
called him over to their table mid-meal. No template produces that sentence.

**Social page:** 198 followers. 51,400 likes. Two bathrooms, over $20,000 in contracts. Follower
counts don't pay for bathrooms.

---

## Standing rules

1. **No dollar figures on any public page.** The one exception is the Luxury Makeover client result,
   which is a client's revenue, not a price.
2. **No number without a source and a date.** Live stats carry an "as of" stamp.
3. **Nothing attributed to anyone who didn't say it.**
4. **Never claim to be AI-free.** `generate-site` runs an Opus chain to build client previews and
   this redesign is AI-assisted. The position is that the tool was never the problem and the missing
   care was. A site claiming purity while running a build chain would be the exact dishonesty it's
   arguing against.
5. **Don't sell growth.** Sell the evening back.
6. **One button component.** The CTA string was copy-pasted 11 times before `ui/Button.tsx` existed,
   and had already drifted. If you find yourself writing a button class string, stop.
