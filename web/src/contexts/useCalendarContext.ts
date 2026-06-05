import { useContext } from 'react'
import { CalendarContext, type CalendarContextType } from './CalendarContextType'

export function useCalendar(): CalendarContextType {
  const context = useContext(CalendarContext)
  if (!context) {
    throw new Error('useCalendar must be used within a CalendarProvider')
  }
  return context
}
