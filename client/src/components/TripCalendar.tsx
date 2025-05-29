import { useMemo } from "react";
import { Calendar, dateFnsLocalizer, Views, View } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { de } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { TripWithDetails } from "@shared/schema";
import "react-big-calendar/lib/css/react-big-calendar.css";

interface TripCalendarProps {
  trip: TripWithDetails;
}

const locales = {
  de: de,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  type: "activity" | "restaurant";
  resource?: any;
}

export default function TripCalendar({ trip }: TripCalendarProps) {
  const events = useMemo<CalendarEvent[]>(() => {
    const calendarEvents: CalendarEvent[] = [];

    // Add activities to calendar
    (trip.activities || []).forEach((activity) => {
      if (activity.date) {
        const activityDate = new Date(activity.date);
        
        // Parse time if available, otherwise use default time
        let startTime = new Date(activityDate);
        let endTime = new Date(activityDate);
        
        if (activity.time) {
          const [hours, minutes] = activity.time.split(':').map(Number);
          startTime.setHours(hours, minutes, 0, 0);
          endTime.setHours(hours + 2, minutes, 0, 0); // Default 2-hour duration
        } else {
          startTime.setHours(10, 0, 0, 0); // Default start at 10:00
          endTime.setHours(12, 0, 0, 0); // Default end at 12:00
        }

        calendarEvents.push({
          id: `activity-${activity.id}`,
          title: activity.title,
          start: startTime,
          end: endTime,
          type: "activity",
          resource: activity,
        });
      }
    });

    // Add restaurants to calendar
    (trip.restaurants || []).forEach((restaurant) => {
      if (restaurant.date) {
        const restaurantDate = new Date(restaurant.date);
        
        // Parse time if available, otherwise use default time
        let startTime = new Date(restaurantDate);
        let endTime = new Date(restaurantDate);
        
        if (restaurant.time) {
          const [hours, minutes] = restaurant.time.split(':').map(Number);
          startTime.setHours(hours, minutes, 0, 0);
          endTime.setHours(hours + 2, minutes, 0, 0); // Default 2-hour duration
        } else {
          startTime.setHours(19, 0, 0, 0); // Default dinner time at 19:00
          endTime.setHours(21, 0, 0, 0); // Default end at 21:00
        }

        calendarEvents.push({
          id: `restaurant-${restaurant.id}`,
          title: restaurant.name,
          start: startTime,
          end: endTime,
          type: "restaurant",
          resource: restaurant,
        });
      }
    });

    return calendarEvents;
  }, [trip.activities, trip.restaurants]);

  const eventStyleGetter = (event: CalendarEvent) => {
    let backgroundColor = '#3b82f6'; // Default blue for activities
    let color = 'white';

    if (event.type === 'restaurant') {
      backgroundColor = '#f59e0b'; // Yellow for restaurants
    }

    return {
      style: {
        backgroundColor,
        color,
        border: 'none',
        borderRadius: '4px',
        fontSize: '12px',
        padding: '2px 4px',
      },
    };
  };

  const CustomEvent = ({ event }: { event: CalendarEvent }) => {
    return (
      <div className="text-xs font-medium truncate">
        {event.title}
      </div>
    );
  };

  const messages = {
    allDay: 'Ganztägig',
    previous: 'Zurück',
    next: 'Weiter',
    today: 'Heute',
    month: 'Monat',
    week: 'Woche',
    day: 'Tag',
    agenda: 'Agenda',
    date: 'Datum',
    time: 'Zeit',
    event: 'Ereignis',
    noEventsInRange: 'Keine Ereignisse in diesem Zeitraum.',
    showMore: (total: number) => `+ ${total} mehr`,
  };

  // Calculate default date range
  const defaultDate = useMemo(() => {
    if (trip.startDate) {
      return new Date(trip.startDate);
    }
    return new Date();
  }, [trip.startDate]);

  const minDate = useMemo(() => {
    if (trip.startDate) {
      const date = new Date(trip.startDate);
      date.setDate(date.getDate() - 1);
      return date;
    }
    return undefined;
  }, [trip.startDate]);

  const maxDate = useMemo(() => {
    if (trip.endDate) {
      const date = new Date(trip.endDate);
      date.setDate(date.getDate() + 1);
      return date;
    }
    return undefined;
  }, [trip.endDate]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Reise-Kalender</CardTitle>
        </CardHeader>
        <CardContent>
          <div style={{ height: '600px' }}>
            <Calendar
              localizer={localizer}
              events={events}
              startAccessor="start"
              endAccessor="end"
              defaultDate={defaultDate}
              min={minDate}
              max={maxDate}
              views={[Views.MONTH, Views.WEEK, Views.DAY]}
              defaultView={Views.WEEK}
              eventPropGetter={eventStyleGetter}
              components={{
                event: CustomEvent,
              }}
              messages={messages}
              culture="de"
              className="react-big-calendar-custom"
            />
          </div>
        </CardContent>
      </Card>

      {/* Event Legend */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center space-x-8">
            <div className="flex items-center">
              <div className="w-4 h-4 bg-blue-500 rounded mr-2"></div>
              <span className="text-sm text-slate-600">Aktivitäten</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-yellow-500 rounded mr-2"></div>
              <span className="text-sm text-slate-600">Restaurants</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Event Summary */}
      {events.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Geplante Ereignisse</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {events
                .sort((a, b) => a.start.getTime() - b.start.getTime())
                .map((event) => (
                  <div key={event.id} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-b-0">
                    <div className="flex items-center space-x-3">
                      <Badge variant={event.type === 'activity' ? 'default' : 'secondary'}>
                        {event.type === 'activity' ? 'Aktivität' : 'Restaurant'}
                      </Badge>
                      <span className="font-medium">{event.title}</span>
                    </div>
                    <div className="text-sm text-slate-600">
                      {format(event.start, 'dd.MM.yyyy HH:mm', { locale: de })}
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
