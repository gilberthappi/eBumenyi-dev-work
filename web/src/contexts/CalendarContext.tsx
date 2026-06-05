import { today } from '@/utils/constants/date'
import { useReducer, useEffect, ReactNode } from 'react'
import { IEvent } from '@/types'
import { CalendarContext, type CalendarContextType } from './CalendarContextType'

const initialState = {
  selectedDate: today(),
  selectedView: 'month',
  deviceType: typeof window !== 'undefined' && window.innerWidth >= 768 ? 'desktop' : 'mobile',
  events: [] as IEvent[],
  selectedEvent: null as IEvent | null,
  selectedInstance: null as IEvent | null,
  isEditingOccurrence: false,
  occurrenceEditMode: null as 'single' | 'future' | 'all' | null,
  loading: false,
  error: null as string | null,
}

type CalendarState = typeof initialState

type CalendarAction = 
  | { type: 'SET_DATE'; payload: Date }
  | { type: 'SET_VIEW'; payload: string }
  | { type: 'SET_DEVICE_TYPE'; payload: string }
  | { type: 'SET_EVENTS'; payload: IEvent[] }
  | { type: 'SELECT_EVENT'; payload: IEvent | null }
  | { type: 'SELECT_INSTANCE'; payload: IEvent | null }
  | { type: 'SET_EDITING_OCCURRENCE'; payload: boolean }
  | { type: 'SET_OCCURRENCE_EDIT_MODE'; payload: 'single' | 'future' | 'all' | null }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'ADD_EVENT'; payload: IEvent }
  | { type: 'UPDATE_EVENT'; payload: IEvent }
  | { type: 'REMOVE_EVENT'; payload: string }

function calendarReducer(state: CalendarState, action: CalendarAction): CalendarState {
  switch (action.type) {
    case 'SET_DATE':
      return { ...state, selectedDate: action.payload }
    case 'SET_VIEW':
      return { ...state, selectedView: action.payload }
    case 'SET_DEVICE_TYPE':
      return { ...state, deviceType: action.payload }
    case 'SET_EVENTS':
      return { ...state, events: action.payload, error: null }
    case 'SELECT_EVENT':
      return { ...state, selectedEvent: action.payload }
    case 'SELECT_INSTANCE':
      return { ...state, selectedInstance: action.payload }
    case 'SET_EDITING_OCCURRENCE':
      return { ...state, isEditingOccurrence: action.payload }
    case 'SET_OCCURRENCE_EDIT_MODE':
      return { ...state, occurrenceEditMode: action.payload }
    case 'SET_LOADING':
      return { ...state, loading: action.payload }
    case 'SET_ERROR':
      return { ...state, error: action.payload }
    case 'ADD_EVENT':
      return { ...state, events: [...state.events, action.payload] }
    case 'UPDATE_EVENT':
      return {
        ...state,
        events: state.events.map(e => e.id === action.payload.id ? action.payload : e),
        selectedEvent: state.selectedEvent?.id === action.payload.id ? action.payload : state.selectedEvent,
        selectedInstance: state.selectedInstance?.id === action.payload.id ? action.payload : state.selectedInstance,
      }
    case 'REMOVE_EVENT':
      return {
        ...state,
        events: state.events.filter(e => e.id !== action.payload),
        selectedEvent: state.selectedEvent?.id === action.payload ? null : state.selectedEvent,
        selectedInstance: state.selectedInstance?.id === action.payload ? null : state.selectedInstance,
      }
    default:
      return state
  }
}

export function CalendarProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(calendarReducer, initialState)

  useEffect(() => {
    const handleResize = () => {
      const deviceType = typeof window !== 'undefined' && window.innerWidth >= 768 ? 'desktop' : 'mobile'
      dispatch({ type: 'SET_DEVICE_TYPE', payload: deviceType })
      
      if (deviceType === 'mobile' && state.selectedView === 'month') {
        dispatch({ type: 'SET_VIEW', payload: 'week' })
      }
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('resize', handleResize)
      return () => window.removeEventListener('resize', handleResize)
    }
  }, [state.selectedView])

  useEffect(() => {
    if (state.deviceType === 'mobile' && state.selectedView === 'month') {
      dispatch({ type: 'SET_VIEW', payload: 'week' })
    }
  }, [state.deviceType, state.selectedView])

  const setDate = (date: Date) => {
    dispatch({ type: 'SET_DATE', payload: date })
  }

  const setView = (view: string) => {
    dispatch({ type: 'SET_VIEW', payload: view })
  }

  const setEvents = (events: IEvent[]) => {
    dispatch({ type: 'SET_EVENTS', payload: events })
  }

  const selectEvent = (event: IEvent | null) => {
    dispatch({ type: 'SELECT_EVENT', payload: event })
  }

  const selectInstance = (instance: IEvent | null) => {
    dispatch({ type: 'SELECT_INSTANCE', payload: instance })
  }

  const setEditingOccurrence = (editing: boolean) => {
    dispatch({ type: 'SET_EDITING_OCCURRENCE', payload: editing })
  }

  const setOccurrenceEditMode = (mode: 'single' | 'future' | 'all' | null) => {
    dispatch({ type: 'SET_OCCURRENCE_EDIT_MODE', payload: mode })
  }

  const setLoading = (loading: boolean) => {
    dispatch({ type: 'SET_LOADING', payload: loading })
  }

  const setError = (error: string | null) => {
    dispatch({ type: 'SET_ERROR', payload: error })
  }

  const addEvent = (event: IEvent) => {
    dispatch({ type: 'ADD_EVENT', payload: event })
  }

  const updateEvent = (event: IEvent) => {
    dispatch({ type: 'UPDATE_EVENT', payload: event })
  }

  const removeEvent = (eventId: string) => {
    dispatch({ type: 'REMOVE_EVENT', payload: eventId })
  }

  const value: CalendarContextType = {
    ...state,
    setDate,
    setView,
    setEvents,
    selectEvent,
    selectInstance,
    setEditingOccurrence,
    setOccurrenceEditMode,
    setLoading,
    setError,
    addEvent,
    updateEvent,
    removeEvent,
  }

  return (
    <CalendarContext.Provider value={value}>
      {children}
    </CalendarContext.Provider>
  )
}