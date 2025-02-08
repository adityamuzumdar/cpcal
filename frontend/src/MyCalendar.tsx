import { useEffect, useState } from 'react';
import { Calendar, momentLocalizer, Event } from 'react-big-calendar';
import moment from 'moment';
import "react-big-calendar/lib/css/react-big-calendar.css";

const localizer = momentLocalizer(moment);

interface ContestEvent {
  title: string;
  start: Date;
  end: Date;
  url: string;
}

const MyCalendar: React.FC = () => {
  const [events, setEvents] = useState<ContestEvent[]>([]);

  useEffect(() => {
    const fetchContestData = async () => {
      try {
        const backendUrl = (import.meta.env.VITE_BACKEND_URL as string);
        console.log('Backend URL:', backendUrl);
        const response = await fetch(`${backendUrl}/api/upcoming`);
        const data: any[] = await response.json();

        // Format the contests data to match the Calendar events structure
        const formattedEvents: ContestEvent[] = data.map((contest) => ({
          title: contest.title,
          start: new Date(contest.startTime),
          end: new Date(contest.endTime),
          url: contest.url,
        }));

        setEvents(formattedEvents);
      } catch (error) {
        console.error('Error fetching contest data:', error);
      }
    };

    fetchContestData();
  }, []);

  return (
    <div style={{ padding: '20px' }}>
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={{ height: '90vh', border: '1px solid #ddd', borderRadius: '10px', padding: '10px' }}
        onSelectEvent={(event: ContestEvent) => window.open(event.url, '_blank')}
      />
    </div>
  );
};

export default MyCalendar;