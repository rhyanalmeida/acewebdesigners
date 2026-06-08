/**
 * BookingWidget — thin wrapper around our own Scheduler.
 *
 * Kept as a drop-in for existing call sites (BookingSection, Contact, the two
 * landing pages) which pass a CalendarConfig + containerId. The GoHighLevel
 * iframe is gone; booking now runs through the Supabase scheduler, and the
 * booking `Lead` is fired (browser pixel + server CAPI, deduped) on submit.
 *
 * Usage:
 * ```tsx
 * <BookingWidget calendarConfig={CONTRACTOR_CALENDAR} containerId="..." />
 * ```
 */

import React from 'react'
import type { CalendarConfig } from '../config/calendars'
import { Scheduler } from './scheduler/Scheduler'

interface BookingWidgetProps {
  /** Calendar configuration from config/calendars.ts */
  calendarConfig: CalendarConfig
  /** Optional additional className for the container */
  className?: string
  /** Optional container ID for CSS targeting */
  containerId?: string
}

export const BookingWidget: React.FC<BookingWidgetProps> = ({
  calendarConfig,
  className = '',
  containerId,
}) => {
  return (
    <Scheduler
      calendar={calendarConfig.calendar}
      calendarName={calendarConfig.name}
      className={className}
      containerId={containerId}
      minHeight={calendarConfig.minHeight}
    />
  )
}

export default BookingWidget
