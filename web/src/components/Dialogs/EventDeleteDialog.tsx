import { useEvents } from '../../contexts/EventContext'
import Dialog from './Dialog'

function EventDeleteDialog() {
  const {
    isEventDeleteOpen,
    selectedEvent,
    closeEventDelete,
    deleteEvent,
  } = useEvents()

  const handleClose = () => {
    closeEventDelete()
  }

  const handleDelete = () => {
    if (selectedEvent) {
      deleteEvent(selectedEvent)
    }
    closeEventDelete()
  }

  if (!selectedEvent) return null

  return (
    <Dialog isOpen={isEventDeleteOpen} onClose={handleClose}>
      <div className="mx-auto rounded-md bg-white flex flex-col w-120 max-w-[calc(100vw-2rem)] gap-6 py-6 max-h-[calc(100vh-2rem)]">
        {/* Header */}
        <div className="flex justify-between items-center gap-4 px-6">
          <h2 className="text-2xl leading-8 font-medium">Delete event</h2>

          <button
            type="button"
            onClick={handleClose}
            autoFocus
            aria-label="Close delete dialog"
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

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6">
          <p>
            Do you really want to delete{' '}
            <strong>{selectedEvent.title}</strong>?
          </p>
        </div>

        {/* Footer */}
        <div className="flex-none px-6">
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={handleClose}
              className="button button--secondary"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDelete}
              className="button button--danger"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </Dialog>
  )
}

export default EventDeleteDialog
