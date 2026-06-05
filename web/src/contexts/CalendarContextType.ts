import { createContext } from 'react'
import { IEvent } from '@/types'

export type CalendarContextType = {
  selectedDate: Date
  selectedView: string
  deviceType: string
  events: IEvent[]
  selectedEvent: IEvent | null
  selectedInstance: IEvent | null
  isEditingOccurrence: boolean
  occurrenceEditMode: 'single' | 'future' | 'all' | null
  loading: boolean
  error: string | null
  setDate: (date: Date) => void
  setView: (view: string) => void
  setEvents: (events: IEvent[]) => void
  selectEvent: (event: IEvent | null) => void
  selectInstance: (instance: IEvent | null) => void
  setEditingOccurrence: (editing: boolean) => void
  setOccurrenceEditMode: (mode: 'single' | 'future' | 'all' | null) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  addEvent: (event: IEvent) => void
  updateEvent: (event: IEvent) => void
  removeEvent: (eventId: string) => void
}

export const CalendarContext = createContext<CalendarContextType | undefined>(undefined)
