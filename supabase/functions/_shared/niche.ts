/**
 * Niche detection for the outbound funnel. `prospects.business_type` carries the scraped
 * Google Maps category ("Pizza restaurant", "Roofing contractor", …) or an import `--trade`
 * slug, so the fast demo build, the design-system pool, the playbook fallback, the reply desk
 * and the copy need one shared answer to "is this a food business?". Pure; vitest-covered.
 */

// Phrases (5+ chars) match anywhere in the category; short words must match a whole word so
// "bar" never fires on "Barbershop" and "pub" never fires on "Publishing".
const FOOD_PHRASES = [
  'restaurant', 'coffee', 'diner', 'pizza', 'pizzeria', 'bakery', 'grill', 'bistro', 'catering',
  'caterer', 'taqueria', 'sushi', 'steak', 'steakhouse', 'chophouse', 'eatery', 'kitchen', 'brunch',
  'breakfast', 'burger', 'sandwich', 'seafood', 'ice cream', 'juice', 'tea house', 'barbecue', 'noodle',
  'ramen', 'bagel', 'donut', 'doughnut', 'creperie', 'espresso', 'tavern', 'brewery', 'brewpub',
  'winery', 'gastropub', 'cafeteria', 'oyster', 'smokehouse', 'dessert', 'gelato', 'pastry', 'takeout',
  'food truck', 'food court', 'food', 'cantina', 'trattoria', 'osteria', 'ristorante', 'brasserie',
]
const FOOD_WORDS = ['cafe', 'café', 'deli', 'bar', 'pub', 'bbq', 'taco', 'wings', 'inn']

/** True for restaurants, cafes, diners, bakeries, bars and the like; false for trades. */
export function isFoodBusiness(businessType: string | null | undefined): boolean {
  const t = (businessType ?? '').toLowerCase().trim()
  if (!t) return false
  if (FOOD_PHRASES.some((w) => t.includes(w))) return true
  const words = t.split(/[^a-zé]+/).filter(Boolean)
  return FOOD_WORDS.some((w) => words.includes(w))
}

/** Plain-English niche word for prompts/copy ("restaurants" / "contractors"). */
export function nicheNoun(businessType: string | null | undefined): 'restaurants' | 'contractors' {
  return isFoodBusiness(businessType) ? 'restaurants' : 'contractors'
}
