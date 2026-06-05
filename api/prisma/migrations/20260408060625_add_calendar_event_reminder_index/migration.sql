-- CreateIndex
CREATE INDEX "CalendarEvent_startAt_reminderMinutesBefore_idx" ON "CalendarEvent"("startAt", "reminderMinutesBefore");
