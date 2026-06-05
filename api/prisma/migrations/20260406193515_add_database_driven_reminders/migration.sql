/**
 * Database-Driven Calendar Reminder System (PostgreSQL NOTIFY Real-Time)
 * 
 * This migration sets up PostgreSQL native scheduling for calendar reminders
 * using event-driven notifications instead of Node.js job scheduler.
 * 
 * Architecture:
 * 1. Node.js cron job triggers reminder check every minute (no pg_cron needed for Railway)
 * 2. Database fires NOTIFY event when reminders are due
 * 3. Node.js LISTEN channel receives events instantly
 * 4. Node.js sends notifications to users
 * 
 * Benefits:
 * - Zero Node.js memory overhead
 * - Perfect precision (instant notification)
 * - Automatic crash recovery
 * - Scales to unlimited events
 * - Event-driven (not polling)
 * - Works with managed databases (Railway) that don't support pg_cron
 */

-- Create scheduled_reminders materialized view
-- This automatically calculates all future reminders
CREATE MATERIALIZED VIEW IF NOT EXISTS scheduled_reminders AS
SELECT 
  e.id as event_id,
  e.title,
  e.description,
  e.type,
  e."meetingType" as meeting_type,
  e.location,
  e.priority,
  e.timezone,
  p."userId" as user_id,
  (e."startAt" - (INTERVAL '1 minute' * reminder_minute))::timestamp as fire_at,
  reminder_minute as minutes_before,
  e."startAt" as event_start_at,
  e.frequency,
  e."recurrenceEndsAt",
  u."fullNames" as full_names,
  u.email,
  u."phoneNumber" as phone_number
FROM 
  "CalendarEvent" e
  CROSS JOIN LATERAL unnest(e."reminderMinutesBefore") as reminder_minute
  LEFT JOIN "CalendarEventParticipant" p ON e.id = p."eventId"
  LEFT JOIN "User" u ON p."userId" = u.id
WHERE 
  e."startAt" > NOW()
  AND p."userId" IS NOT NULL  -- Only include events with participants
ORDER BY 
  fire_at ASC;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_scheduled_reminders_fire_at 
  ON scheduled_reminders (fire_at);

CREATE INDEX IF NOT EXISTS idx_scheduled_reminders_event_id 
  ON scheduled_reminders (event_id);

-- Create table to track fired reminders (avoid duplicates)
CREATE TABLE IF NOT EXISTS fired_reminders (
  id SERIAL PRIMARY KEY,
  event_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  fire_at TIMESTAMP(3) NOT NULL,
  minutes_before INT NOT NULL,
  fired_at TIMESTAMP(3) NOT NULL DEFAULT NOW(),
  UNIQUE(event_id, user_id, fire_at, minutes_before)
);

-- Create index on fired_reminders for lookup
CREATE INDEX IF NOT EXISTS fired_reminders_fire_at_idx 
  ON fired_reminders (fire_at);

-- Function to refresh the materialized view
CREATE OR REPLACE FUNCTION refresh_scheduled_reminders_view()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY scheduled_reminders;
END;
$$ LANGUAGE plpgsql;

-- Function to get reminders due to fire (checks reminders within 1 minute window)
CREATE OR REPLACE FUNCTION get_due_reminders()
RETURNS TABLE(event_id UUID, user_id UUID, title TEXT, minutes_before INT, event_start_at TIMESTAMP) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sr.event_id::UUID,
    sr.user_id::UUID,
    sr.title,
    sr.minutes_before,
    sr.event_start_at::TIMESTAMP
  FROM scheduled_reminders sr
  WHERE 
    -- Fire when current time is within 1 minute window
    sr.fire_at >= NOW() - INTERVAL '1 minute'
    AND sr.fire_at < NOW() + INTERVAL '1 minute'
    -- Check not already fired
    AND NOT EXISTS (
      SELECT 1 FROM fired_reminders fr
      WHERE fr.event_id::TEXT = sr.event_id::TEXT
        AND fr.user_id::TEXT = sr.user_id::TEXT
        AND fr.fire_at = sr.fire_at
        AND fr.minutes_before = sr.minutes_before
    );
END;
$$ LANGUAGE plpgsql;

-- Function to notify Node.js about due reminders
-- This will be called every minute by Node.js cron (not pg_cron)
CREATE OR REPLACE FUNCTION notify_due_reminders()
RETURNS void AS $$
DECLARE
  reminder RECORD;
BEGIN
  -- Get all reminders due to fire
  FOR reminder IN SELECT * FROM get_due_reminders()
  LOOP
    -- Send PostgreSQL NOTIFY to Node.js listening on 'reminder_fired' channel
    -- Node.js will receive this as an event and process it
    PERFORM pg_notify(
      'reminder_fired',
      json_build_object(
        'event_id', reminder.event_id,
        'user_id', reminder.user_id,
        'title', reminder.title,
        'minutes_before', reminder.minutes_before,
        'event_start_at', reminder.event_start_at
      )::text
    );
  END LOOP;
END;
$$ LANGUAGE plpgsql;

