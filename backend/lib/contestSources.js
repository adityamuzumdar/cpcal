const { PLATFORM_LABELS } = require('./constants')
const { httpClient } = require('./httpClient')

const normalizeContest = ({ platform, title, startTime, durationMs, url }) => {
  const start = Number(startTime)
  const duration = Number(durationMs)

  if (!title || !url || !Number.isFinite(start) || !Number.isFinite(duration) || duration <= 0) {
    return null
  }

  return {
    id: `${platform}-${start}-${Buffer.from(url).toString('base64').slice(0, 10)}`,
    platform,
    platformLabel: PLATFORM_LABELS[platform] || platform,
    title,
    startTime: start,
    endTime: start + duration,
    duration,
    url,
  }
}

const parseCodeforces = (payload, includePast) => {
  if (!payload?.result || !Array.isArray(payload.result)) {
    return []
  }

  return payload.result
    .filter((contest) => {
      if (!contest.startTimeSeconds) {
        return false
      }

      if (contest.phase === 'BEFORE') {
        return true
      }

      return includePast && contest.phase === 'FINISHED'
    })
    .map((contest) =>
      normalizeContest({
        platform: 'codeforces',
        title: contest.name,
        startTime: contest.startTimeSeconds * 1000,
        durationMs: contest.durationSeconds * 1000,
        url: `https://codeforces.com/contest/${contest.id}`,
      }),
    )
    .filter(Boolean)
}

const parseCodechef = (payload, includePast) => {
  const contests = []

  if (Array.isArray(payload?.future_contests)) {
    contests.push(...payload.future_contests)
  }

  if (includePast && Array.isArray(payload?.past_contests)) {
    contests.push(...payload.past_contests)
  }

  return contests
    .map((contest) =>
      normalizeContest({
        platform: 'codechef',
        title: contest.contest_name,
        startTime: new Date(contest.contest_start_date_iso || contest.contest_start_date).getTime(),
        durationMs: Number(contest.contest_duration) * 60 * 1000,
        url: `https://www.codechef.com/${contest.contest_code}`,
      }),
    )
    .filter(Boolean)
}

const parseLeetcode = (payload) => {
  const blocks = payload?.data || {}
  const upcoming = Array.isArray(blocks.upcomingContests)
    ? blocks.upcomingContests
    : Array.isArray(blocks.topTwoContests)
      ? blocks.topTwoContests
      : []

  return upcoming
    .map((contest) =>
      normalizeContest({
        platform: 'leetcode',
        title: contest.title,
        startTime: Number(contest.startTime) * 1000,
        durationMs: Number(contest.duration) * 1000,
        url: `https://leetcode.com/contest/${contest.titleSlug}`,
      }),
    )
    .filter(Boolean)
}

const parseAtcoder = (payload) => {
  if (!Array.isArray(payload)) {
    return []
  }

  return payload
    .filter((contest) => contest.start_epoch_second && contest.duration_second)
    .map((contest) =>
      normalizeContest({
        platform: 'atcoder',
        title: contest.title,
        startTime: contest.start_epoch_second * 1000,
        durationMs: contest.duration_second * 1000,
        url: `https://atcoder.jp/contests/${contest.id}`,
      }),
    )
    .filter(Boolean)
}

const fetchSafely = async (fetcher) => {
  try {
    return await fetcher()
  } catch (_error) {
    return []
  }
}

const fetchAllContests = async ({ includePast }) => {
  const [codeforces, codechef, leetcode, atcoder] = await Promise.all([
    fetchSafely(async () => {
      const { data } = await httpClient.get('https://codeforces.com/api/contest.list')
      return parseCodeforces(data, includePast)
    }),
    fetchSafely(async () => {
      const { data } = await httpClient.get(
        'https://www.codechef.com/api/list/contests/all?sort_by=START&sorting_order=asc&offset=0&mode=all',
      )
      return parseCodechef(data, includePast)
    }),
    fetchSafely(async () => {
      const { data } = await httpClient.post('https://leetcode.com/graphql', {
        query: `
          query {
            upcomingContests {
              title
              titleSlug
              startTime
              duration
            }
            topTwoContests {
              title
              titleSlug
              startTime
              duration
            }
          }
        `,
      })

      return parseLeetcode(data)
    }),
    fetchSafely(async () => {
      const { data } = await httpClient.get('https://kenkoooo.com/atcoder/resources/contests.json')
      return parseAtcoder(data)
    }),
  ])

  return [...codeforces, ...codechef, ...leetcode, ...atcoder]
}

module.exports = {
  fetchAllContests,
}
