/**
 * Calendar Configuration
 *
 * Identifies the two booking calendars used across the site. Booking is now
 * handled by our own Supabase-backed scheduler (see components/scheduler), so a
 * calendar is just a logical id + display config — the `calendar` discriminator
 * tells the `slots`/`book` Edge Functions which availability set + Meta dataset
 * to use. (The old GoHighLevel iframe URLs are gone.)
 *
 * IMPORTANT: keep the contractor calendar SEPARATE from the main calendar.
 */

export interface CalendarConfig {
  /** Logical id */
  id: string
  /** Which availability set + Meta dataset the scheduler uses */
  calendar: 'main' | 'contractor'
  /** Display name */
  name: string
  /** Minimum height for the widget container (px) */
  minHeight: number
  /** Mobile minimum height (px) */
  mobileMinHeight: number
}

/** Main site calendar — general business inquiries (main Landing + Contact). */
export const MAIN_CALENDAR: CalendarConfig = {
  id: 'main',
  calendar: 'main',
  name: 'Main Site Booking',
  minHeight: 720,
  mobileMinHeight: 720,
}

/** Contractor landing calendar — "Free Design Meeting". Drives the contractor
 *  Meta dataset (4230021860577001) and the GHL messaging workflow. */
export const CONTRACTOR_CALENDAR: CalendarConfig = {
  id: 'contractor',
  calendar: 'contractor',
  name: 'Contractor Booking',
  minHeight: 720,
  mobileMinHeight: 720,
}

/** Get calendar config by page type */
export function getCalendarConfig(pageType: 'main' | 'contractor'): CalendarConfig {
  switch (pageType) {
    case 'contractor':
      return CONTRACTOR_CALENDAR
    case 'main':
    default:
      return MAIN_CALENDAR
  }
}
