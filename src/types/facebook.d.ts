/**
 * TypeScript declarations for Facebook Pixel (fbq)
 * This provides type safety for Facebook tracking calls
 */

interface FacebookPixelOptions {
  content_name?: string
  content_category?: string
  content_type?: string
  content_ids?: string[]
  contents?: Array<{ id: string; quantity: number }>
  currency?: string
  value?: number
  num_items?: number
  search_string?: string
  status?: string
  [key: string]: unknown
}

interface FacebookPixelEventOptions {
  eventID?: string
}

interface FacebookPixelFunction {
  (
    command: 'init',
    pixelId: string,
    advancedMatching?: { em?: string; fn?: string; ln?: string; ph?: string }
  ): void
  (
    command: 'track',
    eventName: string,
    options?: FacebookPixelOptions,
    eventOptions?: FacebookPixelEventOptions
  ): void
  (
    command: 'trackCustom',
    eventName: string,
    options?: FacebookPixelOptions,
    eventOptions?: FacebookPixelEventOptions
  ): void
  (command: 'set', property: string, value: unknown): void
  callMethod?: (...args: unknown[]) => void
  queue: unknown[]
  push: (...args: unknown[]) => void
  loaded: boolean
  version: string
}

declare global {
  interface Window {
    fbq: FacebookPixelFunction
    _fbq: FacebookPixelFunction
    leadConnectorBooking?: {
      onComplete?: (...args: unknown[]) => void
    }
    testContractorPixel?: () => void
    testMainPixel?: () => void
    /** Ring buffer of every postMessage seen by BookingWidget — for diagnostics */
    __bookingWidgetMessages?: Array<{ ts: number; origin: string; data: unknown }>
  }
}

export {}
