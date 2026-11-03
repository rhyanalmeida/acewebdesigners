/**
 * Niche detection for the outbound funnel. `prospects.business_type` carries the scraped
 * Google Maps category ("Pizza restaurant", "Roofing contractor", …) or an import `--trade`
 * slug, so the fast demo build, the reply desk and the copy need one shared answer to
 * "is this a food business?". Pure; vitest-covered in niche.test.ts.
 */

const FOOD_WORDS = [
  'restaurant', 'cafe', 'café', 'coffee', 'diner', 'pizza', 'pizzeria', 'bakery', 'bar & grill', 'grill',
  'bistro', 'deli', 'food', 'catering', 'caterer', 'taqueria', 'sushi', 'steakhouse', 'pub', 'eatery',
  'kitchen', 'brunch', 'breakfast', 'burger', 'sandwich', 'seafood', 'ice cream', 'juice', 'tea house',
  'bbq', 'barbecue', 'noodle', 'ramen', 'taco', 'bagel', 'donut', 'doughnut', 'creperie', 'bistro',
]

/** True for restaurants, cafes, diners, bakeries and the like; false for trades. */
export function isFoodBusiness(businessType: string | null | undefined): boolean {
  const t = (businessType ?? '').toLowerCase()
  if (!t) return false
  return FOOD_WORDS.some((w) => t.includes(w))
}

/** Plain-English niche word for prompts/copy ("restaurants" / "contractors"). */
export function nicheNoun(businessType: string | null | undefined): 'restaurants' | 'contractors' {
  return isFoodBusiness(businessType) ? 'restaurants' : 'contractors'
}
