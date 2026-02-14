import { CalendarEvent } from '../types/contest'

export const formatDateTime = (date: Date) =>
  new Intl.DateTimeFormat(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date)

export const formatDuration = (durationMs: number) => {
  const totalMinutes = Math.round(durationMs / (60 * 1000))
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60

  if (hours === 0) {
    return `${minutes}m`
  }
  if (minutes === 0) {
    return `${hours}h`
  }
  return `${hours}h ${minutes}m`
}

const formatIcsDate = (date: Date) =>
  date
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}/, '')

export const toGoogleCalendarUrl = (event: CalendarEvent) => {
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: `${event.platformLabel}: ${event.title}`,
    details: event.url,
    dates: `${formatIcsDate(event.start)}/${formatIcsDate(event.end)}`,
  })

  return `https://calendar.google.com/calendar/render?${params.toString()}`
}
