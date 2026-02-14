const { DAY_MS } = require('./constants')
const { fetchAllContests } = require('./contestSources')

const uniqueBy = (items, keyBuilder) => {
  const seen = new Set()
  return items.filter((item) => {
    const key = keyBuilder(item)
    if (seen.has(key)) {
      return false
    }
    seen.add(key)
    return true
  })
}

const parseBoolean = (value, fallback = false) => {
  if (value === undefined || value === null || value === '') {
    return fallback
  }
  return String(value).toLowerCase() === 'true'
}

const parsePositiveNumber = (value, fallback) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

const applyContestFilters = (contests, query = {}) => {
  const now = Date.now()
  const includePast = parseBoolean(query.includePast, true)
  const pastDays = parsePositiveNumber(query.pastDays, 365)
  const horizonDays = parsePositiveNumber(query.horizonDays, 30)
  const searchTerm = String(query.q || '').trim().toLowerCase()

  const selectedPlatforms = String(query.platforms || '')
    .split(',')
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean)

  const lowerBound = includePast ? now - pastDays * DAY_MS : now
  const upperBound = horizonDays > 0 ? now + horizonDays * DAY_MS : Number.POSITIVE_INFINITY

  return contests
    .filter((contest) => contest.startTime >= lowerBound && contest.startTime <= upperBound)
    .filter((contest) => selectedPlatforms.length === 0 || selectedPlatforms.includes(contest.platform))
    .filter((contest) => {
      if (!searchTerm) {
        return true
      }
      return (
        contest.title.toLowerCase().includes(searchTerm) ||
        contest.platformLabel.toLowerCase().includes(searchTerm)
      )
    })
    .sort((a, b) => a.startTime - b.startTime)
}

const getContests = async (query = {}) => {
  const includePast = parseBoolean(query.includePast, true)
  const raw = await fetchAllContests({ includePast })
  const deduped = uniqueBy(raw, (contest) => `${contest.url}|${contest.startTime}`)
  return applyContestFilters(deduped, query)
}

module.exports = {
  getContests,
}
