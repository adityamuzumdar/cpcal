import { PlatformId } from '../types/contest'

export const DAY_MS = 24 * 60 * 60 * 1000

export const STORAGE_KEYS = {
  bookmarks: 'cpcal:bookmarks',
  completed: 'cpcal:completed',
  notes: 'cpcal:notes',
  goalTarget: 'cpcal:goal-target',
  reminderMinutes: 'cpcal:reminder-minutes',
  webhookUrl: 'cpcal:webhook-url',
} as const

export const PLATFORM_COLORS: Record<PlatformId, string> = {
  atcoder: '#0066ff',
  codechef: '#6f4e37',
  codeforces: '#f39c12',
  leetcode: '#e67e22',
}

export const HORIZON_OPTIONS = [
  { label: 'All future', value: 0 },
  { label: 'Next 7 days', value: 7 },
  { label: 'Next 30 days', value: 30 },
  { label: 'Next 90 days', value: 90 },
]
