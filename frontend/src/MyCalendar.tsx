import { Calendar, momentLocalizer } from 'react-big-calendar'
import moment from 'moment'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import './MyCalendar.css'

import ContestList from './components/ContestList'
import { HORIZON_OPTIONS, PLATFORM_COLORS } from './constants/contest'
import { useBrowserReminders } from './hooks/useBrowserReminders'
import { useContestData } from './hooks/useContestData'
import { CalendarEvent } from './types/contest'
import { formatDateTime } from './utils/contestFormat'

const localizer = momentLocalizer(moment)

const MyCalendar: React.FC = () => {
  const {
    platforms,
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
  } = useContestData()

  useBrowserReminders(filteredEvents, reminderMinutes)

  const platformCounts = (() => {
    const counts = new Map<string, number>()
    filteredEvents.forEach(event => {
      counts.set(event.platformLabel, (counts.get(event.platformLabel) || 0) + 1)
    })
    return Array.from(counts.entries()).sort((a, b) => b[1] - a[1])
  })()

  if (loading) {
    return <div className='app-shell'>Loading contests...</div>
  }

  if (error) {
    return <div className='app-shell'>{error}</div>
  }

  return (
    <div className='app-shell'>
      <header className='hero'>
        <div>
          <h1>CP Contest Radar</h1>
          <p>Track contests with previous-year history in your timezone ({timezone}).</p>
        </div>
        <div className='hero-actions'>
          <button type='button' onClick={() => setViewMode(viewMode === 'calendar' ? 'list' : 'calendar')}>
            Switch to {viewMode === 'calendar' ? 'List' : 'Calendar'}
          </button>
          <a href={icsUrl} target='_blank' rel='noreferrer' className='plain-button'>
            Subscribe iCal Feed
          </a>
        </div>
      </header>

      <section className='controls'>
        <input
          type='text'
          value={searchTerm}
          onChange={event => setSearchTerm(event.target.value)}
          placeholder='Search by contest or platform'
        />
        <select value={horizonDays} onChange={event => setHorizonDays(Number(event.target.value))}>
          {HORIZON_OPTIONS.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </section>

      <section className='utility-row'>
        <label>
          <input
            type='checkbox'
            checked={showBookmarksOnly}
            onChange={event => setShowBookmarksOnly(event.target.checked)}
          />
          Show bookmarks only
        </label>
        <label>
          <input
            type='checkbox'
            checked={showPastContests}
            onChange={event => setShowPastContests(event.target.checked)}
          />
          Include previous contests
        </label>
        {showPastContests && (
          <label>
            Past window (days):
            <input
              type='number'
              min={1}
              max={365}
              value={pastDaysWindow}
              onChange={event => setPastDaysWindow(Math.max(1, Number(event.target.value) || 365))}
            />
          </label>
        )}
        <label>
          Reminder (minutes):
          <input
            type='number'
            min={1}
            max={240}
            value={reminderMinutes}
            onChange={event => setReminderMinutes(Math.max(1, Number(event.target.value) || 15))}
          />
        </label>
        {'Notification' in window ? (
          <button type='button' onClick={() => Notification.requestPermission()}>
            Enable browser reminders
          </button>
        ) : (
          <span>Browser notifications not supported</span>
        )}
      </section>

      <section className='platform-filters'>
        {platforms.map(platform => {
          const selected = enabledPlatforms.has(platform.id)
          const color = PLATFORM_COLORS[platform.id]

          return (
            <button
              key={platform.id}
              type='button'
              className={selected ? 'selected' : ''}
              onClick={() => togglePlatform(platform.id)}
              style={{ borderColor: color }}
            >
              <span className='dot' style={{ backgroundColor: color }} />
              {platform.label}
            </button>
          )
        })}
      </section>

      <section className='stats-grid'>
        <article>
          <h3>Filtered contests</h3>
          <p>{filteredEvents.length}</p>
        </article>
        <article>
          <h3>Next contest</h3>
          <p>{nextContest ? formatDateTime(nextContest.start) : 'No upcoming contest in this view'}</p>
        </article>
        <article>
          <h3>By platform</h3>
          <p>{platformCounts.map(([name, count]) => `${name} (${count})`).join(', ') || 'No data'}</p>
        </article>
        <article>
          <h3>Goal progress</h3>
          <p>
            {solvedCount}/{goalTarget} ({progressPct}%)
          </p>
          <input
            type='number'
            min={1}
            max={1000}
            value={goalTarget}
            onChange={event => setGoalTarget(Math.max(1, Number(event.target.value) || 1))}
          />
        </article>
      </section>

      <section className='webhook-box'>
        <h3>Webhook notifier</h3>
        <p>Send contests starting within your reminder window to Discord/Slack/custom webhook.</p>
        <div className='webhook-controls'>
          <input
            type='url'
            value={webhookUrl}
            onChange={event => setWebhookUrl(event.target.value)}
            placeholder='https://example.com/webhook'
          />
          <button type='button' onClick={sendWebhookPreview}>
            Send now
          </button>
        </div>
        <small>{webhookStatus}</small>
      </section>

      {viewMode === 'calendar' ? (
        <div className='calendar-wrap'>
          <Calendar<CalendarEvent>
            localizer={localizer}
            events={filteredEvents}
            startAccessor='start'
            endAccessor='end'
            style={{ height: '70vh' }}
            eventPropGetter={event => ({
              style: {
                backgroundColor: PLATFORM_COLORS[event.platform],
                borderRadius: '8px',
                border: 'none',
              },
            })}
            onSelectEvent={event => window.open(event.url, '_blank', 'noopener,noreferrer')}
          />
        </div>
      ) : (
        <ContestList
          events={filteredEvents}
          bookmarkedIds={bookmarkedIds}
          completedIds={completedIds}
          notesByContest={notesByContest}
          toggleBookmark={toggleBookmark}
          toggleCompleted={toggleCompleted}
          updateNote={updateNote}
        />
      )}
    </div>
  )
}

export default MyCalendar
