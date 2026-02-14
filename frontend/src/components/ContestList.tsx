import { PLATFORM_COLORS } from '../constants/contest'
import { CalendarEvent } from '../types/contest'
import { formatDateTime, formatDuration, toGoogleCalendarUrl } from '../utils/contestFormat'

interface ContestListProps {
  events: CalendarEvent[]
  bookmarkedIds: Set<string>
  completedIds: Set<string>
  notesByContest: Record<string, string>
  toggleBookmark: (eventId: string) => void
  toggleCompleted: (eventId: string) => void
  updateNote: (eventId: string, note: string) => void
}

const ContestList: React.FC<ContestListProps> = ({
  events,
  bookmarkedIds,
  completedIds,
  notesByContest,
  toggleBookmark,
  toggleCompleted,
  updateNote,
}) => {
  if (events.length === 0) {
    return (
      <section className='list-wrap'>
        <p>No contests in this selection.</p>
      </section>
    )
  }

  return (
    <section className='list-wrap'>
      {events.map(event => {
        const bookmarked = bookmarkedIds.has(event.id)
        const completed = completedIds.has(event.id)
        const note = notesByContest[event.id] || ''

        return (
          <article key={event.id} className={`contest-card ${completed ? 'completed' : ''}`}>
            <div className='contest-main'>
              <small style={{ color: PLATFORM_COLORS[event.platform] }}>{event.platformLabel}</small>
              <h3>{event.title}</h3>
              <p>
                {formatDateTime(event.start)} • {formatDuration(event.duration)}
              </p>
              <textarea
                className='contest-note'
                placeholder='Notes: what went well, hard problems, learnings...'
                value={note}
                onChange={e => updateNote(event.id, e.target.value)}
              />
            </div>
            <div className='contest-actions'>
              <a href={event.url} target='_blank' rel='noreferrer'>
                Open contest
              </a>
              <a href={toGoogleCalendarUrl(event)} target='_blank' rel='noreferrer'>
                Add to Google Calendar
              </a>
              <button type='button' onClick={() => toggleBookmark(event.id)}>
                {bookmarked ? 'Unbookmark' : 'Bookmark'}
              </button>
              <button type='button' onClick={() => toggleCompleted(event.id)}>
                {completed ? 'Mark pending' : 'Mark completed'}
              </button>
            </div>
          </article>
        )
      })}
    </section>
  )
}

export default ContestList
