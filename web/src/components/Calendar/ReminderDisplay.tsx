import React from 'react'
import { Bell } from 'lucide-react'
import { IEvent } from '@/types'

interface ReminderDisplayProps {
  event: IEvent
  showNextReminderTime?: boolean
}

const ReminderDisplay: React.FC<ReminderDisplayProps> = ({ 
  event, 
  showNextReminderTime = true 
}) => {
  if (!event.reminderMinutesBefore || event.reminderMinutesBefore === 0) {
    return null
  }

  const reminders = Array.isArray(event.reminderMinutesBefore)
    ? event.reminderMinutesBefore
    : [event.reminderMinutesBefore]

  const formatReminderTime = (minutes: number): string => {
    if (minutes < 60) {
      return `${minutes}m`
    } else if (minutes < 1440) {
      const hours = Math.floor(minutes / 60)
      return `${hours}h`
    } else {
      const days = Math.floor(minutes / 1440)
      return `${days}d`
    }
  }

  const calculateNextReminderTime = (): string | null => {
    if (!event.startAt) return null

    const startTime = new Date(event.startAt)
    const now = new Date()

    // Get the earliest reminder time
    const earliestReminderMinutes = Math.min(...reminders)
    const reminderTime = new Date(startTime.getTime() - earliestReminderMinutes * 60000)

    if (reminderTime <= now) {
      return 'Reminder due'
    }

    const diff = reminderTime.getTime() - now.getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hoursMs = diff % (1000 * 60 * 60 * 24)
    const hours = Math.floor(hoursMs / (1000 * 60 * 60))
    const minsMs = hoursMs % (1000 * 60 * 60)
    const mins = Math.floor(minsMs / (1000 * 60))

    if (days > 0) {
      return `in ${days}d ${hours}h`
    } else if (hours > 0) {
      return `in ${hours}h ${mins}m`
    } else {
      return `in ${mins}m`
    }
  }

  const nextReminderTime = calculateNextReminderTime()

  return (
    <div className="flex items-start gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
      <Bell className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
      <div className="flex-1">
        <p className="font-semibold text-blue-900 flex items-center gap-2">
          <span>Reminders set</span>
          {nextReminderTime && showNextReminderTime && (
            <span className="text-sm font-normal text-blue-700">({nextReminderTime})</span>
          )}
        </p>
        <div className="mt-1 flex flex-wrap gap-2">
          {reminders.sort((a, b) => a - b).map((minutes, index) => (
            <span
              key={index}
              className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded"
            >
              {formatReminderTime(minutes)} before
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

export default ReminderDisplay

