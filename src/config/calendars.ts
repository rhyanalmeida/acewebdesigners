/**
 * Calendar Configuration
 * 
 * Centralized configuration for all booking calendars used across the site.
 * This allows easy management of different calendars for different landing pages.
 * 
 * IMPORTANT: Keep the contractor landing page calendar SEPARATE from the main site calendar.
 */

export interface CalendarConfig {
  /** Unique identifier for the calendar */
  id: string
  /** The booking widget URL */
  url: string
  /** Display name for the calendar */
  name: string
  /** Unique iframe ID (must be unique per page) */
  iframeId: string
  /** Minimum height for the widget */
  minHeight: number
  /** Mobile minimum height */
  mobileMinHeight: number
}

/**
 * Main site calendar - used for general business inquiries
 * This is the default calendar for the main Landing page and Contact page
 */
export const MAIN_CALENDAR: CalendarConfig = {
  id: 'mdd2ImGj9qnzPZxQciNF',
  url: 'https://api.leadconnectorhq.com/widget/booking/mdd2ImGj9qnzPZxQciNF',
  name: 'Main Site Booking',
  iframeId: 'mdd2ImGj9qnzPZxQciNF_1769694054880',
  minHeight: 1000,
  mobileMinHeight: 1100,
}

/**
 * Contractor landing page calendar - SEPARATE from main site
 * This calendar is specifically for contractor leads from Facebook ads
 * 
 * NOTE: If you want to use a different calendar for contractors,
 * update the 'id' and 'url' below with the new calendar details.
 * For now, it uses the same calendar but with a different iframe ID.
 */
export const CONTRACTOR_CALENDAR: CalendarConfig = {
  id: 'MseWjwAf3rDlJRoj1p75', // TODO: Replace with contractor-specific calendar ID if different
  url: 'https://api.leadconnectorhq.com/widget/booking/MseWjwAf3rDlJRoj1p75',
  name: 'Contractor Booking',
  iframeId: 'contractor-booking-widget',
  minHeight: 1000,
  mobileMinHeight: 1100,
}

/**
 * Calendly configuration for Contact page
 * This uses Calendly instead of LeadConnector
 */
export const CALENDLY_CONFIG = {
  url: 'https://calendly.com/rhyanalmeida31/30min',
  name: 'Calendly Booking',
  minHeight: 700,
}

/**
 * Get calendar config by page type
 */
export function getCalendarConfig(pageType: 'main' | 'contractor' | 'contact'): CalendarConfig {
  switch (pageType) {
    case 'contractor':
      return CONTRACTOR_CALENDAR
    case 'main':
    default:
      return MAIN_CALENDAR
  }
}
