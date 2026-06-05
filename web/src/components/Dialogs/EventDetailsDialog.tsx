import React from 'react'
import { useEvents } from '../../contexts/EventContext'
import Dialog from './Dialog'
import { eventTimeToDate } from '@/utils/constants/event'

const eventDateFormatter = new Intl.DateTimeFormat('en-US', {
  weekday: 'short',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})

const eventTimeFormatter = new Intl.DateTimeFormat('en-US', {
  hour: 'numeric',
  minute: 'numeric',
})

function EventDetailsDialog() {
  const {
    isEventDetailsOpen,
    selectedEvent,
    closeEventDetails,
    openEventDelete,
    openEventForm,
  } = useEvents()

  const handleClose = () => {
    closeEventDetails()
  }

  const handleDelete = () => {
    closeEventDetails()
    setTimeout(() => {
      openEventDelete(selectedEvent)
    }, 100)
  }

  const handleEdit = () => {
    closeEventDetails()
    setTimeout(() => {
      openEventForm('edit', selectedEvent)
    }, 100)
  }

  if (!selectedEvent) return null

  return (
    <Dialog isOpen={isEventDetailsOpen} onClose={handleClose}>
      <div className="mx-auto rounded-md bg-white flex flex-col w-120 max-w-[calc(100vw-2rem)] gap-6 py-6 max-h-[calc(100vh-2rem)]">
        {/* Header */}
        <div className="flex justify-between items-center gap-4 px-6">
          <h2 className="text-2xl leading-8 font-medium">Event details</h2>
          <div className="flex items-stretch gap-2">
            <button
              type="button"
              onClick={handleDelete}
              aria-label="Delete event"
              className="button button--icon button--secondary flex items-center justify-center p-2 text-gray-500 hover:text-red-600 transition-colors duration-150"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-6 h-6"
              >
                <path d="M3 6h18" />
                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
              </svg>
            </button>

            <button
              type="button"
              onClick={handleEdit}
              aria-label="Edit event"
              className="button button--icon button--secondary flex items-center justify-center p-2 text-gray-500 hover:text-blue-600 transition-colors duration-150"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-6 h-6"
              >
                <path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z" />
                <path d="m15 5 4 4" />
              </svg>
            </button>

            <div className="w-px bg-gray-200 mx-2" />

            <button
              type="button"
              onClick={handleClose}
              autoFocus
              aria-label="Close event details"
              className="button button--icon button--secondary flex items-center justify-center p-2 text-gray-500 hover:text-gray-700 transition-colors duration-150"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-6 h-6"
              >
                <path d="M18 6 6 18" />
                <path d="m6 6 12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6">
          <div
            className="flex items-stretch gap-4"
            style={{ '--event-color': selectedEvent.color } as React.CSSProperties}
          >
            <div
              className="flex-shrink-0 w-2 rounded-md"
              style={{ backgroundColor: 'var(--event-color)' }}
            />
            <div className="flex flex-col gap-2">
              <div className="text-lg leading-7">{selectedEvent.title}</div>
              <div className="text-sm leading-5">
                <time>{eventDateFormatter.format(selectedEvent.date)}</time> <br />
                <time>{eventTimeFormatter.format(eventTimeToDate(selectedEvent, selectedEvent.startTime))}</time> -{' '}
                <time>{eventTimeFormatter.format(eventTimeToDate(selectedEvent, selectedEvent.endTime))}</time>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Dialog>
  )
}

export default EventDetailsDialog
