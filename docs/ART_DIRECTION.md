# Art direction

Written 2026-07-20. Supersedes the typography and layout sections of
`REDESIGN_PLAN_2026-07-20.md`; inherits its palette reasoning.

Every choice below states what it beats and why. If a future change can't answer "what does this beat,"
it isn't a decision, it's a preference.

---

## Who this is for

One person: a contractor who is excellent at the physical work, who has built a team, and who has
nothing left at 9pm after a thirteen-hour day. He wants to be with his family. The website is the job
he keeps not doing.

**The product is his time.** Not leads, not growth, not conversion. Every page is judged by whether it
takes work off this man or adds it.

He should feel, inside five seconds, that someone is genuinely taking care of him and that he doesn't
have to wonder what's real here.

---

## Palette

Keep the current system. Enforce it.

| Token | Hex | Job |
|---|---|---|
| `cream-50` | `#FAF8F4` | Ground. Plaster, not the AI cream `#FBF7F0`. |
| `ink-900` | `#262625` | Headlines. Never pure black; black is a screen colour, not a real one. |
| `ink-800` | `#404040` | Body. |
| `signal-500` | `#A00909` | The only saturated colour. Marking-pencil red. |
| `forest-700` | `#1F4D3D` | Confirmed and complete states only. Nothing decorative. |

`signal` is the red of a marking pencil and a safety sign, the one loud colour on a job site, and it
appears only where something is being pointed at. If it's on screen twice in a viewport, one of them is
wrong.

**One accent. Never a gradient.**

**Delete outright:** the `brand` indigo ramp, `brand-gradient`, `brand-gradient-soft`, `mesh-1`,
`mesh-2`, `glow-brand`, `.text-gradient-brand`. That blue-violet-magenta ramp is the single most
recognisable generated-site signature in circulation, and it is still sitting in
`tailwind.config.js:114` after the palette was supposedly replaced.

**Beats the obvious alternative** (picking a fresh palette): this would be the third palette in a week.
Thrash reads as indecision, and the current one is already defensible. The problem was never that
`signal` is wrong. The problem is that nothing enforces it, so indigo survived underneath.

---

## Typography

| Role | Family | Notes |
|---|---|---|
| Display | **Fraunces** | Already in use. Keep. |
| Body | **Hanken Grotesk** | Replaces Inter. |
| Metadata | **IBM Plex Mono** | New. Numbering, labels, dates, stats. |

Inter goes because it is the flagship tell. It is the default of every generated site and every SaaS
template, and its presence under a serif display face is most of what makes a page read as machine
output.

Hanken Grotesk over the reflexive replacements. Jakarta Sans, Manrope, and DM Sans are the next wave of
generic, already halfway through the same lifecycle Inter finished. Hanken has slightly humanist
proportions that survive at body size without announcing themselves.

**The mono does more work than the body face.** `src/index.css` already defines a `label-num` class for
job-sheet numbering, and it currently falls back to the generic system mono stack, which resolves to
Consolas on Windows and Menlo on Mac. It looks like a code editor by accident. Plex Mono makes the
numbering deliberate and carries every date stamp and stat label on the site.

**Beats the alternative** (also swapping Fraunces): Fraunces was never the tell. Inter underneath it
was. Replacing the display face too would throw away the one distinctive thing the current site has.

### Scale

One big jump, then a flat tail.

```
display   clamp(3rem, 6vw, 5rem)
h2        1.75rem
h3        1.25rem
body      1.0625rem
label     0.8125rem   mono, uppercase, tracked
```

Delete the `clamp()` base scale at `index.css:32-34`. It is dead code: `GradientHeading`'s `sizeMap`
overrides every heading that renders through it, which is nearly all of them. Delete the
`lg:text-[5.5rem]` arbitrary value too; an escape hatch in a scale means the scale was wrong.

**Beats the alternative** (a full modular scale): a strict 1.25 ratio gives six sizes that all look
similar, and the current site already proves what that produces. One dramatic size and a flat tail
gives hierarchy without fussiness, and it matches how a printed estimate actually looks.

### Loading

Preload Fraunces and Hanken Grotesk. Remove the `Outfit` preload from `index.html:40` entirely, since
it is referenced nowhere in the CSS or config and is currently a blocking request for a font that never
renders. Move Fraunces out of the render-blocking `@import` at `index.css:1`.

---

## Layout

**The structural idea is the job sheet.** A contractor's native document is the estimate: left-aligned,
ruled, numbered, figures in a mono column, nothing centred. It's the format the customer already trusts
because it's the one he writes himself.

Three structurally distinct section types. No page uses only one.

**1. Ruled rows.** Full-width horizontal rows. Mono label on the left, content on the right, hairline
rule between. Replaces the three-column icon-card grid, which currently appears nine times across the
site with the class string `mt-12 grid gap-6 md:grid-cols-3` byte-identical in four separate files.

**2. Asymmetric split.** Image bleeding off one edge, text in a narrow column that does not match the
image's height. For the origin story and for individual client work.

**3. Full-bleed image with an overlaid caption.** One client at full width, not seven in a grid.

Centred stacks survive in exactly one place: the final call to action, as a deliberate close. Anywhere
else, centring is the default that produced the problem.

Kill the tone alternation. Home currently runs `default / muted / default / muted` for nine sections
without a single deviation, which is a rhythm no human lays out by hand.

**Beats the alternative** (a 12-column grid with tidy asymmetry): asymmetry for its own sake is just a
different template. The job sheet is a real reference from the trade the studio was founded to serve,
so it produces decisions rather than arrangements.

---

## Motion

**What moves:** the hero, once, on load.

**What deliberately does not move:** everything below the fold.

Uniform fade-up-on-scroll is a named generated-site tell, and it's applied to every element on the
current site through two unreconciled systems with six different definitions of the same effect. It
also has a real cost: `generate-site` screenshots come back with blank sections because the content
sits at `opacity-0` until an IntersectionObserver fires.

Collapse to two definitions total. Keep `prefers-reduced-motion` handling in both systems.

**Delete:** `RotatingText` (seven words on a 2200ms loop in the hero) and the `StatBlock` count-up.
Count-ups exist to dramatise numbers, and the numbers are being deleted.

**Beats the alternative** (varied, characterful motion per section): more motion of any kind is more
reasons to distrust the page. The visitor is a tired man on a phone. Restraint is the message.

---

## Warmth

A spec sheet on its own is cold, and nothing about the thesis is cold. The heat comes from content, not
decoration:

- Real photographs of Rhyan and Valerie. No stock, no generated substitute. If the photo isn't ready,
  the space stays empty and marked.
- Verbatim reviews, left exactly as written. Yolanda Quesada's broken English stays broken. The
  imperfection is the proof; polished testimonials are what read as fake.
- First person. Sentences with "I" in them. Rhyan's dad is a person in this story, not a persona.

No glow, no glass, no gradient doing emotional work that the writing should be doing.

---

## The thing they remember

**On the homepage:** Rhyan and Valerie were eating at Hank's restaurant, noticed he had no website, and
called him over to their table mid-meal. That's the studio. No template produces that sentence.

**On the social page:** 198 followers. 51,400 likes. Two bathrooms, over $20,000 in contracts. Follower
counts don't pay for bathrooms.

Every competitor in this market sells follower growth. Ace can disprove the premise with a live client
account, which is a stronger position than any claim about quality.

---

## Standing rules

1. **No dollar figures on any public page.** None.
2. **No number without a source and a date.** Live stats get a "as of" stamp.
3. **Nothing attributed to anyone who didn't say it.**
4. **Never claim to be AI-free.** `generate-site` runs an Opus chain to build client previews, and this
   redesign is AI-assisted. The position is that the tool was never the problem and the missing care
   was. A site claiming purity while running a build chain would be the exact dishonesty it's arguing
   against.
5. **Don't sell growth.** Sell the evening back.
