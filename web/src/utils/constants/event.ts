// Event interface definition
interface CalendarEvent {
  date: Date;
  startTime: number; // minutes from midnight (0-1439)
  endTime: number;   // minutes from midnight (1-1440)
  title?: string;
  description?: string;
  id?: string | number;
}

export function isEventAllDay(event: CalendarEvent): boolean {
  return event.startTime === 0 && event.endTime === 1440;
}

export function eventStartsBefore(eventA: CalendarEvent, eventB: CalendarEvent): boolean {
  return eventA.startTime < eventB.startTime;
}

export function eventEndsBefore(eventA: CalendarEvent, eventB: CalendarEvent): boolean {
  return eventA.endTime < eventB.endTime;
}

export function eventCollidesWith(eventA: CalendarEvent, eventB: CalendarEvent): boolean {
  const maxStartTime = Math.max(eventA.startTime, eventB.startTime);
  const minEndTime = Math.min(eventA.endTime, eventB.endTime);
  return minEndTime > maxStartTime;
}

export function eventTimeToDate(event: CalendarEvent, eventTime: number): Date {
  return new Date(
    event.date.getFullYear(),
    event.date.getMonth(),
    event.date.getDate(),
    0,
    eventTime
  );
}

export function validateEvent(event: CalendarEvent): string | null {
  if (event.startTime >= event.endTime) {
    return "Event end time must be after start time";
  }
  return null;
}

export function generateEventId(): number {
  return Date.now();
}