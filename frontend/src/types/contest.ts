export type PlatformId = 'atcoder' | 'codechef' | 'codeforces' | 'leetcode'

export interface Platform {
  id: PlatformId
  label: string
}

export interface ContestApiEvent {
  id?: string
  platform: PlatformId
  platformLabel: string
  title: string
  startTime: number
  endTime: number
  duration: number
  url: string
}

export interface CalendarEvent {
  id: string
  title: string
  platform: PlatformId
  platformLabel: string
  start: Date
  end: Date
  duration: number
  url: string
}
