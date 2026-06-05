export function today(): Date {
  const now = new Date();
  return new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    12
  );
}

export function addMonths(date: Date, months: number): Date {
  const firstDayOfMonth = new Date(
    date.getFullYear(),
    date.getMonth() + months,
    1,
    date.getHours()
  );
  const lastDayOfMonth = getLastDayOfMonthDate(firstDayOfMonth);
  const dayOfMonth = Math.min(date.getDate(), lastDayOfMonth.getDate());

  return new Date(
    date.getFullYear(),
    date.getMonth() + months,
    dayOfMonth,
    date.getHours()
  );
}

export function subtractMonths(date: Date, months: number): Date {
  return addMonths(date, -months);
}

export function addDays(date: Date, days: number): Date {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate() + days,
    date.getHours()
  );
}

export function subtractDays(date: Date, days: number): Date {
  return addDays(date, -days);
}

export function generateMonthCalendarDays(currentDate: Date): Date[] {
  const calendarDays: Date[] = [];
  const lastDayOfPreviousMonthDate = getLastDayOfMonthDate(
    subtractMonths(currentDate, 1)
  );

  const lastDayOfPreviousMonthWeekDay = lastDayOfPreviousMonthDate.getDay();
  if (lastDayOfPreviousMonthWeekDay !== 6) {
    for (let i = lastDayOfPreviousMonthWeekDay; i >= 0; i -= 1) {
      const calendarDay = subtractDays(lastDayOfPreviousMonthDate, i);
      calendarDays.push(calendarDay);
    }
  }

  const lastDayOfCurrentMonthDate = getLastDayOfMonthDate(currentDate);
  for (let i = 1; i <= lastDayOfCurrentMonthDate.getDate(); i += 1) {
    const calendarDay = addDays(lastDayOfPreviousMonthDate, i);
    calendarDays.push(calendarDay);
  }

  const totalWeeks = Math.ceil(calendarDays.length / 7);
  const totalDays = totalWeeks * 7;
  const missingDayAmount = totalDays - calendarDays.length;
  for (let i = 1; i <= missingDayAmount; i += 1) {
    const calendarDay = addDays(lastDayOfCurrentMonthDate, i);
    calendarDays.push(calendarDay);
  }

  return calendarDays;
}

export function isTheSameDay(dateA: Date, dateB: Date): boolean {
  return dateA.getFullYear() === dateB.getFullYear() && 
         dateA.getMonth() === dateB.getMonth() && 
         dateA.getDate() === dateB.getDate();
}

export function generateWeekDays(date: Date): Date[] {
  const weekDays: Date[] = [];
  const firstWeekDay = subtractDays(date, date.getDay());

  for (let i = 0; i <= 6; i += 1) {
    const weekDay = addDays(firstWeekDay, i);
    weekDays.push(weekDay);
  }

  return weekDays;
}

function getLastDayOfMonthDate(date: Date): Date {
  return new Date(
    date.getFullYear(),
    date.getMonth() + 1,
    0,
    12
  );
}