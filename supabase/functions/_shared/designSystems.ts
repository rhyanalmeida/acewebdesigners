// Design-systems library for auto-generated preview sites.
//
// The problem this solves: generate-site used to bake ONE art direction into its
// system prompt (dark-luxury "King Repairs"), so every generated site looked the
// same. This is a curated library of distinct art directions — each a complete
// look (palette + type pairing + layout + motion + photo treatment). generate-site
// picks one per booking and injects it into the prompt, so every preview site is
// visually unique and on-brand for the trade.
//
// SOURCE OF TRUTH: the `design_systems` Postgres table (migration 0007). The array
// below is the SEED for that table AND the runtime FALLBACK if the DB read fails,
// so a booking is never blocked. The selection/render helpers take a systems list
// so they work against either the DB rows or this fallback.
//
// Selection is DETERMINISTIC from the appointment id (selectDesignSystem): the 3
// generation stages run in separate isolates but each resolves the same style, and
// retries reproduce it exactly.
//
// Pure Deno-compatible TS (no Deno.* / npm:*) so it bundles into the Edge Function
// AND can be exercised by vitest (designSystems.test.ts).

import { isFoodBusiness } from './niche.ts'

export interface DesignSystem {
  /** stable kebab-case id (used for overrides + logging). */
  id: string
  /** human name shown in logs / admin. */
  name: string
  /** lowercase trade keywords this style is tuned for; [] = universal (fits any trade). */
  trades: string[]
  /** one-line vibe. */
  mood: string
  /** palette strategy with concrete hex suggestions the model adapts into tokens. */
  palette: string
  /** Google font pairing (display + body) and how to use each. */
  typography: string
  /** hero treatment, section rhythm, and the signature components of this look. */
  layout: string
  /** the motion signature — the moments that make this style feel alive. */
  motion: string
  /** how (or whether) to use the photo-library images, and the treatment. */
  photo: string
}

// ── The library ──────────────────────────────────────────────────────────────
// Each entry is a genuinely different look. Trade tags are matched loosely
// (substring both ways) against the booking's business type; universal styles
// ([] trades) are eligible for everyone and keep variety high.

export const DEFAULT_DESIGN_SYSTEMS: DesignSystem[] = [
  {
    id: 'nocturne-luxe',
    name: 'Nocturne Luxe',
    trades: [], // universal — the proven premium look
    mood: 'Dark, cinematic, expensive — a moody photographic showcase with one glowing accent.',
    palette:
      'Near-black base (#0d0f0d–#12141a) with ONE luxurious metallic accent: antique gold (#c8a24a), brass (#b08d57), or ember (#d9633b). Light cream (#f5f1e8) sections for contrast. Opens dark.',
    typography:
      'High-contrast display serif (Fraunces or Playfair Display) for headlines with one accent-italic word; clean geometric body (Manrope or Sora). Uppercase tracked labels for eyebrows/chips.',
    layout:
      'Full-viewport photographic hero under a dark gradient, badge chip + serif headline (one italic accent word) + dual CTAs + trust chips. Alternating dark/light sections, offset-shadow photo splits, photo-backed CTA band, rich multi-column footer.',
    motion:
      'Slow 14–20s Ken Burns hero zoom; staggered hero cascade; the accent-italic word wipes in then carries a slow gold shimmer + self-drawing underline; card lifts, button shine sweeps, counters count up.',
    photo: 'Dark-overlay hero + framed splits. Use the trade photos at full richness under gradient overlays.',
  },
  {
    id: 'editorial-serif',
    name: 'Editorial Serif',
    trades: [], // universal — magazine calm
    mood: 'Quiet luxury of a print magazine: warm paper, huge serifs, disciplined whitespace.',
    palette:
      'Warm off-white paper (#f7f4ee), ink near-black (#1a1a17), one restrained accent — oxblood (#7a2e2e), forest (#2f4a3a), or navy (#1f2d4a). Mostly light; type does the work.',
    typography:
      'Large high-contrast serif (Playfair Display or Fraunces) at generous sizes; small-caps tracked labels; body in a humanist sans (Work Sans or Mulish) with roomy line-height.',
    layout:
      'Editorial hero: oversized serif headline + thin rules + a single framed photo, no dark overlay. Wide margins, asymmetric two-column text, hairline dividers, numbered sections, understated cards. Minimal chrome.',
    motion:
      'Restrained and elegant: soft fade-and-rise reveals, a thin accent scroll-progress line, underlines that draw on hover. No Ken Burns, no marquee flash — keep the marquee a whisper-thin ticker.',
    photo: 'Bright framed editorial photos (rounded or hairline-bordered). No heavy overlays; let images sit clean on paper.',
  },
  {
    id: 'brutalist-mono',
    name: 'Brutalist Mono',
    trades: ['welding', 'fabrication', 'metal', 'construction', 'demolition', 'concrete', 'auto'],
    mood: 'Loud, confident, high-contrast — oversized type, hard edges, no decoration.',
    palette:
      'Stark black (#0a0a0a) and white (#ffffff) with ONE hot accent — safety orange (#ff4d00), electric lime (#b6f500), or red (#e10600). Flat fills, hard borders, zero gradients.',
    typography:
      'Oversized grotesque display (Space Grotesk or Archivo Black) in ALL-CAPS blocks; monospace (IBM Plex Mono / Space Mono) for labels and stats; body in Space Grotesk regular.',
    layout:
      'Type-first hero: giant caps headline, thick 3–4px borders, visible grid lines, boxed sections. A bold running marquee, stat blocks in hard-ruled cells, service cards as bordered rectangles that invert on hover.',
    motion:
      'Snappy, mechanical: instant invert-on-hover, marquee scrolls fast, headline letters slam in, borders draw. Nothing soft or floaty.',
    photo: 'High-contrast duotone or grayscale photos in hard-bordered blocks; small, punchy, never full-bleed soft.',
  },
  {
    id: 'warm-craftsman',
    name: 'Warm Craftsman',
    trades: ['carpentry', 'woodworking', 'remodel', 'remodeling', 'handyman', 'flooring', 'cabinet', 'furniture', 'bakery', 'coffee'],
    mood: 'Handmade warmth — earthy, tactile, artisan pride.',
    palette:
      'Clay/terracotta (#b5623a), warm cream (#f2e8d5), deep charcoal-brown (#2b241d), with a muted sage (#8a9a7b) secondary. Textured, cozy, never cold.',
    typography:
      'Characterful serif (Fraunces at a warm optical size) for headlines; friendly grotesque (Work Sans or Epilogue) for body; hand-lettered feel via italic accents.',
    layout:
      'Warm photographic hero with a paper-grain overlay; badge chip in accent; wood-tone section bands; photo splits with hand-drawn arrow/underline SVGs; craft-detail service cards.',
    motion:
      'Organic: gentle rise reveals, hand-drawn SVG underlines and arrows that sketch themselves, subtle grain, soft card lifts. Warm and unhurried.',
    photo: 'Warm-toned photos, softly overlaid; favor material/detail shots (wood, tools, hands) in rounded frames.',
  },
  {
    id: 'fresh-botanical',
    name: 'Fresh Botanical',
    trades: ['landscaping', 'lawn', 'garden', 'gardening', 'tree', 'florist', 'nursery', 'wellness', 'spa'],
    mood: 'Airy and organic — sunlight, greenery, room to breathe.',
    palette:
      'Soft cream (#f4f6ef), sage/forest greens (#3f6b4c, #8fae8b), warm sand accent (#d8b78a). Bright and natural; light-dominant.',
    typography:
      'Elegant display serif (DM Serif Display or Fraunces) paired with a rounded humanist sans (Nunito Sans or Mulish). Soft, welcoming sizes.',
    layout:
      'Bright airy hero (light photo, minimal overlay) with organic blob/leaf SVG shapes; generous whitespace; curved section dividers; rounded cards; a calm marquee of services.',
    motion:
      'Soft and breezy: gentle float on decorative leaves/blobs, fade-and-rise reveals, curved dividers, buttons that grow softly. Nothing harsh.',
    photo: 'Bright, sunlit photos with light or no overlay; rounded corners; greenery/outdoor shots preferred.',
  },
  {
    id: 'clean-corporate-trust',
    name: 'Clean Corporate Trust',
    trades: [], // universal — dependable services
    mood: 'Crisp, reassuring, professional — the look of a company you can trust with your home.',
    palette:
      'Deep trustworthy blue (#123a6b / #0e2f5c), clean white, cool steel grays (#eef2f7), one bright accent (#2e8bff or #17b978). Light, orderly, high legibility.',
    typography:
      'Confident geometric sans for headlines (Sora or Manrope, tight weights) + Manrope body. Clear hierarchy, no serifs needed. Uppercase micro-labels.',
    layout:
      'Clean hero: photo or subtle gradient, bold sans headline, crisp dual CTAs, trust badges. Card-based service grid, an icon feature row, a stat band, tidy testimonial cards, structured footer.',
    motion:
      'Precise and subtle: clean fade-ups, count-up stats, gentle card lifts, a thin accent progress bar, hover elevation on cards. Professional restraint.',
    photo: 'Bright, clean photos with light overlays; crisp rounded cards; real-work / crew shots build trust.',
  },
  {
    id: 'bold-athletic',
    name: 'Bold Athletic',
    trades: ['gym', 'fitness', 'auto', 'automotive', 'detailing', 'moving', 'movers', 'sports', 'training', 'towing'],
    mood: 'High energy, kinetic, muscular — motion and momentum.',
    palette:
      'Near-black (#0c0c0e) with an electric accent — volt lime (#c8ff00), blaze orange (#ff5a1f), or cyan (#00e0ff). Bold, punchy, diagonal energy.',
    typography:
      'Condensed heavy display (Archivo Black or Anton) in caps + Barlow / Barlow Semi Condensed body. Italic slants for speed.',
    layout:
      'Dynamic hero with diagonal/skewed cuts and a bold slashed headline; angled section dividers; oversized stat counters; energetic service cards; a fast marquee of promises.',
    motion:
      'Fast and kinetic: diagonal wipes, numbers that race up, skew-on-hover cards, quick staggered slams, a bold shine on CTAs. Momentum everywhere.',
    photo: 'High-energy photos with dark overlay + accent tint; diagonal masks; motion-implied crops.',
  },
  {
    id: 'coastal-calm',
    name: 'Coastal Calm',
    trades: ['pool', 'cleaning', 'spa', 'window', 'pressure washing', 'marine', 'boat', 'hvac'],
    mood: 'Breezy and clean — sea air, soft light, effortless.',
    palette:
      'Soft sky/teal blues (#2a7fa6, #bfe3ec), warm sand (#efe6d6), crisp white. Light, fresh, watery.',
    typography:
      'Warm display serif (Fraunces) or soft sans (Quicksand) headlines + Mulish body. Relaxed, friendly.',
    layout:
      'Light hero with a gentle wave SVG divider; airy sections; soft-shadow rounded cards; a calm services marquee; wave/curve dividers between bands.',
    motion:
      'Gentle drift: subtle wave-shape animation, soft fade-rise, buttons that ripple, easy card lifts. Serene, never jumpy.',
    photo: 'Bright, watery, sunlit photos with light overlays; soft rounded frames.',
  },
  {
    id: 'modern-tech-minimal',
    name: 'Modern Tech Minimal',
    trades: ['solar', 'security', 'smart home', 'ev', 'electrical', 'electric', 'it', 'networking', 'alarm', 'audio', 'automation'],
    mood: 'Sleek, futuristic, precise — a premium product page for a service.',
    palette:
      'Dark slate/graphite (#0f1420, #161b26) with ONE luminous accent — cyan (#22d3ee), violet (#8b5cf6, used tastefully on dark), or electric blue (#3b82f6). Subtle glow, fine gridlines.',
    typography:
      'Grotesque display (Space Grotesk or Sora) + Manrope body. Tight tracking, precise weights, mono for spec labels.',
    layout:
      'Dark hero with a faint dotted/grid backdrop and a soft accent glow behind the headline; glassy cards with thin borders; a spec-style stat band; sleek feature rows; subtle gradient CTA band.',
    motion:
      'Precise, glowing: soft accent glow pulses, gridlines fade in, cards get a thin animated border sheen, numbers tick up, smooth spring reveals.',
    photo: 'Photos in glassy/bordered frames with a slight accent duotone; dark treatment; or subtle abstract backdrops over solid dark.',
  },
  {
    id: 'vintage-signage',
    name: 'Vintage Signage',
    trades: ['barber', 'barbershop', 'butcher', 'brewery', 'brewing', 'tattoo', 'mechanic', 'pizza', 'diner', 'deli'],
    mood: 'Heritage craftsmanship — enamel signs, crests, hand-painted confidence.',
    palette:
      'Cream (#f2e9d8) with oxblood (#7c2b2b) or deep navy (#1e2a44) and antique gold (#c69749) detailing. Warm, storied, slightly aged.',
    typography:
      'Bold slab/serif display (Playfair Display or DM Serif Display) with condensed caps (Oswald) for signage labels; body in a sturdy serif (Lora) or Work Sans.',
    layout:
      'Emblem hero: a crest/badge SVG, arched or ribboned headline, established-style eyebrow (generic, no invented year), enamel-sign section labels; framed vintage-toned photos; ticketed service cards.',
    motion:
      'Characterful but tasteful: badge draws in, ribbon reveals, subtle grain, gentle rise. Retro without gimmicks.',
    photo: 'Warm vintage-toned photos (sepia/duotone) in bordered frames; craft/close-up shots.',
  },
  {
    id: 'luxe-neutral-beauty',
    name: 'Luxe Neutral',
    trades: ['salon', 'beauty', 'med spa', 'medspa', 'aesthetics', 'nails', 'hair', 'boutique', 'lash', 'skincare', 'interior'],
    mood: 'Refined and soft — a high-end salon or boutique, understated elegance.',
    palette:
      'Warm taupe/greige (#e7ded4), soft blush (#e6c8be), espresso (#3a2f28), with a thin gold hairline accent (#b9975b). Muted, pampered, calm.',
    typography:
      'Elegant thin serif (Cormorant Garamond or Fraunces light) for headlines + clean geometric sans (Jost or Manrope) body. Airy tracking, delicate weights.',
    layout:
      'Soft minimalist hero (light photo, faint overlay), delicate serif headline, thin gold divider; generous whitespace; elegant thin-bordered cards; refined splits; understated CTA.',
    motion:
      'Delicate: slow fades, thin gold lines that draw, gentle image reveals, soft hover. Elegance over energy.',
    photo: 'Soft, bright, warm-neutral photos with faint overlays; thin-bordered or rounded frames.',
  },
  {
    id: 'industrial-steel',
    name: 'Industrial Steel',
    trades: ['welding', 'machining', 'fabrication', 'plumbing', 'hvac', 'excavation', 'paving', 'roofing', 'industrial', 'commercial'],
    mood: 'Heavy-duty and precise — steel, blueprints, engineered trust.',
    palette:
      'Gunmetal/graphite (#23262b, #34383f) with safety amber/yellow (#f2b100) or hazard orange (#e85d04) accent, concrete gray (#d8d5cf) light sections. Utilitarian, solid.',
    typography:
      'Industrial grotesque (Archivo or Chivo) caps headlines + Barlow Condensed labels + Barlow body. Stencil-adjacent, blueprint-like.',
    layout:
      'Rugged hero (dark photo + gradient), amber badge chip, blocky headline; blueprint-grid backdrops; hard-edged stat cells; heavy bordered service cards; measured section rhythm.',
    motion:
      'Mechanical: gridlines draw, counters tick like gauges, panels slide, bolt/rivet SVG accents. Precise, grounded, no float.',
    photo: 'Gritty industrial photos with dark overlay + slight desaturation; hard-cornered frames.',
  },
  {
    id: 'appetite-market',
    name: 'Appetite Market',
    trades: ['restaurant', 'catering', 'cafe', 'food', 'grocery', 'bakery', 'kitchen', 'bar', 'juice', 'steak', 'diner', 'pub', 'grill', 'inn', 'tavern', 'eatery'],
    mood: 'Fresh and appetizing — makes you hungry, warm and inviting.',
    palette:
      'Warm tomato/paprika red (#c8462f) or mustard (#e0a52e) with cream (#f6efe2) and leafy green (#3f6b3f). Appetizing, warm, energetic-but-cozy.',
    typography:
      'Friendly display serif (Fraunces or DM Serif Display) + clean sans (Epilogue or Work Sans). Menu-like labels in tracked caps.',
    layout:
      'Mouth-watering photo hero with warm overlay; menu-style section labels; ingredient/dish photo splits; a specials marquee; appetizing service/menu cards with prices ONLY if provided.',
    motion:
      'Warm and lively: soft rise reveals, gentle image zoom on hover, steam/sparkle SVG touches, counters for playful stats. Inviting, not frantic.',
    photo: 'Rich, warm food/interior photos; light-to-medium warm overlays; rounded frames; full-bleed hero.',
  },
  {
    id: 'nordic-light',
    name: 'Nordic Light',
    trades: ['architecture', 'architect', 'design', 'dental', 'dentist', 'optometry', 'medical', 'clinic', 'accounting', 'law', 'consulting'],
    mood: 'Scandinavian minimalism — pale, precise, serene, expensive in its restraint.',
    palette:
      'Near-white (#fafafa), pale warm grays (#eceae6), soft muted blue or clay accent (#6b8ea3 / #c07a5b), ink text (#1c1c1c). Ultra-light, lots of air.',
    typography:
      'A light editorial serif (Fraunces light) or refined grotesque (Sora) headlines + Manrope body. Tight, quiet, generous line-height.',
    layout:
      'Minimal hero: small eyebrow, a calm medium headline, one clean framed photo, lots of negative space. Sparse hairline-divided sections, roomy cards, a barely-there ticker, restrained footer.',
    motion:
      'Whisper-quiet: slow fades, a hairline progress bar, subtle image reveals. Almost still — the calm IS the design.',
    photo: 'Bright, airy, desaturated photos with no overlay; clean rounded or hairline frames; lots of surrounding whitespace.',
  },
  {
    id: 'sunset-glow',
    name: 'Sunset Glow',
    trades: ['photography', 'photographer', 'events', 'event', 'dj', 'nightlife', 'entertainment', 'videography', 'wedding', 'creative'],
    mood: 'Warm, glowing, atmospheric — golden hour and soft neon.',
    palette:
      'Deep plum/aubergine base (#231428) flowing into ember and rose (#e0654a → #d98a8a) accent glows. Dark with luminous gradients used tastefully (never flat purple-on-white).',
    typography:
      'Expressive display serif (Fraunces or Playfair) + Sora body. One accent word in a warm gradient.',
    layout:
      'Atmospheric hero with a soft radial glow behind the headline; gradient-lit section bands; glassy cards; a glowing stat band; immersive photo-backed CTA.',
    motion:
      'Luminous: slow gradient drift, accent-word gradient shimmer, soft glow pulses on reveal, smooth parallax-lite image drift.',
    photo: 'Moody, warm-lit photos under gradient overlays; full-bleed hero; glow-edged frames.',
  },
  {
    id: 'heritage-green-gold',
    name: 'Heritage Green & Gold',
    trades: ['law', 'attorney', 'legal', 'real estate', 'realtor', 'financial', 'insurance', 'landscaping', 'country club', 'property'],
    mood: 'Established, trustworthy, traditional luxury — old-money confidence.',
    palette:
      'Hunter/forest green (#1f3d2e), antique gold (#c3a24a), warm cream (#f3ecdd), ink (#161a16). Classic, dignified, reassuring.',
    typography:
      'Traditional high-contrast serif (Playfair Display) headlines + a readable serif (Lora) or Work Sans body. Small-caps tracked labels, crest energy.',
    layout:
      'Stately hero (rich photo + green/gradient overlay, or solid green with a gold monogram); crest/monogram SVG; formal section rhythm; bordered testimonial cards; column-rule footer with fine gold hairlines.',
    motion:
      'Dignified: gold hairlines draw in, crest reveals, slow fade-rise, subtle counters. Composed and unhurried.',
    photo: 'Rich, classic photos with green/dark overlays; framed with thin gold borders.',
  },
  {
    id: 'playful-rounded',
    name: 'Playful Rounded',
    trades: ['daycare', 'childcare', 'pet', 'dog', 'grooming', 'kids', 'party', 'tutoring', 'cleaning', 'ice cream'],
    mood: 'Cheerful, friendly, approachable — big smiles and soft shapes.',
    palette:
      'Bright cheerful trio on white: coral (#ff6b6b), teal (#22c1c3), sunny yellow (#ffd23f). Playful, warm, high-energy-friendly.',
    typography:
      'Rounded display (Baloo 2 or Quicksand bold) + Nunito body. Soft, bouncy, big-hearted.',
    layout:
      'Bright hero with rounded blob shapes and a friendly headline; big pill CTAs; super-rounded cards; wavy/blob dividers; a bouncy services marquee; smiley trust chips.',
    motion:
      'Bouncy and delightful: springy hover pops, blobs that wobble gently, cards that bounce up on reveal, playful button squish. Fun but tasteful.',
    photo: 'Bright, joyful photos in heavily rounded frames; light overlays; happy/people shots preferred.',
  },
  {
    id: 'mono-noir',
    name: 'Mono Noir',
    trades: ['photography', 'boutique', 'salon', 'fashion', 'gallery', 'studio', 'design', 'jewelry', 'architect'],
    mood: 'Fashion-editorial monochrome — pure black, white, and one decisive red.',
    palette:
      'Pure black (#000) and white (#fff) with ONE decisive accent — red (#e10600) or a single warm gold hairline. Zero clutter, maximum contrast.',
    typography:
      'Ultra high-contrast Didone serif (Playfair Display) at large sizes + a clean grotesque (Archivo or Manrope) for body/labels. Fashion-magazine hierarchy.',
    layout:
      'Bold monochrome hero: enormous serif headline, a single striking black-and-white photo, thin accent rule; gallery-grid sections; minimal captions; a quiet thin ticker; sparse, confident footer.',
    motion:
      'Sharp and slow: elegant clip-path wipes, a single accent line draw, slow image fade, restrained hover. Precision over playfulness.',
    photo: 'Black-and-white / grayscale photos; full-bleed or gallery-grid; the ONE accent color reserved for type only.',
  },
  // ── Food & drink (added 2026-11-04 for the restaurant outbound funnel) ──────
  // Every restaurant category matches at least two of these, so selectDesignSystem's
  // "2+ trade-fit styles → trade-fit only" rule keeps corporate/contractor looks away
  // from food businesses. Tags are Google Maps category words.
  {
    id: 'candlelit-bistro',
    name: 'Candlelit Bistro',
    trades: ['restaurant', 'bistro', 'steak', 'steakhouse', 'chophouse', 'sushi', 'japanese', 'wine', 'fine dining', 'tavern', 'oyster', 'new american', 'bar', 'pub', 'inn'],
    mood: 'Dinner-date dark — candlelight, linen, a hush of luxury that makes the food glow.',
    palette:
      'Deep charcoal-aubergine base (#17141a) or espresso (#1b140f) with warm candle gold (#d4a657) and a soft cream (#f3e9dc) for light sections. Sparse, warm, expensive.',
    typography:
      'Elegant high-contrast serif (Cormorant Garamond or Playfair Display) at large sizes, one italic accent word; refined sans (Jost or Manrope) for menu text. Dish names in serif, descriptions small and quiet.',
    layout:
      'Full-viewport food-photo hero under a dark vignette; a restrained chip (cuisine · city); centered serif headline; two CTAs (Call to order / Get directions). Menu highlights as a two-column menu-card list with hairline dividers and dotted leaders. Three-photo ambiance strip, photo+text story split, a Visit card with map link + \'Call for today\'s hours\', quote-style reviews, photo-backed CTA band, dark footer.',
    motion:
      'Slow and candlelit: 16–20s Ken Burns hero, soft fade-and-rise reveals with gentle stagger, gold shimmer across the accent word, images brighten subtly on hover. No bounce, no ticker rush.',
    photo: 'Rich plated-dish and dim-interior photos under warm dark gradients; thin gold hairline frames on splits; the hero is always a food or dining-room shot.',
  },
  {
    id: 'trattoria-rustic',
    name: 'Trattoria Rustic',
    trades: ['italian', 'pizza', 'pizzeria', 'trattoria', 'ristorante', 'mediterranean', 'greek', 'portuguese', 'brazilian', 'family restaurant', 'restaurant'],
    mood: 'Red-sauce warmth — brick oven, flour on the counter, a family table that never ends.',
    palette:
      'Warm cream (#f6efe3) with tomato red (#b5362b), basil green (#3d6b45) and oven-char brown (#2b1d16). Light, warm and appetizing; red used decisively on CTAs and the accent word.',
    typography:
      'Characterful display serif (Fraunces or Lora at heavy weight) for headlines; friendly sans (Nunito Sans or Work Sans) for body; small tracked caps for menu section labels.',
    layout:
      'Hero: oversized food photo (pizza/pasta) with a soft cream gradient from the left so the headline sits on cream; cuisine chip; CTAs Call to order / Get directions. Menu highlights as paper-card grid grouped Starters / Mains / Desserts. Ambiance strip of 3 rounded photos; photo+text story split; Visit card; reviews; CTA band on a dark-red photo wash; cream footer.',
    motion:
      'Warm and lively: soft rise reveals, gentle 1.03 image zoom on hover, the accent word underlines itself, a slow steam SVG flourish in the hero. Inviting, never frantic.',
    photo: 'Warm, saturated food photos in generously rounded frames; cream overlays only; hero always a dish.',
  },
  {
    id: 'fiesta-color',
    name: 'Fiesta Color',
    trades: ['mexican', 'taqueria', 'latin', 'puerto rican', 'dominican', 'caribbean', 'cuban', 'peruvian', 'guatemalan', 'central american', 'tex-mex', 'cantina', 'restaurant'],
    mood: 'Bright street-food energy — papel picado color, lime and chili, music in the kitchen.',
    palette:
      'Warm white (#fff8ef) with hot coral (#e4572e), marigold (#f4b73f), deep teal (#135c6b) and a touch of lime (#9bc53d). Colorful but disciplined: one dominant accent per section.',
    typography:
      'Bold condensed display (Bebas Neue or Oswald) for headlines with a rounded accent word (Fraunces italic); clean rounded sans (Nunito or Poppins) for body.',
    layout:
      'Hero: full-bleed tacos/plated-food photo with a teal-to-transparent overlay, a color-block headline card, chips (cuisine · city), CTAs Call to order / Get directions. A colorful marquee of dish words. Menu highlights as bright tiles with a tiny SVG icon each. Ambiance strip, story split on a marigold panel, Visit card, reviews on colored cards, CTA band, teal footer.',
    motion:
      'Energetic but tasteful: staggered pop-in reveals, tiles lift on hover, the marquee scrolls at a brisk pace, a papel-picado SVG border gently sways. Respect reduced motion.',
    photo: 'Vivid, saturated food photos with light teal/coral tints on overlays; chunky rounded frames; the hero is always food.',
  },
  {
    id: 'harbor-seafood',
    name: 'Harbor Seafood',
    trades: ['seafood', 'oyster', 'fish', 'clam', 'lobster', 'waterfront', 'harbor', 'marina', 'crab', 'chowder', 'restaurant', 'bar & grill'],
    mood: 'New England waterfront — weathered boards, navy and sea-salt white, a sunset on the deck.',
    palette:
      'Sea-salt white (#f5f7f6) with deep navy (#122a3a), driftwood (#b9a68a) and a coral-sunset accent (#e2724f). Fresh, breezy, trustworthy.',
    typography:
      'Classic nautical serif (Libre Baskerville or Playfair Display) for headlines, condensed caps (Oswald) for small labels, clean sans (Source Sans 3 or Work Sans) for body.',
    layout:
      'Hero: waterfront-terrace or seafood-platter photo under a navy gradient; chip (cuisine · city); CTAs Call to order / Get directions. Menu highlights as a two-column \'from the dock\' list with rope-line SVG dividers. Ambiance strip, story split with a driftwood-toned panel, Visit card, reviews, CTA band over a sunset-terrace photo, navy footer.',
    motion:
      'Easy like a tide: slow hero drift, soft reveals, a wave-line SVG that draws across section breaks, gentle hover lifts. Calm, no bounce.',
    photo: 'Bright coastal and seafood photos with cool navy overlays; hairline frames; the hero is a terrace or a platter.',
  },
  {
    id: 'morning-light-cafe',
    name: 'Morning Light Cafe',
    trades: ['cafe', 'café', 'coffee', 'espresso', 'bakery', 'brunch', 'breakfast', 'diner', 'pastry', 'donut', 'bagel', 'tea', 'juice', 'sandwich', 'deli'],
    mood: 'Soft morning sun through a cafe window — milk foam, warm wood, a quiet table.',
    palette:
      'Warm white (#fbf8f3) with latte (#c9a27e), oat (#efe6d8), espresso brown (#3b2a21) and a leafy green accent (#5f7f5a). Airy, soft, lots of breathing room.',
    typography:
      'Rounded friendly serif (Fraunces or DM Serif Display) for headlines; soft geometric sans (Nunito or Mulish) for body; generous line-height.',
    layout:
      'Hero: bright cafe-interior or breakfast photo with no dark overlay (headline sits on a warm-white panel beside it); chip (cuisine · city); CTAs Call / Get directions. Menu highlights as soft cards grouped Coffee / Food / Sweets. Ambiance strip of 3 light photos, story split, Visit card (\'Call for today\'s hours\'), reviews, soft CTA band, light footer.',
    motion:
      'Gentle: soft fade-up reveals, a slow sunlight gradient drift in the hero, cards float up 4px on hover, the accent word fades in last. Calm and warm.',
    photo: 'Bright, airy photos with lots of natural light; soft rounded frames; light oat overlays only; never dark.',
  },
]

// ── Selection ────────────────────────────────────────────────────────────────

/**
 * Loose trade matching shared by design-system selection AND niche-playbook
 * selection (nichePlaybooks.ts), so both resolve a booking's trade the same way.
 * A tag matches when: it's a whole word of the trade (handles short tags like
 * "bar"/"it"/"ev" without matching mid-word), OR — for tags of 4+ chars — the
 * trade contains the tag phrase, or the tag contains the (4+ char) trade.
 */
export function matchesTrade(tags: string[], trade: string | undefined | null): boolean {
  const t = (trade ?? '').toLowerCase().trim()
  if (!t) return false
  const words = t.split(/[^a-z]+/).filter(Boolean)
  return tags.some(
    (tag) =>
      words.includes(tag) ||
      (tag.length >= 4 && (t.includes(tag) || (t.length >= 4 && tag.includes(t)))),
  )
}

/** Deterministic 32-bit djb2 hash — stable across isolates and runs (no RNG). */
function hash(s: string): number {
  let h = 5381
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0
  return Math.abs(h)
}

/** Look up a style by id (for manual overrides). Returns undefined if unknown. */
export function designSystemById(
  systems: DesignSystem[],
  id: string | undefined | null,
): DesignSystem | undefined {
  if (!id) return undefined
  return systems.find((d) => d.id === id)
}

/**
 * Pick a design system for a booking from `systems`. Trade-aware + deterministic:
 * - build a pool of styles that fit the trade (word/phrase match) PLUS all
 *   universal styles (trades: []) — unless 2+ styles match, then trade-fit only;
 *   if nothing matches, the pool is everything;
 * - choose deterministically from the pool via a hash of `seed` (the appointment
 *   id), so all 3 stages and any retry resolve to the exact same style.
 */
export function selectDesignSystem(
  systems: DesignSystem[],
  seed: string,
  trade?: string | null,
): DesignSystem {
  const pool0 = systems.length ? systems : DEFAULT_DESIGN_SYSTEMS
  const universal = pool0.filter((d) => d.trades.length === 0)
  const matched = pool0.filter((d) => matchesTrade(d.trades, trade))
  // 2+ trade-fit styles → stay on-trade; a FOOD business stays on-trade with even one match
  // (a restaurant must never get a corporate/contractor look — 2026-11-04);
  // otherwise exactly 1 → add the universals for variety; 0 → everything is eligible.
  const pool = matched.length >= 2 || (matched.length && isFoodBusiness(trade))
    ? matched
    : matched.length
      ? [...new Map([...matched, ...universal].map((d) => [d.id, d])).values()]
      : pool0
  return pool[hash(seed) % pool.length]
}

// ── Prompt rendering ─────────────────────────────────────────────────────────

/**
 * Render the ART DIRECTION block for a chosen style. This REPLACES the old
 * hard-coded dark-luxury block; the surrounding scaffolding (output contract,
 * photo library, motion craft, truthfulness) stays constant in generate-site.
 */
export function renderArtDirection(ds: DesignSystem): string {
  return `ART DIRECTION — "${ds.name}": ${ds.mood}
This style is the identity of the site. Build the full page structure the request asks for (every section it lists, in order) but execute EVERY choice — color, type, spacing, shape, motion, imagery — in THIS style. Do not drift toward a generic look.
- PALETTE: ${ds.palette} Define these as CSS custom properties once and reference them everywhere.
- TYPOGRAPHY: ${ds.typography} Load exactly two Google Font families. NEVER Inter/Roboto/Arial/system unless this style names them.
- LAYOUT & COMPOSITION: ${ds.layout}
- MOTION SIGNATURE: ${ds.motion}
- PHOTOGRAPHY: ${ds.photo}
Adapt the shared ingredients to fit: e.g. a minimal style keeps the marquee a whisper-thin ticker and motion restrained; a bold style makes them loud. The ingredients are required, but their intensity serves the style.`
}
