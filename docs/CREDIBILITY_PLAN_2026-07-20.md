# Credibility & Design Plan — 2026-07-20

Triggered by the ad comments: six developers publicly called the site AI-generated
("AI slop", "clearly made with Claude", "did y'all do a QA check?"). This document addresses every
claim they made, diagnoses what actually reads as AI-generated, and gives a fix plan.

**The core insight:** the design system is good. It is barely being used. The site over-uses the two
most generic primitives it owns and leaves the characterful ones at zero usage.

---

## Part 1 — Every criticism, adjudicated

| # | Claim | Verdict | Action |
|---|---|---|---|
| 1 | "you didn't even use a transparent file for your logo" | **False** | None. `logo.png` is 500×500, PNG colour type 6 (RGBA), real alpha channel. |
| 2 | "multiple errors in your schema" | **Partly true** | Real: `@type: "WebDesignCompany"` (`index.html:155`) is not a schema.org type — 404s. Fix to `ProfessionalService`. All 5 JSON-LD blocks otherwise parse clean, and there is no fake `aggregateRating`. "Multiple" overstates it; there is one. |
| 3 | "google didn't even index your services page" | **Unverified** | `/services` is in `public/sitemap.xml`. Check Search Console coverage directly. |
| 4 | "clearly made with Claude" / "AI slop" / "was the site built with AI" | **Substantially true in effect** | See Part 2. Not about the palette — about stock photos, placeholder stats, and section monotony. |
| 5 | "these ads… it's the same scripted 'new cheap websites', they're all identical" | **True and the most useful comment** | The creative reads as a saturated genre. Covered in `docs/contractor-ad-creative.md`. |

**The bigger finding is not any single claim.** All six commenters are web developers. Not one is a
contractor. Meta is delivering a website-services ad to the people who *build websites*, because they
are who engages with website content. The comments are a symptom of a targeting failure, and their
11 likes are the negative-feedback signal driving `quality_ranking: BELOW_AVERAGE_35`.

---

## Part 2 — What actually reads as "generic AI"

The palette is **not** the problem. `tailwind.config.js` defines a deliberate editorial system —
cream / ink / rust, with **Fraunces** as the display serif and Inter for body. No purple gradients,
no default Tailwind blue. Someone made real choices here.

Five things undermine it:

### 2.1 Stock-photo testimonials — the single worst offender

`src/pages/Home.tsx:53-86` presents four named people with businesses, cities, quotes and hard
metrics — illustrated with **Unsplash stock headshots**:

```
Mike Chen · Hot Pot One · Boston, MA        photo-1472099645785-5658abf4ff4e
Maria Rodriguez · Conuco Takeout            photo-1494790108755-2616b612b647
John Dunn · Dunn Construction               photo-1507003211169-0a1dd7228f2d
Sarah Thompson · Thompson Fitness           photo-1438761681033-6461ffad8d80
```

`photo-1494790108755-2616b612b647` is one of the most-reused stock portraits on the internet.
Developers recognise these by sight. Pairing them with named individuals and specific numbers is what
makes the whole page read as fabricated — and it poisons the claims that *are* real.

**Because the claims are real.** `src/Work.tsx` carries the same clients with live, verifiable URLs
and the identical metrics:

| Client | Live site | Metric |
|---|---|---|
| Hot Pot One | hotpotone.net | "40% increase in online orders" |
| Conuco Takeout | conucotakeout.com | "35% lift in takeout orders" |
| Dunn Construction | dunnconstruction.com | "3× more qualified leads" |

So we own genuine proof and are covering it with stock photos of strangers.

> **Needs owner confirmation:** are "Mike Chen", "Maria Rodriguez", "John Dunn", "Sarah Thompson" real
> people who gave these quotes? If yes, we need real photos or permission to name them without one.
> If they are invented, the names must go — a fabricated named testimonial is a legal and trust
> problem, not a design preference.

### 2.2 Placeholder stats shipped to production

`src/pages/Home.tsx:123-125` and `src/AboutUs.tsx:49-51`:

```js
{ v: 'Many',  l: 'Websites launched' }
{ v: 'Happy', l: 'Social media clients' }
```

"Many" and "Happy" render as the headline numbers in the stat bar. This reads as an unfilled
template — it is the single clearest "nobody finished this page" signal on the site.

### 2.3 Section monotony — and its exact cause

Every section on the homepage is the same stack: small rust uppercase eyebrow → centred Fraunces
headline with an italic rust accent word → centred sub → grid of cards. **Nine times consecutively**,
with 8 `grid-cols` card grids among them.

The cause is one line: **`SectionHeading` defaults to `align: 'center'`, and nothing in the codebase
ever overrides it.** `PageHero` hard-codes `text-center max-w-3xl mx-auto` with no align prop at all.
So every section opens centred by construction.

Centred eyebrow → centred headline → centred sub, nine times, is the single most recognisable
AI-generated-page signature. Real editorial design alternates left-aligned and asymmetric — which our
*own* `editorial-serif` spec calls for: *"wide margins, asymmetric two-column text, hairline dividers,
numbered sections."* We have the hairline dividers and nothing else.

### 2.3b Emoji as icons, in production

- `src/pages/Home.tsx:107-112` — the `INDUSTRIES` array uses `🍽️ 🏗️ ⚕️ 💼 🛍️ 💪` as its icons
- `src/Reviews.tsx:26-29` — the same emoji set
- `src/LandingContractors.tsx:63,241` — `⚡ SAME-DAY website launch available — get online TODAY`

Emoji-as-icon inside a Fraunces editorial layout is a hard tonal break and reads as unfinished. The
ALL-CAPS "TODAY" + ⚡ + `animate-pulse-rust` glow stacks three urgency signals on one badge.

There is also `console.log` with emoji left in the production render path
(`src/LandingContractors.tsx:175-177, 198`) — open the console on the ad landing page and it's visible.

### 2.3c More placeholder content

Beyond `Many`/`Happy`, the contractor landing page ships testimonials attributed to
**`'Local Plumbing Co.'`** and **`'Trade Specialist'`** — placeholder names, in production, sitting
next to a real one (`'Dunn Construction'`). That mix is worse than having no testimonials.

### 2.3d Our body font is the one our own generator forbids

Body type is **Inter** — the most AI-associated typeface in circulation. Meanwhile
`supabase/functions/_shared/designSystems.ts`, the prompt we use to build *client* sites, instructs:

> *"NEVER Inter/Roboto/Arial/system unless this style names them."* … *"Do not drift toward a generic look."*

We hold generated client sites to a standard our own marketing site fails.

### 2.3e The blue-purple gradient is still in the codebase

`tailwind.config.js` still defines `brand-gradient: linear-gradient(135deg, #2747f5, #6c3df0, #a330e6)`
— the canonical AI-slop gradient — plus `mesh-1`, `mesh-2`, `glow-brand`, `.text-gradient-brand`. And
`src/components/ui/TestimonialCard.tsx:259` **still renders it** on its avatar fallback; that component
was never migrated off the dead `brand`/`accent`/`surface` palettes. `src/admin/AdminDashboard.tsx` is
60+ occurrences of `from-indigo-500 to-violet-600` / `bg-slate-*`.

Admin is internal so it's low priority, but the Phase 3 migration was never finished, and the evidence
is still shipping.

### 2.4 The design system is built and unused

`src/components/ui/` has 34 components. Usage across the site:

| Generic primitives — overused | | Characterful primitives — **unused** | |
|---|---|---|---|
| `StaggerGrid` | 7 pages | `Marquee` | **0** |
| `IconTile` | 6 pages | `SplitText` | **0** |
| `Magnetic` | 5 pages | `HandUnderline` | **0** |
| | | `AnimatedRule` | **0** |
| | | `LogoStrip` | **0** |
| | | `TestimonialCard` | **0** |

The two components producing the repetitive card-grid rhythm are on 6-7 pages each. Every component
built to create character sits at zero. `TestimonialEditorial` exists and is used on 2 pages — but
**not** on the homepage, which uses the stock-photo card layout instead.

This is the whole finding: we do not need new design. We need to use the design we already built.

### 2.5 A web design company showing no web design

The homepage contains no screenshot of any website we have built. The real portfolio — live GIFs of
Hot Pot One, Conuco, Dunn Construction — lives only on `/work`. A developer arriving from an ad sees
zero evidence of craft, which is precisely the gap "did y'all do a QA check?" walked into.

---

## Part 3 — The plan

### Priority 1 — Truthfulness (do first; nothing else matters if this is wrong)

1. **Remove all four Unsplash headshots** from `src/pages/Home.tsx:53-86`.
2. **Confirm which testimonials are real.** Real → keep the quote and business, replace the headshot
   with the client's actual site screenshot (we already have all three) or their logo. Not real →
   delete the person's name entirely and attribute to the business only, or cut it.
3. **Replace `Many` / `Happy`** with true numbers (`src/pages/Home.tsx:123-125`,
   `src/AboutUs.tsx:49-51`). If the real count is small, use a different stat — "1–7 day delivery" and
   "100% satisfaction" already work. A small true number beats a vague word.
4. **Fix the schema type** — `index.html:155`, `WebDesignCompany` → `ProfessionalService`.
5. **Check Search Console** for `/services` coverage.

### Priority 2 — Show the work (biggest credibility gain per hour)

6. **Put real client sites on the homepage, above the testimonials.** Use the existing assets in
   `src/Work.tsx` — hotpotone.net, conucotakeout.com, dunnconstruction.com — with live links. A
   clickable real site is unforgeable proof; a stock headshot is the opposite.
7. **Use `LogoStrip`** (currently unused) for real client names, replacing any generic trust bar.
8. **Swap the homepage testimonials to `TestimonialEditorial`** — already built, already used
   elsewhere, and it doesn't depend on a headshot.

### Priority 3 — Break the monotony with what we own

9. **Change one default.** Flip `SectionHeading`'s `align` default from `'center'` to `'left'`, then
   opt specific sections back into centre. This is a one-line change that alters the read of the whole
   site more than anything else on this list. Add an `align` prop to `PageHero`, which currently
   hard-codes centring.
10. **Vary the section rhythm.** Target: no more than two consecutive sections sharing the
    eyebrow/headline/grid pattern.
    - Make 2-3 sections structurally different: one full-bleed image, one
      `TestimonialEditorial variant="feature"` billboard, one numbered editorial list using the
      already-defined but unused `.label-num` utility.
    - Use `Marquee` + `LogoStrip` (both unused) for a real client strip.
    - Use `AnimatedRule` (unused) as a divider in place of a third identical card grid.
    - Use `SplitText` (unused) on exactly one headline — the hero. Not more.
11. **Reduce `IconTile` grids.** "Built for small businesses" (6 tiles) and "Fast, secure, reliable"
    (4 tiles) are the same component twice. Convert one to an editorial layout or a real screenshot.
12. **Remove the emoji icons** — `Home.tsx:107-112`, `Reviews.tsx:26-29`,
    `LandingContractors.tsx:63,241`. Use the Lucide set already in the bundle, or nothing.
13. **Strip the production `console.log`s** at `LandingContractors.tsx:175-177, 198`.

### Priority 3b — Finish the Phase 3 migration (cheap, removes the evidence)

14. Delete `brand-gradient`, `mesh-1`, `mesh-2`, `glow-brand`, `.text-gradient-brand*` from
    `tailwind.config.js` and `index.css`, and the dead `brand`/`accent`/`surface` palettes.
15. Migrate `src/components/ui/TestimonialCard.tsx` off the legacy palette — it still renders
    `bg-brand-gradient` at line 259.
16. Consider replacing **Inter**. Our own generator prompt recommends Work Sans / Mulish / Manrope for
    editorial pairings with a serif display face. Fraunces already carries the character; the body font
    is what reverts the page to 2021-SaaS-default.
17. Promote the repeated hex values in `index.css` to CSS custom properties — `#FBF7F0` and `#1A1611`
    each appear 4+ times across the config and the stylesheet, so there is no single source of truth.

### Priority 3c — Use the components instead of re-implementing them

The library is bypassed in the highest-traffic files, which is why the pages drifted generic:

- The `Eyebrow` + `GradientHeading` + sub pattern is **hand-copied in 6 places** instead of using
  `SectionHeading`.
- A **200-character button class string** is copy-pasted 4× across `LandingHero`, `FinalCta`, and
  `LandingContractors` — `Button` has a `rust` variant and a `magnetic` prop that do exactly this, and
  is essentially unused on the landing pages.
- The `Reveal variant="stagger"` + inline `transitionDelay` incantation is hand-written in 5 places
  instead of `StaggerGrid`; the delays have drifted to 60/70/80/100ms.
- `LandingContractors` hand-rolls two sticky CTAs while `StickyConversionBar` exists.
- The final CTA is re-implemented by hand instead of using `FinalCta`.

### Priority 4 — Ads (see `docs/contractor-ad-creative.md`)

11. Record the new script; run the proven 2025 video meanwhile.
12. Hide the trolling comments, reply to the substantive ones (`kevinfromlongisland` was partly right
    — thanking him and shipping the schema fix is a better look than deleting him).
13. Placement change to Facebook-only is pending an owner decision — it requires turning off
    Advantage+ campaign mode, since manual placements are unavailable while it is on.

### Explicitly not doing

- **Not redesigning the palette or typography.** Cream/ink/rust with Fraunces is a real, deliberate
  system and it is not what anyone is reacting to.
- **Not adding a new UI library.** 34 components exist and a third of them have never been used.
