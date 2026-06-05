import { useState, useEffect } from 'react'
import { useEvents } from '../../contexts/EventContext'
import Dialog from './Dialog'
import { validateEvent } from '@/utils/constants/event'

const timeOptions = Array.from({ length: 48 }, (_, i) => {
  const minutes = i * 30
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours
  const ampm = hours < 12 ? 'AM' : 'PM'
  return {
    value: minutes,
    label: `${displayHours}:${mins.toString().padStart(2, '0')} ${ampm}`
  }
})

const endTimeOptions = [...timeOptions, { value: 1440, label: '12:00 AM' }]

function EventFormDialog() {
  const { 
    isEventFormOpen, 
    eventFormMode, 
    eventFormData, 
    closeEventForm, 
    createEvent, 
    updateEvent,
    addToast 
  } = useEvents()

  const [formData, setFormData] = useState({
    id: '',
    title: '',
    date: '',
    startTime: 0,
    endTime: 30,
    color: '#2563eb'
  })

  useEffect(() => {
    if (isEventFormOpen) {
      if (eventFormMode === 'create') {
        setFormData({
          id: '',
          title: '',
          date: eventFormData ? eventFormData.date.toISOString().substr(0, 10) : new Date().toISOString().substr(0, 10),
          startTime: eventFormData?.startTime || 600,
          endTime: eventFormData?.endTime || 960,
          color: '#2563eb'
        })
      } else if (eventFormMode === 'edit' && eventFormData) {
        setFormData({
          id: eventFormData.id,
          title: eventFormData.title,
          date: eventFormData.date.toISOString().substr(0, 10),
          startTime: eventFormData.startTime || 600,
          endTime: eventFormData.endTime || 960,
          color: eventFormData.color || '#2563eb'
        })
      }
    }
  }, [isEventFormOpen, eventFormMode, eventFormData])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name === 'startTime' || name === 'endTime' ? parseInt(value, 10) : value
    }))
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    const eventData = {
      ...formData,
      id: formData.id || Date.now().toString(),
      date: new Date(formData.date)
    }

    const validationError = validateEvent(eventData)
    if (validationError) {
      addToast('error', validationError)
      return
    }

    if (eventFormMode === 'create') {
      createEvent(eventData)
    } else {
      updateEvent(eventData)
    }
    closeEventForm()
  }

  const handleClose = () => {
    closeEventForm()
    setFormData({
      id: '',
      title: '',
      date: '',
      startTime: 0,
      endTime: 30,
      color: '#2563eb'
    })
  }

  return (
    <Dialog isOpen={isEventFormOpen} onClose={handleClose}>
      <form onSubmit={handleSubmit} className="relative mx-auto w-full max-w-xl bg-white rounded p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-medium">
            {eventFormMode === 'create' ? 'Create event' : 'Edit event'}
          </h2>
          <button 
            type="button" 
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700 transition"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none"
              viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18" />
              <path d="M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
          {/* Title */}
          <div className="flex flex-col gap-2">
            <label htmlFor="title" className="text-sm font-medium">Title</label>
            <input 
              id="title" 
              name="title" 
              type="text" 
              placeholder="My awesome event!"
              value={formData.title}
              onChange={handleInputChange}
              required 
              autoFocus
              className="w-full px-3 py-2 border rounded text-sm focus:outline-none focus:ring focus:border-blue-500"
            />
          </div>

          {/* Date */}
          <div className="flex flex-col gap-2">
            <label htmlFor="date" className="text-sm font-medium">Date</label>
            <input 
              id="date" 
              name="date" 
              type="date" 
              value={formData.date}
              onChange={handleInputChange}
              required 
              className="w-full px-3 py-2 border rounded text-sm focus:outline-none focus:ring focus:border-blue-500"
            />
          </div>

          {/* Start and End Time */}
          <div className="flex gap-4">
            <div className="flex-1 flex flex-col gap-2">
              <label htmlFor="startTime" className="text-sm font-medium">Start time</label>
              <select 
                id="startTime" 
                name="startTime"
                value={formData.startTime}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border rounded text-sm focus:outline-none focus:ring focus:border-blue-500"
              >
                {timeOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex-1 flex flex-col gap-2">
              <label htmlFor="endTime" className="text-sm font-medium">End time</label>
              <select 
                id="endTime" 
                name="endTime"
                value={formData.endTime}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border rounded text-sm focus:outline-none focus:ring focus:border-blue-500"
              >
                {endTimeOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Color Picker */}
          <div>
            <label className="text-sm font-medium mb-2 block">Color</label>
            <div className="flex flex-wrap gap-3">
              {['#2563eb', '#ea580c', '#16a34a', '#7c3aed', '#e11d48'].map(color => (
                <label 
                  key={color}
                  className="relative w-8 h-8 rounded-full cursor-pointer border-2 border-transparent"
                >
                  <input 
                    type="radio" 
                    name="color" 
                    value={color}
                    checked={formData.color === color}
                    onChange={handleInputChange}
                    className="absolute opacity-0 w-0 h-0"
                  />
                  <div 
                    className={`w-full h-full rounded-full`}
                    style={{ backgroundColor: color }}
                  />
                  {formData.color === color && (
                    <div className="absolute inset-0 rounded-full border-2 border-gray-700 pointer-events-none" />
                  )}
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 pt-4">
          <button 
            type="button"
            onClick={handleClose}
            className="px-4 py-2 text-sm border rounded text-gray-700 hover:bg-gray-100"
          >
            Cancel
          </button>
          <button 
            type="submit"
            className="px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-500 rounded"
          >
            Save
          </button>
        </div>
      </form>
    </Dialog>
  )
}

export default EventFormDialog
