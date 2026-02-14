import { useEffect, useRef } from 'react'
import { CalendarEvent } from '../types/contest'

export const useBrowserReminders = (events: CalendarEvent[], reminderMinutes: number) => {
  const notifiedRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    if (!('Notification' in window) || reminderMinutes <= 0) {
      return
    }

    const tick = () => {
      if (Notification.permission !== 'granted') {
        return
      }

      const now = Date.now()
      const notifyUntil = now + reminderMinutes * 60 * 1000

      events.forEach(event => {
        const startTime = event.start.getTime()
        if (startTime > now && startTime <= notifyUntil && !notifiedRef.current.has(event.id)) {
          notifiedRef.current.add(event.id)
          const minutesLeft = Math.max(1, Math.round((startTime - now) / 60000))
          new Notification(`${event.platformLabel}: ${event.title}`, {
            body: `Starts in ${minutesLeft} minute(s)`,
          })
        }
      })
    }

    tick()
    const timer = window.setInterval(tick, 30000)
    return () => window.clearInterval(timer)
  }, [events, reminderMinutes])
}
