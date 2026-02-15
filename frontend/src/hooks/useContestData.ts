import { useEffect, useMemo, useState } from 'react'
import { DAY_MS, STORAGE_KEYS } from '../constants/contest'
import { CalendarEvent, ContestApiEvent, Platform, PlatformId } from '../types/contest'
import { readStoredNotes, readStoredSet } from '../utils/storage'

interface ContestState {
  platforms: Platform[]
  events: CalendarEvent[]
  enabledPlatforms: Set<PlatformId>
  searchTerm: string
  setSearchTerm: (value: string) => void
  horizonDays: number
  setHorizonDays: (value: number) => void
  showPastContests: boolean
  setShowPastContests: (value: boolean) => void
  pastDaysWindow: number
  setPastDaysWindow: (value: number) => void
  viewMode: 'calendar' | 'list'
  setViewMode: (value: 'calendar' | 'list') => void
  showBookmarksOnly: boolean
  setShowBookmarksOnly: (value: boolean) => void
  bookmarkedIds: Set<string>
  completedIds: Set<string>
  notesByContest: Record<string, string>
  goalTarget: number
  setGoalTarget: (value: number) => void
  reminderMinutes: number
  setReminderMinutes: (value: number) => void
  webhookUrl: string
  setWebhookUrl: (value: string) => void
  webhookStatus: string
  setWebhookStatus: (value: string) => void
  loading: boolean
  error: string | null
  timezone: string
  nextContest: CalendarEvent | null
  solvedCount: number
  progressPct: number
  icsUrl: string
  filteredEvents: CalendarEvent[]
  togglePlatform: (platformId: PlatformId) => void
  toggleBookmark: (eventId: string) => void
  toggleCompleted: (eventId: string) => void
  updateNote: (eventId: string, note: string) => void
  sendWebhookPreview: () => Promise<void>
}

export const useContestData = (): ContestState => {
  const [platforms, setPlatforms] = useState<Platform[]>([])
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [enabledPlatforms, setEnabledPlatforms] = useState<Set<PlatformId>>(new Set())
  const [searchTerm, setSearchTerm] = useState('')
  const [horizonDays, setHorizonDays] = useState(30)
  const [showPastContests, setShowPastContests] = useState(false)
  const [pastDaysWindow, setPastDaysWindow] = useState(30)
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar')
  const [showBookmarksOnly, setShowBookmarksOnly] = useState(false)
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set())
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set())
  const [notesByContest, setNotesByContest] = useState<Record<string, string>>({})
  const [goalTarget, setGoalTarget] = useState(20)
  const [reminderMinutes, setReminderMinutes] = useState(15)
  const [webhookUrl, setWebhookUrl] = useState('')
  const [webhookStatus, setWebhookStatus] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const backendUrl = useMemo(
    () => ((import.meta.env.VITE_BACKEND_URL as string) || 'http://localhost:5001').replace(/\/$/, ''),
    []
  )

  useEffect(() => {
    setBookmarkedIds(readStoredSet(STORAGE_KEYS.bookmarks))
    setCompletedIds(readStoredSet(STORAGE_KEYS.completed))
    setNotesByContest(readStoredNotes(STORAGE_KEYS.notes))

    const storedGoal = Number(localStorage.getItem(STORAGE_KEYS.goalTarget) || '20')
    if (Number.isFinite(storedGoal) && storedGoal > 0) {
      setGoalTarget(storedGoal)
    }

    const storedReminder = Number(localStorage.getItem(STORAGE_KEYS.reminderMinutes) || '15')
    if (Number.isFinite(storedReminder) && storedReminder > 0) {
      setReminderMinutes(storedReminder)
    }

    setWebhookUrl(localStorage.getItem(STORAGE_KEYS.webhookUrl) || '')
  }, [])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.bookmarks, JSON.stringify(Array.from(bookmarkedIds)))
  }, [bookmarkedIds])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.completed, JSON.stringify(Array.from(completedIds)))
  }, [completedIds])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.notes, JSON.stringify(notesByContest))
  }, [notesByContest])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.goalTarget, String(goalTarget))
  }, [goalTarget])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.reminderMinutes, String(reminderMinutes))
  }, [reminderMinutes])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.webhookUrl, webhookUrl)
  }, [webhookUrl])

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      setError(null)

      try {
        const upcomingParams = new URLSearchParams()
        upcomingParams.set('includePast', String(showPastContests))
        upcomingParams.set('pastDays', String(pastDaysWindow))
        if (horizonDays > 0) {
          upcomingParams.set('horizonDays', String(horizonDays))
        }

        const [platformsRes, eventsRes] = await Promise.all([
          fetch(`${backendUrl}/api/platforms`),
          fetch(`${backendUrl}/api/upcoming?${upcomingParams.toString()}`),
        ])

        if (!platformsRes.ok || !eventsRes.ok) {
          throw new Error('Failed to fetch contest data')
        }

        const platformData: Platform[] = await platformsRes.json()
        const payload: { contests?: ContestApiEvent[] } = await eventsRes.json()
        const contests = Array.isArray(payload?.contests) ? payload.contests : []

        const mappedEvents: CalendarEvent[] = contests.map(contest => ({
          id: contest.id || `${contest.platform}-${contest.startTime}-${contest.url}`,
          title: contest.title,
          platform: contest.platform,
          platformLabel: contest.platformLabel || contest.platform,
          start: new Date(contest.startTime),
          end: new Date(contest.endTime),
          duration: contest.duration,
          url: contest.url,
        }))

        setPlatforms(platformData)
        setEnabledPlatforms(new Set(platformData.map(platform => platform.id)))
        setEvents(mappedEvents)
      } catch (_err) {
        setError('Unable to load contests. Check backend availability and try again.')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [backendUrl, horizonDays, pastDaysWindow, showPastContests])

  const filteredEvents = useMemo(() => {
    const now = Date.now()
    const pastLowerLimit = showPastContests ? now - pastDaysWindow * DAY_MS : now
    const horizonUpperLimit = horizonDays > 0 ? now + horizonDays * DAY_MS : Number.POSITIVE_INFINITY
    const normalizedSearch = searchTerm.trim().toLowerCase()

    return events.filter(event => {
      const platformMatch = enabledPlatforms.has(event.platform)
      const pastMatch = event.start.getTime() >= pastLowerLimit
      const horizonMatch = event.start.getTime() <= horizonUpperLimit
      const searchMatch =
        normalizedSearch.length === 0 ||
        event.title.toLowerCase().includes(normalizedSearch) ||
        event.platformLabel.toLowerCase().includes(normalizedSearch)
      const bookmarkMatch = !showBookmarksOnly || bookmarkedIds.has(event.id)

      return platformMatch && pastMatch && horizonMatch && searchMatch && bookmarkMatch
    })
  }, [
    bookmarkedIds,
    enabledPlatforms,
    events,
    horizonDays,
    pastDaysWindow,
    searchTerm,
    showBookmarksOnly,
    showPastContests,
  ])

  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
  const nextContest = filteredEvents.find(event => event.start.getTime() >= Date.now()) || null
  const solvedCount = completedIds.size
  const progressPct = Math.min(100, Math.round((solvedCount / Math.max(goalTarget, 1)) * 100))
  const icsParams = new URLSearchParams()
  icsParams.set('includePast', String(showPastContests))
  icsParams.set('pastDays', String(pastDaysWindow))
  if (horizonDays > 0) {
    icsParams.set('horizonDays', String(horizonDays))
  }
  const icsUrl = `${backendUrl}/api/ics?${icsParams.toString()}`

  const togglePlatform = (platformId: PlatformId) => {
    setEnabledPlatforms(current => {
      const next = new Set(current)
      if (next.has(platformId)) {
        next.delete(platformId)
      } else {
        next.add(platformId)
      }
      return next
    })
  }

  const toggleBookmark = (eventId: string) => {
    setBookmarkedIds(current => {
      const next = new Set(current)
      if (next.has(eventId)) {
        next.delete(eventId)
      } else {
        next.add(eventId)
      }
      return next
    })
  }

  const toggleCompleted = (eventId: string) => {
    setCompletedIds(current => {
      const next = new Set(current)
      if (next.has(eventId)) {
        next.delete(eventId)
      } else {
        next.add(eventId)
      }
      return next
    })
  }

  const updateNote = (eventId: string, note: string) => {
    setNotesByContest(current => ({ ...current, [eventId]: note }))
  }

  const sendWebhookPreview = async () => {
    if (!webhookUrl) {
      setWebhookStatus('Enter a webhook URL first')
      return
    }

    setWebhookStatus('Sending...')

    try {
      const response = await fetch(`${backendUrl}/api/notify/webhook`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          webhookUrl,
          minutesAhead: reminderMinutes,
          platforms: Array.from(enabledPlatforms),
          q: searchTerm,
        }),
      })

      const payload = await response.json()
      if (!response.ok) {
        throw new Error(payload?.error || 'Webhook send failed')
      }

      setWebhookStatus(`Webhook sent with ${payload.sent} contest(s)`)
    } catch (err) {
      setWebhookStatus(`Webhook error: ${String((err as Error).message || err)}`)
    }
  }

  return {
    platforms,
    events,
    enabledPlatforms,
    searchTerm,
    setSearchTerm,
    horizonDays,
    setHorizonDays,
    showPastContests,
    setShowPastContests,
    pastDaysWindow,
    setPastDaysWindow,
    viewMode,
    setViewMode,
    showBookmarksOnly,
    setShowBookmarksOnly,
    bookmarkedIds,
    completedIds,
    notesByContest,
    goalTarget,
    setGoalTarget,
    reminderMinutes,
    setReminderMinutes,
    webhookUrl,
    setWebhookUrl,
    webhookStatus,
    setWebhookStatus,
    loading,
    error,
    timezone,
    nextContest,
    solvedCount,
    progressPct,
    icsUrl,
    filteredEvents,
    togglePlatform,
    toggleBookmark,
    toggleCompleted,
    updateNote,
    sendWebhookPreview,
  }
}
