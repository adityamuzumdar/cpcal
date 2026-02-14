const express = require('express')
const cors = require('cors')

const { PLATFORM_LABELS } = require('./lib/constants')
const { httpClient } = require('./lib/httpClient')
const { getContests } = require('./lib/contestService')
const { toIcs } = require('./lib/ics')

const router = express.Router()

router.use(cors())

router.get('/', (_req, res) => {
  res.json({
    service: 'cpcal backend',
    endpoints: ['/api/platforms', '/api/upcoming', '/api/ics', '/api/notify/webhook'],
  })
})

router.get('/platforms', (_req, res) => {
  const platforms = Object.entries(PLATFORM_LABELS).map(([id, label]) => ({ id, label }))
  res.json(platforms)
})

router.get('/upcoming', async (req, res) => {
  const contests = await getContests(req.query)
  res.json({
    generatedAt: Date.now(),
    total: contests.length,
    platforms: Object.keys(PLATFORM_LABELS),
    contests,
  })
})

router.get('/ics', async (req, res) => {
  const contests = await getContests(req.query)
  const payload = toIcs(contests)

  res.setHeader('Content-Type', 'text/calendar; charset=utf-8')
  res.setHeader('Content-Disposition', 'attachment; filename="cpcal-contests.ics"')
  res.send(payload)
})

router.post('/notify/webhook', async (req, res) => {
  const { webhookUrl, minutesAhead = 60, platforms = [], q = '' } = req.body || {}

  if (!webhookUrl || typeof webhookUrl !== 'string') {
    return res.status(400).json({ error: 'webhookUrl is required' })
  }

  const now = Date.now()
  const contests = await getContests({
    includePast: false,
    horizonDays: Math.max(1, Math.ceil(Number(minutesAhead) / (24 * 60))),
    platforms: Array.isArray(platforms) ? platforms.join(',') : String(platforms || ''),
    q,
  })

  const windowMs = Number(minutesAhead) * 60 * 1000
  const due = contests.filter((contest) => contest.startTime >= now && contest.startTime <= now + windowMs)

  try {
    await httpClient.post(webhookUrl, {
      generatedAt: now,
      minutesAhead: Number(minutesAhead),
      count: due.length,
      contests: due,
    })

    return res.json({ ok: true, sent: due.length })
  } catch (error) {
    return res.status(502).json({
      ok: false,
      error: 'Failed to deliver webhook',
      detail: String(error.message || error),
    })
  }
})

module.exports = router
