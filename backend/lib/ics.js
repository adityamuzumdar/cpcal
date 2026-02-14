const formatIcsDate = (date) => date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')

const escapeIcsText = (value) =>
  String(value || '')
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n')

const toIcs = (contests) => {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//cpcal//Contest Calendar//EN',
    'CALSCALE:GREGORIAN',
    ...contests.flatMap((contest) => [
      'BEGIN:VEVENT',
      `UID:${contest.id}@cpcal`,
      `DTSTAMP:${formatIcsDate(new Date())}`,
      `DTSTART:${formatIcsDate(new Date(contest.startTime))}`,
      `DTEND:${formatIcsDate(new Date(contest.endTime))}`,
      `SUMMARY:${escapeIcsText(`${contest.platformLabel}: ${contest.title}`)}`,
      `DESCRIPTION:${escapeIcsText(`Contest URL: ${contest.url}`)}`,
      `URL:${contest.url}`,
      'END:VEVENT',
    ]),
    'END:VCALENDAR',
  ]

  return `${lines.join('\r\n')}\r\n`
}

module.exports = {
  toIcs,
}
