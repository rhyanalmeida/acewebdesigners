/**
 * Facebook Pixel Configuration
 * 
 * Centralized configuration for all Facebook Pixels used across the site.
 * Each landing page has its own pixel for separate tracking.
 * 
 * SECURITY NOTE: Access tokens should NEVER be stored in client-side code.
 * The Conversions API calls should be made from a backend server.
 */

export interface PixelConfig {
  /** Facebook Pixel ID */
  pixelId: string
  /** Display name for debugging */
  name: string
  /** Description of what this pixel tracks */
  description: string
}

/**
 * Main site pixel - tracks general website visitors
 * Loaded globally in index.html
 */
export const MAIN_PIXEL: PixelConfig = {
  pixelId: '1703925480259996',
  name: 'Main Site Pixel',
  description: 'Tracks visitors on the main website and general landing page',
}

/**
 * Contractor landing page pixel - tracks contractor-specific leads
 * Loaded dynamically only on the contractor landing page
 */
export const CONTRACTOR_PIXEL: PixelConfig = {
  pixelId: '4230021860577001',
  name: 'Contractor Pixel',
  description: 'Tracks contractor leads from Facebook ads - separate from main pixel',
}

/**
 * Restaurant landing page pixel — the self-serve "build your site" funnel.
 *
 * A FULLY ISOLATED third funnel: its own pixel/dataset, its own GHL account, its
 * own ad set — separate from both main and contractor. Loaded dynamically only on
 * /buildyoursite (index.html skips the main pixel there); its server CAPI dataset
 * is META_DATASET_ID_RESTAURANT.
 *
 * Created 2026-06-29 in the Ace Web Designers business (act_553999801104558).
 */
export const RESTAURANT_PIXEL: PixelConfig = {
  pixelId: '1575254990791923',
  name: 'Restaurant Builder CAPI',
  description: 'Tracks restaurant "build your site" leads — separate funnel, pixel, dataset & GHL',
}

/**
 * Get pixel config by page type
 */
export function getPixelConfig(pageType: 'main' | 'contractor' | 'restaurant'): PixelConfig {
  switch (pageType) {
    case 'contractor':
      return CONTRACTOR_PIXEL
    case 'restaurant':
      return RESTAURANT_PIXEL
    case 'main':
    default:
      return MAIN_PIXEL
  }
}
