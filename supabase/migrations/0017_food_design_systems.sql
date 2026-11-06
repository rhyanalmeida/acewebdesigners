-- 0017_food_design_systems.sql
-- Five food-and-drink art directions for the restaurant outbound funnel (2026-11-04).
-- Mirrors DEFAULT_DESIGN_SYSTEMS in _shared/designSystems.ts (the seed/fallback).
insert into public.design_systems (id, name, trades, mood, palette, typography, layout, motion, photo, sort) values (
  'candlelit-bistro', 'Candlelit Bistro', array['restaurant', 'bistro', 'steak', 'steakhouse', 'chophouse', 'sushi', 'japanese', 'wine', 'fine dining', 'tavern', 'oyster', 'new american']::text[],
  'Dinner-date dark — candlelight, linen, a hush of luxury that makes the food glow.',
  'Deep charcoal-aubergine base (#17141a) or espresso (#1b140f) with warm candle gold (#d4a657) and a soft cream (#f3e9dc) for light sections. Sparse, warm, expensive.',
  'Elegant high-contrast serif (Cormorant Garamond or Playfair Display) at large sizes, one italic accent word; refined sans (Jost or Manrope) for menu text. Dish names in serif, descriptions small and quiet.',
  'Full-viewport food-photo hero under a dark vignette; a restrained chip (cuisine · city); centered serif headline; two CTAs (Call to order / Get directions). Menu highlights as a two-column menu-card list with hairline dividers and dotted leaders. Three-photo ambiance strip, photo+text story split, a Visit card with map link + ''Call for today''s hours'', quote-style reviews, photo-backed CTA band, dark footer.',
  'Slow and candlelit: 16–20s Ken Burns hero, soft fade-and-rise reveals with gentle stagger, gold shimmer across the accent word, images brighten subtly on hover. No bounce, no ticker rush.',
  'Rich plated-dish and dim-interior photos under warm dark gradients; thin gold hairline frames on splits; the hero is always a food or dining-room shot.', 20
) on conflict (id) do update set
  name=excluded.name, trades=excluded.trades, mood=excluded.mood, palette=excluded.palette,
  typography=excluded.typography, layout=excluded.layout, motion=excluded.motion,
  photo=excluded.photo, sort=excluded.sort, active=true, updated_at=now();

insert into public.design_systems (id, name, trades, mood, palette, typography, layout, motion, photo, sort) values (
  'trattoria-rustic', 'Trattoria Rustic', array['italian', 'pizza', 'pizzeria', 'trattoria', 'ristorante', 'mediterranean', 'greek', 'portuguese', 'brazilian', 'family restaurant', 'restaurant']::text[],
  'Red-sauce warmth — brick oven, flour on the counter, a family table that never ends.',
  'Warm cream (#f6efe3) with tomato red (#b5362b), basil green (#3d6b45) and oven-char brown (#2b1d16). Light, warm and appetizing; red used decisively on CTAs and the accent word.',
  'Characterful display serif (Fraunces or Lora at heavy weight) for headlines; friendly sans (Nunito Sans or Work Sans) for body; small tracked caps for menu section labels.',
  'Hero: oversized food photo (pizza/pasta) with a soft cream gradient from the left so the headline sits on cream; cuisine chip; CTAs Call to order / Get directions. Menu highlights as paper-card grid grouped Starters / Mains / Desserts. Ambiance strip of 3 rounded photos; photo+text story split; Visit card; reviews; CTA band on a dark-red photo wash; cream footer.',
  'Warm and lively: soft rise reveals, gentle 1.03 image zoom on hover, the accent word underlines itself, a slow steam SVG flourish in the hero. Inviting, never frantic.',
  'Warm, saturated food photos in generously rounded frames; cream overlays only; hero always a dish.', 21
) on conflict (id) do update set
  name=excluded.name, trades=excluded.trades, mood=excluded.mood, palette=excluded.palette,
  typography=excluded.typography, layout=excluded.layout, motion=excluded.motion,
  photo=excluded.photo, sort=excluded.sort, active=true, updated_at=now();

insert into public.design_systems (id, name, trades, mood, palette, typography, layout, motion, photo, sort) values (
  'fiesta-color', 'Fiesta Color', array['mexican', 'taqueria', 'latin', 'puerto rican', 'dominican', 'caribbean', 'cuban', 'peruvian', 'guatemalan', 'central american', 'tex-mex', 'cantina', 'restaurant']::text[],
  'Bright street-food energy — papel picado color, lime and chili, music in the kitchen.',
  'Warm white (#fff8ef) with hot coral (#e4572e), marigold (#f4b73f), deep teal (#135c6b) and a touch of lime (#9bc53d). Colorful but disciplined: one dominant accent per section.',
  'Bold condensed display (Bebas Neue or Oswald) for headlines with a rounded accent word (Fraunces italic); clean rounded sans (Nunito or Poppins) for body.',
  'Hero: full-bleed tacos/plated-food photo with a teal-to-transparent overlay, a color-block headline card, chips (cuisine · city), CTAs Call to order / Get directions. A colorful marquee of dish words. Menu highlights as bright tiles with a tiny SVG icon each. Ambiance strip, story split on a marigold panel, Visit card, reviews on colored cards, CTA band, teal footer.',
  'Energetic but tasteful: staggered pop-in reveals, tiles lift on hover, the marquee scrolls at a brisk pace, a papel-picado SVG border gently sways. Respect reduced motion.',
  'Vivid, saturated food photos with light teal/coral tints on overlays; chunky rounded frames; the hero is always food.', 22
) on conflict (id) do update set
  name=excluded.name, trades=excluded.trades, mood=excluded.mood, palette=excluded.palette,
  typography=excluded.typography, layout=excluded.layout, motion=excluded.motion,
  photo=excluded.photo, sort=excluded.sort, active=true, updated_at=now();

insert into public.design_systems (id, name, trades, mood, palette, typography, layout, motion, photo, sort) values (
  'harbor-seafood', 'Harbor Seafood', array['seafood', 'oyster', 'fish', 'clam', 'lobster', 'waterfront', 'harbor', 'marina', 'crab', 'chowder', 'restaurant', 'bar & grill']::text[],
  'New England waterfront — weathered boards, navy and sea-salt white, a sunset on the deck.',
  'Sea-salt white (#f5f7f6) with deep navy (#122a3a), driftwood (#b9a68a) and a coral-sunset accent (#e2724f). Fresh, breezy, trustworthy.',
  'Classic nautical serif (Libre Baskerville or Playfair Display) for headlines, condensed caps (Oswald) for small labels, clean sans (Source Sans 3 or Work Sans) for body.',
  'Hero: waterfront-terrace or seafood-platter photo under a navy gradient; chip (cuisine · city); CTAs Call to order / Get directions. Menu highlights as a two-column ''from the dock'' list with rope-line SVG dividers. Ambiance strip, story split with a driftwood-toned panel, Visit card, reviews, CTA band over a sunset-terrace photo, navy footer.',
  'Easy like a tide: slow hero drift, soft reveals, a wave-line SVG that draws across section breaks, gentle hover lifts. Calm, no bounce.',
  'Bright coastal and seafood photos with cool navy overlays; hairline frames; the hero is a terrace or a platter.', 23
) on conflict (id) do update set
  name=excluded.name, trades=excluded.trades, mood=excluded.mood, palette=excluded.palette,
  typography=excluded.typography, layout=excluded.layout, motion=excluded.motion,
  photo=excluded.photo, sort=excluded.sort, active=true, updated_at=now();

insert into public.design_systems (id, name, trades, mood, palette, typography, layout, motion, photo, sort) values (
  'morning-light-cafe', 'Morning Light Cafe', array['cafe', 'café', 'coffee', 'espresso', 'bakery', 'brunch', 'breakfast', 'diner', 'pastry', 'donut', 'bagel', 'tea', 'juice', 'sandwich', 'deli']::text[],
  'Soft morning sun through a cafe window — milk foam, warm wood, a quiet table.',
  'Warm white (#fbf8f3) with latte (#c9a27e), oat (#efe6d8), espresso brown (#3b2a21) and a leafy green accent (#5f7f5a). Airy, soft, lots of breathing room.',
  'Rounded friendly serif (Fraunces or DM Serif Display) for headlines; soft geometric sans (Nunito or Mulish) for body; generous line-height.',
  'Hero: bright cafe-interior or breakfast photo with no dark overlay (headline sits on a warm-white panel beside it); chip (cuisine · city); CTAs Call / Get directions. Menu highlights as soft cards grouped Coffee / Food / Sweets. Ambiance strip of 3 light photos, story split, Visit card (''Call for today''s hours''), reviews, soft CTA band, light footer.',
  'Gentle: soft fade-up reveals, a slow sunlight gradient drift in the hero, cards float up 4px on hover, the accent word fades in last. Calm and warm.',
  'Bright, airy photos with lots of natural light; soft rounded frames; light oat overlays only; never dark.', 24
) on conflict (id) do update set
  name=excluded.name, trades=excluded.trades, mood=excluded.mood, palette=excluded.palette,
  typography=excluded.typography, layout=excluded.layout, motion=excluded.motion,
  photo=excluded.photo, sort=excluded.sort, active=true, updated_at=now();

-- catch-all food tags so every food category matches 2+ food styles
update public.design_systems set trades=array['restaurant', 'catering', 'cafe', 'food', 'grocery', 'bakery', 'kitchen', 'bar', 'juice', 'steak', 'diner', 'pub', 'grill', 'inn', 'tavern', 'eatery']::text[], updated_at=now() where id='appetite-market';
update public.design_systems set trades=array['restaurant', 'bistro', 'steak', 'steakhouse', 'chophouse', 'sushi', 'japanese', 'wine', 'fine dining', 'tavern', 'oyster', 'new american', 'bar', 'pub', 'inn']::text[], updated_at=now() where id='candlelit-bistro';
