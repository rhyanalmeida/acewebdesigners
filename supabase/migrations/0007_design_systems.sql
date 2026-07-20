-- 0007_design_systems.sql
-- Design reference library: the source of truth for generate-site's art directions.
-- Editable without a code deploy (Supabase dashboard / SQL). generate-site reads
-- active rows and falls back to the bundled DEFAULT_DESIGN_SYSTEMS if this is empty
-- or unreadable, so bookings are never blocked. Re-running this migration re-seeds
-- (upsert) any row whose id already exists.

create table if not exists public.design_systems (
  id         text primary key,
  name       text not null,
  trades     text[] not null default '{}',   -- trade keywords; empty = universal
  mood       text not null,
  palette    text not null,
  typography text not null,
  layout     text not null,
  motion     text not null,
  photo      text not null,
  active     boolean not null default true,
  sort       int not null default 0,
  updated_at timestamptz not null default now()
);

alter table public.design_systems enable row level security;
-- Edge Functions use the service_role key (bypasses RLS). Authenticated admins may read.
drop policy if exists "design_systems read" on public.design_systems;
create policy "design_systems read" on public.design_systems for select to authenticated using (true);

insert into public.design_systems (id, name, trades, mood, palette, typography, layout, motion, photo, sort) values (
  'nocturne-luxe', 'Nocturne Luxe', '{}'::text[],
  'Dark, cinematic, expensive — a moody photographic showcase with one glowing accent.',
  'Near-black base (#0d0f0d–#12141a) with ONE luxurious metallic accent: antique gold (#c8a24a), brass (#b08d57), or ember (#d9633b). Light cream (#f5f1e8) sections for contrast. Opens dark.',
  'High-contrast display serif (Fraunces or Playfair Display) for headlines with one accent-italic word; clean geometric body (Manrope or Sora). Uppercase tracked labels for eyebrows/chips.',
  'Full-viewport photographic hero under a dark gradient, badge chip + serif headline (one italic accent word) + dual CTAs + trust chips. Alternating dark/light sections, offset-shadow photo splits, photo-backed CTA band, rich multi-column footer.',
  'Slow 14–20s Ken Burns hero zoom; staggered hero cascade; the accent-italic word wipes in then carries a slow gold shimmer + self-drawing underline; card lifts, button shine sweeps, counters count up.',
  'Dark-overlay hero + framed splits. Use the trade photos at full richness under gradient overlays.', 0
) on conflict (id) do update set
  name=excluded.name, trades=excluded.trades, mood=excluded.mood, palette=excluded.palette,
  typography=excluded.typography, layout=excluded.layout, motion=excluded.motion,
  photo=excluded.photo, sort=excluded.sort, updated_at=now();

insert into public.design_systems (id, name, trades, mood, palette, typography, layout, motion, photo, sort) values (
  'editorial-serif', 'Editorial Serif', '{}'::text[],
  'Quiet luxury of a print magazine: warm paper, huge serifs, disciplined whitespace.',
  'Warm off-white paper (#f7f4ee), ink near-black (#1a1a17), one restrained accent — oxblood (#7a2e2e), forest (#2f4a3a), or navy (#1f2d4a). Mostly light; type does the work.',
  'Large high-contrast serif (Playfair Display or Fraunces) at generous sizes; small-caps tracked labels; body in a humanist sans (Work Sans or Mulish) with roomy line-height.',
  'Editorial hero: oversized serif headline + thin rules + a single framed photo, no dark overlay. Wide margins, asymmetric two-column text, hairline dividers, numbered sections, understated cards. Minimal chrome.',
  'Restrained and elegant: soft fade-and-rise reveals, a thin accent scroll-progress line, underlines that draw on hover. No Ken Burns, no marquee flash — keep the marquee a whisper-thin ticker.',
  'Bright framed editorial photos (rounded or hairline-bordered). No heavy overlays; let images sit clean on paper.', 1
) on conflict (id) do update set
  name=excluded.name, trades=excluded.trades, mood=excluded.mood, palette=excluded.palette,
  typography=excluded.typography, layout=excluded.layout, motion=excluded.motion,
  photo=excluded.photo, sort=excluded.sort, updated_at=now();

insert into public.design_systems (id, name, trades, mood, palette, typography, layout, motion, photo, sort) values (
  'brutalist-mono', 'Brutalist Mono', ARRAY['welding', 'fabrication', 'metal', 'construction', 'demolition', 'concrete', 'auto']::text[],
  'Loud, confident, high-contrast — oversized type, hard edges, no decoration.',
  'Stark black (#0a0a0a) and white (#ffffff) with ONE hot accent — safety orange (#ff4d00), electric lime (#b6f500), or red (#e10600). Flat fills, hard borders, zero gradients.',
  'Oversized grotesque display (Space Grotesk or Archivo Black) in ALL-CAPS blocks; monospace (IBM Plex Mono / Space Mono) for labels and stats; body in Space Grotesk regular.',
  'Type-first hero: giant caps headline, thick 3–4px borders, visible grid lines, boxed sections. A bold running marquee, stat blocks in hard-ruled cells, service cards as bordered rectangles that invert on hover.',
  'Snappy, mechanical: instant invert-on-hover, marquee scrolls fast, headline letters slam in, borders draw. Nothing soft or floaty.',
  'High-contrast duotone or grayscale photos in hard-bordered blocks; small, punchy, never full-bleed soft.', 2
) on conflict (id) do update set
  name=excluded.name, trades=excluded.trades, mood=excluded.mood, palette=excluded.palette,
  typography=excluded.typography, layout=excluded.layout, motion=excluded.motion,
  photo=excluded.photo, sort=excluded.sort, updated_at=now();

insert into public.design_systems (id, name, trades, mood, palette, typography, layout, motion, photo, sort) values (
  'warm-craftsman', 'Warm Craftsman', ARRAY['carpentry', 'woodworking', 'remodel', 'remodeling', 'handyman', 'flooring', 'cabinet', 'furniture', 'bakery', 'coffee']::text[],
  'Handmade warmth — earthy, tactile, artisan pride.',
  'Clay/terracotta (#b5623a), warm cream (#f2e8d5), deep charcoal-brown (#2b241d), with a muted sage (#8a9a7b) secondary. Textured, cozy, never cold.',
  'Characterful serif (Fraunces at a warm optical size) for headlines; friendly grotesque (Work Sans or Epilogue) for body; hand-lettered feel via italic accents.',
  'Warm photographic hero with a paper-grain overlay; badge chip in accent; wood-tone section bands; photo splits with hand-drawn arrow/underline SVGs; craft-detail service cards.',
  'Organic: gentle rise reveals, hand-drawn SVG underlines and arrows that sketch themselves, subtle grain, soft card lifts. Warm and unhurried.',
  'Warm-toned photos, softly overlaid; favor material/detail shots (wood, tools, hands) in rounded frames.', 3
) on conflict (id) do update set
  name=excluded.name, trades=excluded.trades, mood=excluded.mood, palette=excluded.palette,
  typography=excluded.typography, layout=excluded.layout, motion=excluded.motion,
  photo=excluded.photo, sort=excluded.sort, updated_at=now();

insert into public.design_systems (id, name, trades, mood, palette, typography, layout, motion, photo, sort) values (
  'fresh-botanical', 'Fresh Botanical', ARRAY['landscaping', 'lawn', 'garden', 'gardening', 'tree', 'florist', 'nursery', 'wellness', 'spa']::text[],
  'Airy and organic — sunlight, greenery, room to breathe.',
  'Soft cream (#f4f6ef), sage/forest greens (#3f6b4c, #8fae8b), warm sand accent (#d8b78a). Bright and natural; light-dominant.',
  'Elegant display serif (DM Serif Display or Fraunces) paired with a rounded humanist sans (Nunito Sans or Mulish). Soft, welcoming sizes.',
  'Bright airy hero (light photo, minimal overlay) with organic blob/leaf SVG shapes; generous whitespace; curved section dividers; rounded cards; a calm marquee of services.',
  'Soft and breezy: gentle float on decorative leaves/blobs, fade-and-rise reveals, curved dividers, buttons that grow softly. Nothing harsh.',
  'Bright, sunlit photos with light or no overlay; rounded corners; greenery/outdoor shots preferred.', 4
) on conflict (id) do update set
  name=excluded.name, trades=excluded.trades, mood=excluded.mood, palette=excluded.palette,
  typography=excluded.typography, layout=excluded.layout, motion=excluded.motion,
  photo=excluded.photo, sort=excluded.sort, updated_at=now();

insert into public.design_systems (id, name, trades, mood, palette, typography, layout, motion, photo, sort) values (
  'clean-corporate-trust', 'Clean Corporate Trust', '{}'::text[],
  'Crisp, reassuring, professional — the look of a company you can trust with your home.',
  'Deep trustworthy blue (#123a6b / #0e2f5c), clean white, cool steel grays (#eef2f7), one bright accent (#2e8bff or #17b978). Light, orderly, high legibility.',
  'Confident geometric sans for headlines (Sora or Manrope, tight weights) + Manrope body. Clear hierarchy, no serifs needed. Uppercase micro-labels.',
  'Clean hero: photo or subtle gradient, bold sans headline, crisp dual CTAs, trust badges. Card-based service grid, an icon feature row, a stat band, tidy testimonial cards, structured footer.',
  'Precise and subtle: clean fade-ups, count-up stats, gentle card lifts, a thin accent progress bar, hover elevation on cards. Professional restraint.',
  'Bright, clean photos with light overlays; crisp rounded cards; real-work / crew shots build trust.', 5
) on conflict (id) do update set
  name=excluded.name, trades=excluded.trades, mood=excluded.mood, palette=excluded.palette,
  typography=excluded.typography, layout=excluded.layout, motion=excluded.motion,
  photo=excluded.photo, sort=excluded.sort, updated_at=now();

insert into public.design_systems (id, name, trades, mood, palette, typography, layout, motion, photo, sort) values (
  'bold-athletic', 'Bold Athletic', ARRAY['gym', 'fitness', 'auto', 'automotive', 'detailing', 'moving', 'movers', 'sports', 'training', 'towing']::text[],
  'High energy, kinetic, muscular — motion and momentum.',
  'Near-black (#0c0c0e) with an electric accent — volt lime (#c8ff00), blaze orange (#ff5a1f), or cyan (#00e0ff). Bold, punchy, diagonal energy.',
  'Condensed heavy display (Archivo Black or Anton) in caps + Barlow / Barlow Semi Condensed body. Italic slants for speed.',
  'Dynamic hero with diagonal/skewed cuts and a bold slashed headline; angled section dividers; oversized stat counters; energetic service cards; a fast marquee of promises.',
  'Fast and kinetic: diagonal wipes, numbers that race up, skew-on-hover cards, quick staggered slams, a bold shine on CTAs. Momentum everywhere.',
  'High-energy photos with dark overlay + accent tint; diagonal masks; motion-implied crops.', 6
) on conflict (id) do update set
  name=excluded.name, trades=excluded.trades, mood=excluded.mood, palette=excluded.palette,
  typography=excluded.typography, layout=excluded.layout, motion=excluded.motion,
  photo=excluded.photo, sort=excluded.sort, updated_at=now();

insert into public.design_systems (id, name, trades, mood, palette, typography, layout, motion, photo, sort) values (
  'coastal-calm', 'Coastal Calm', ARRAY['pool', 'cleaning', 'spa', 'window', 'pressure washing', 'marine', 'boat', 'hvac']::text[],
  'Breezy and clean — sea air, soft light, effortless.',
  'Soft sky/teal blues (#2a7fa6, #bfe3ec), warm sand (#efe6d6), crisp white. Light, fresh, watery.',
  'Warm display serif (Fraunces) or soft sans (Quicksand) headlines + Mulish body. Relaxed, friendly.',
  'Light hero with a gentle wave SVG divider; airy sections; soft-shadow rounded cards; a calm services marquee; wave/curve dividers between bands.',
  'Gentle drift: subtle wave-shape animation, soft fade-rise, buttons that ripple, easy card lifts. Serene, never jumpy.',
  'Bright, watery, sunlit photos with light overlays; soft rounded frames.', 7
) on conflict (id) do update set
  name=excluded.name, trades=excluded.trades, mood=excluded.mood, palette=excluded.palette,
  typography=excluded.typography, layout=excluded.layout, motion=excluded.motion,
  photo=excluded.photo, sort=excluded.sort, updated_at=now();

insert into public.design_systems (id, name, trades, mood, palette, typography, layout, motion, photo, sort) values (
  'modern-tech-minimal', 'Modern Tech Minimal', ARRAY['solar', 'security', 'smart home', 'ev', 'electrical', 'electric', 'it', 'networking', 'alarm', 'audio', 'automation']::text[],
  'Sleek, futuristic, precise — a premium product page for a service.',
  'Dark slate/graphite (#0f1420, #161b26) with ONE luminous accent — cyan (#22d3ee), violet (#8b5cf6, used tastefully on dark), or electric blue (#3b82f6). Subtle glow, fine gridlines.',
  'Grotesque display (Space Grotesk or Sora) + Manrope body. Tight tracking, precise weights, mono for spec labels.',
  'Dark hero with a faint dotted/grid backdrop and a soft accent glow behind the headline; glassy cards with thin borders; a spec-style stat band; sleek feature rows; subtle gradient CTA band.',
  'Precise, glowing: soft accent glow pulses, gridlines fade in, cards get a thin animated border sheen, numbers tick up, smooth spring reveals.',
  'Photos in glassy/bordered frames with a slight accent duotone; dark treatment; or subtle abstract backdrops over solid dark.', 8
) on conflict (id) do update set
  name=excluded.name, trades=excluded.trades, mood=excluded.mood, palette=excluded.palette,
  typography=excluded.typography, layout=excluded.layout, motion=excluded.motion,
  photo=excluded.photo, sort=excluded.sort, updated_at=now();

insert into public.design_systems (id, name, trades, mood, palette, typography, layout, motion, photo, sort) values (
  'vintage-signage', 'Vintage Signage', ARRAY['barber', 'barbershop', 'butcher', 'brewery', 'brewing', 'tattoo', 'mechanic', 'pizza', 'diner', 'deli']::text[],
  'Heritage craftsmanship — enamel signs, crests, hand-painted confidence.',
  'Cream (#f2e9d8) with oxblood (#7c2b2b) or deep navy (#1e2a44) and antique gold (#c69749) detailing. Warm, storied, slightly aged.',
  'Bold slab/serif display (Playfair Display or DM Serif Display) with condensed caps (Oswald) for signage labels; body in a sturdy serif (Lora) or Work Sans.',
  'Emblem hero: a crest/badge SVG, arched or ribboned headline, established-style eyebrow (generic, no invented year), enamel-sign section labels; framed vintage-toned photos; ticketed service cards.',
  'Characterful but tasteful: badge draws in, ribbon reveals, subtle grain, gentle rise. Retro without gimmicks.',
  'Warm vintage-toned photos (sepia/duotone) in bordered frames; craft/close-up shots.', 9
) on conflict (id) do update set
  name=excluded.name, trades=excluded.trades, mood=excluded.mood, palette=excluded.palette,
  typography=excluded.typography, layout=excluded.layout, motion=excluded.motion,
  photo=excluded.photo, sort=excluded.sort, updated_at=now();

insert into public.design_systems (id, name, trades, mood, palette, typography, layout, motion, photo, sort) values (
  'luxe-neutral-beauty', 'Luxe Neutral', ARRAY['salon', 'beauty', 'med spa', 'medspa', 'aesthetics', 'nails', 'hair', 'boutique', 'lash', 'skincare', 'interior']::text[],
  'Refined and soft — a high-end salon or boutique, understated elegance.',
  'Warm taupe/greige (#e7ded4), soft blush (#e6c8be), espresso (#3a2f28), with a thin gold hairline accent (#b9975b). Muted, pampered, calm.',
  'Elegant thin serif (Cormorant Garamond or Fraunces light) for headlines + clean geometric sans (Jost or Manrope) body. Airy tracking, delicate weights.',
  'Soft minimalist hero (light photo, faint overlay), delicate serif headline, thin gold divider; generous whitespace; elegant thin-bordered cards; refined splits; understated CTA.',
  'Delicate: slow fades, thin gold lines that draw, gentle image reveals, soft hover. Elegance over energy.',
  'Soft, bright, warm-neutral photos with faint overlays; thin-bordered or rounded frames.', 10
) on conflict (id) do update set
  name=excluded.name, trades=excluded.trades, mood=excluded.mood, palette=excluded.palette,
  typography=excluded.typography, layout=excluded.layout, motion=excluded.motion,
  photo=excluded.photo, sort=excluded.sort, updated_at=now();

insert into public.design_systems (id, name, trades, mood, palette, typography, layout, motion, photo, sort) values (
  'industrial-steel', 'Industrial Steel', ARRAY['welding', 'machining', 'fabrication', 'plumbing', 'hvac', 'excavation', 'paving', 'roofing', 'industrial', 'commercial']::text[],
  'Heavy-duty and precise — steel, blueprints, engineered trust.',
  'Gunmetal/graphite (#23262b, #34383f) with safety amber/yellow (#f2b100) or hazard orange (#e85d04) accent, concrete gray (#d8d5cf) light sections. Utilitarian, solid.',
  'Industrial grotesque (Archivo or Chivo) caps headlines + Barlow Condensed labels + Barlow body. Stencil-adjacent, blueprint-like.',
  'Rugged hero (dark photo + gradient), amber badge chip, blocky headline; blueprint-grid backdrops; hard-edged stat cells; heavy bordered service cards; measured section rhythm.',
  'Mechanical: gridlines draw, counters tick like gauges, panels slide, bolt/rivet SVG accents. Precise, grounded, no float.',
  'Gritty industrial photos with dark overlay + slight desaturation; hard-cornered frames.', 11
) on conflict (id) do update set
  name=excluded.name, trades=excluded.trades, mood=excluded.mood, palette=excluded.palette,
  typography=excluded.typography, layout=excluded.layout, motion=excluded.motion,
  photo=excluded.photo, sort=excluded.sort, updated_at=now();

insert into public.design_systems (id, name, trades, mood, palette, typography, layout, motion, photo, sort) values (
  'appetite-market', 'Appetite Market', ARRAY['restaurant', 'catering', 'cafe', 'food', 'grocery', 'bakery', 'kitchen', 'bar', 'juice']::text[],
  'Fresh and appetizing — makes you hungry, warm and inviting.',
  'Warm tomato/paprika red (#c8462f) or mustard (#e0a52e) with cream (#f6efe2) and leafy green (#3f6b3f). Appetizing, warm, energetic-but-cozy.',
  'Friendly display serif (Fraunces or DM Serif Display) + clean sans (Epilogue or Work Sans). Menu-like labels in tracked caps.',
  'Mouth-watering photo hero with warm overlay; menu-style section labels; ingredient/dish photo splits; a specials marquee; appetizing service/menu cards with prices ONLY if provided.',
  'Warm and lively: soft rise reveals, gentle image zoom on hover, steam/sparkle SVG touches, counters for playful stats. Inviting, not frantic.',
  'Rich, warm food/interior photos; light-to-medium warm overlays; rounded frames; full-bleed hero.', 12
) on conflict (id) do update set
  name=excluded.name, trades=excluded.trades, mood=excluded.mood, palette=excluded.palette,
  typography=excluded.typography, layout=excluded.layout, motion=excluded.motion,
  photo=excluded.photo, sort=excluded.sort, updated_at=now();

insert into public.design_systems (id, name, trades, mood, palette, typography, layout, motion, photo, sort) values (
  'nordic-light', 'Nordic Light', ARRAY['architecture', 'architect', 'design', 'dental', 'dentist', 'optometry', 'medical', 'clinic', 'accounting', 'law', 'consulting']::text[],
  'Scandinavian minimalism — pale, precise, serene, expensive in its restraint.',
  'Near-white (#fafafa), pale warm grays (#eceae6), soft muted blue or clay accent (#6b8ea3 / #c07a5b), ink text (#1c1c1c). Ultra-light, lots of air.',
  'A light editorial serif (Fraunces light) or refined grotesque (Sora) headlines + Manrope body. Tight, quiet, generous line-height.',
  'Minimal hero: small eyebrow, a calm medium headline, one clean framed photo, lots of negative space. Sparse hairline-divided sections, roomy cards, a barely-there ticker, restrained footer.',
  'Whisper-quiet: slow fades, a hairline progress bar, subtle image reveals. Almost still — the calm IS the design.',
  'Bright, airy, desaturated photos with no overlay; clean rounded or hairline frames; lots of surrounding whitespace.', 13
) on conflict (id) do update set
  name=excluded.name, trades=excluded.trades, mood=excluded.mood, palette=excluded.palette,
  typography=excluded.typography, layout=excluded.layout, motion=excluded.motion,
  photo=excluded.photo, sort=excluded.sort, updated_at=now();

insert into public.design_systems (id, name, trades, mood, palette, typography, layout, motion, photo, sort) values (
  'sunset-glow', 'Sunset Glow', ARRAY['photography', 'photographer', 'events', 'event', 'dj', 'nightlife', 'entertainment', 'videography', 'wedding', 'creative']::text[],
  'Warm, glowing, atmospheric — golden hour and soft neon.',
  'Deep plum/aubergine base (#231428) flowing into ember and rose (#e0654a → #d98a8a) accent glows. Dark with luminous gradients used tastefully (never flat purple-on-white).',
  'Expressive display serif (Fraunces or Playfair) + Sora body. One accent word in a warm gradient.',
  'Atmospheric hero with a soft radial glow behind the headline; gradient-lit section bands; glassy cards; a glowing stat band; immersive photo-backed CTA.',
  'Luminous: slow gradient drift, accent-word gradient shimmer, soft glow pulses on reveal, smooth parallax-lite image drift.',
  'Moody, warm-lit photos under gradient overlays; full-bleed hero; glow-edged frames.', 14
) on conflict (id) do update set
  name=excluded.name, trades=excluded.trades, mood=excluded.mood, palette=excluded.palette,
  typography=excluded.typography, layout=excluded.layout, motion=excluded.motion,
  photo=excluded.photo, sort=excluded.sort, updated_at=now();

insert into public.design_systems (id, name, trades, mood, palette, typography, layout, motion, photo, sort) values (
  'heritage-green-gold', 'Heritage Green & Gold', ARRAY['law', 'attorney', 'legal', 'real estate', 'realtor', 'financial', 'insurance', 'landscaping', 'country club', 'property']::text[],
  'Established, trustworthy, traditional luxury — old-money confidence.',
  'Hunter/forest green (#1f3d2e), antique gold (#c3a24a), warm cream (#f3ecdd), ink (#161a16). Classic, dignified, reassuring.',
  'Traditional high-contrast serif (Playfair Display) headlines + a readable serif (Lora) or Work Sans body. Small-caps tracked labels, crest energy.',
  'Stately hero (rich photo + green/gradient overlay, or solid green with a gold monogram); crest/monogram SVG; formal section rhythm; bordered testimonial cards; column-rule footer with fine gold hairlines.',
  'Dignified: gold hairlines draw in, crest reveals, slow fade-rise, subtle counters. Composed and unhurried.',
  'Rich, classic photos with green/dark overlays; framed with thin gold borders.', 15
) on conflict (id) do update set
  name=excluded.name, trades=excluded.trades, mood=excluded.mood, palette=excluded.palette,
  typography=excluded.typography, layout=excluded.layout, motion=excluded.motion,
  photo=excluded.photo, sort=excluded.sort, updated_at=now();

insert into public.design_systems (id, name, trades, mood, palette, typography, layout, motion, photo, sort) values (
  'playful-rounded', 'Playful Rounded', ARRAY['daycare', 'childcare', 'pet', 'dog', 'grooming', 'kids', 'party', 'tutoring', 'cleaning', 'ice cream']::text[],
  'Cheerful, friendly, approachable — big smiles and soft shapes.',
  'Bright cheerful trio on white: coral (#ff6b6b), teal (#22c1c3), sunny yellow (#ffd23f). Playful, warm, high-energy-friendly.',
  'Rounded display (Baloo 2 or Quicksand bold) + Nunito body. Soft, bouncy, big-hearted.',
  'Bright hero with rounded blob shapes and a friendly headline; big pill CTAs; super-rounded cards; wavy/blob dividers; a bouncy services marquee; smiley trust chips.',
  'Bouncy and delightful: springy hover pops, blobs that wobble gently, cards that bounce up on reveal, playful button squish. Fun but tasteful.',
  'Bright, joyful photos in heavily rounded frames; light overlays; happy/people shots preferred.', 16
) on conflict (id) do update set
  name=excluded.name, trades=excluded.trades, mood=excluded.mood, palette=excluded.palette,
  typography=excluded.typography, layout=excluded.layout, motion=excluded.motion,
  photo=excluded.photo, sort=excluded.sort, updated_at=now();

insert into public.design_systems (id, name, trades, mood, palette, typography, layout, motion, photo, sort) values (
  'mono-noir', 'Mono Noir', ARRAY['photography', 'boutique', 'salon', 'fashion', 'gallery', 'studio', 'design', 'jewelry', 'architect']::text[],
  'Fashion-editorial monochrome — pure black, white, and one decisive red.',
  'Pure black (#000) and white (#fff) with ONE decisive accent — red (#e10600) or a single warm gold hairline. Zero clutter, maximum contrast.',
  'Ultra high-contrast Didone serif (Playfair Display) at large sizes + a clean grotesque (Archivo or Manrope) for body/labels. Fashion-magazine hierarchy.',
  'Bold monochrome hero: enormous serif headline, a single striking black-and-white photo, thin accent rule; gallery-grid sections; minimal captions; a quiet thin ticker; sparse, confident footer.',
  'Sharp and slow: elegant clip-path wipes, a single accent line draw, slow image fade, restrained hover. Precision over playfulness.',
  'Black-and-white / grayscale photos; full-bleed or gallery-grid; the ONE accent color reserved for type only.', 17
) on conflict (id) do update set
  name=excluded.name, trades=excluded.trades, mood=excluded.mood, palette=excluded.palette,
  typography=excluded.typography, layout=excluded.layout, motion=excluded.motion,
  photo=excluded.photo, sort=excluded.sort, updated_at=now();

