import { useMemo, useState } from "react";
import { Calendar, dateFnsLocalizer, Views, View } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { de } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CalendarIcon, ClockIcon, MapPinIcon, UtensilsIcon, Download } from "lucide-react";
import type { TripWithDetails } from "@shared/schema";
import "react-big-calendar/lib/css/react-big-calendar.css";
import "./calendar-styles.css";

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
  const [currentView, setCurrentView] = useState<View>(Views.MONTH);
  const [currentDate, setCurrentDate] = useState<Date>(() => {
    if (trip.startDate) {
      return new Date(trip.startDate);
    }
    return new Date();
  });

  const events = useMemo(() => {
    const calendarEvents: CalendarEvent[] = [];

    // Add activities
    trip.activities?.forEach((activity) => {
      if (activity.date) {
        const activityDate = new Date(activity.date);
        
        // Parse timeFrom and timeTo if available
        let startTime = new Date(activityDate);
        let endTime = new Date(activityDate);
        
        if (activity.timeFrom) {
          const [hours, minutes] = activity.timeFrom.split(':').map(Number);
          startTime.setHours(hours, minutes, 0, 0);
          
          if (activity.timeTo) {
            const [endHours, endMinutes] = activity.timeTo.split(':').map(Number);
            endTime.setHours(endHours, endMinutes, 0, 0);
          } else {
            // Default 2-hour duration
            endTime.setHours(hours + 2, minutes, 0, 0);
          }
        } else {
          // Default times if no time specified
          startTime.setHours(10, 0, 0, 0);
          endTime.setHours(12, 0, 0, 0);
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

    // Add restaurants
    trip.restaurants?.forEach((restaurant) => {
      if (restaurant.date) {
        const restaurantDate = new Date(restaurant.date);
        
        let startTime = new Date(restaurantDate);
        let endTime = new Date(restaurantDate);
        
        if (restaurant.timeFrom) {
          const [hours, minutes] = restaurant.timeFrom.split(':').map(Number);
          startTime.setHours(hours, minutes, 0, 0);
          
          if (restaurant.timeTo) {
            const [endHours, endMinutes] = restaurant.timeTo.split(':').map(Number);
            endTime.setHours(endHours, endMinutes, 0, 0);
          } else {
            // Default 2-hour duration
            endTime.setHours(hours + 2, minutes, 0, 0);
          }
        } else {
          // Default dinner time
          startTime.setHours(19, 0, 0, 0);
          endTime.setHours(21, 0, 0, 0);
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
    const baseStyle = {
      border: 'none',
      borderRadius: '6px',
      padding: '4px 8px',
      fontSize: '11px',
      fontWeight: '500',
      color: 'white',
      lineHeight: '1.3',
    };

    if (event.type === 'activity') {
      return {
        style: baseStyle,
        className: 'activity-event',
      };
    } else {
      return {
        style: baseStyle,
        className: 'restaurant-event',
      };
    }
  };

  const CustomEvent = ({ event }: { event: CalendarEvent }) => (
    <div className="flex items-center space-x-1 truncate">
      {event.type === 'activity' ? (
        <CalendarIcon size={10} className="flex-shrink-0" />
      ) : (
        <UtensilsIcon size={10} className="flex-shrink-0" />
      )}
      <span className="text-xs font-medium truncate">{event.title}</span>
    </div>
  );

  const AgendaEvent = ({ event }: { event: CalendarEvent }) => (
    <div className={`rbc-event-content ${event.type}-event`}>
      <div className="flex items-center space-x-2">
        {event.type === 'activity' ? (
          <CalendarIcon size={14} className="flex-shrink-0" />
        ) : (
          <UtensilsIcon size={14} className="flex-shrink-0" />
        )}
        <span className="font-medium">{event.title}</span>
      </div>
    </div>
  );

  // Modern Agenda Component
  const ModernAgenda = () => {
    const sortedEvents = events.sort((a, b) => a.start.getTime() - b.start.getTime());
    
    if (sortedEvents.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-64 text-gray-500">
          <CalendarIcon size={48} className="mb-4 opacity-50" />
          <p className="text-lg font-medium">Keine Ereignisse geplant</p>
          <p className="text-sm">Fügen Sie Aktivitäten oder Restaurants hinzu</p>
        </div>
      );
    }

    return (
      <div className="space-y-4 p-6">
        {sortedEvents.map((event) => {
          // Clean up any invalid characters from location
          const rawLocation = event.resource?.location || event.resource?.address || '';
          const location = rawLocation.replace(/[^\w\s\-,.äöüÄÖÜß]/g, '').trim();
          const mapsUrl = location ? `https://maps.google.com/maps?q=${encodeURIComponent(location)}` : '';
          
          return (
            <div 
              key={event.id} 
              className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden group"
            >
              <div className="p-6">
                <div className="flex items-start justify-between">
                  {/* Event Info */}
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        event.type === 'activity' 
                          ? 'bg-blue-100 text-blue-600' 
                          : 'bg-purple-100 text-purple-600'
                      }`}>
                        {event.type === 'activity' ? (
                          <CalendarIcon size={20} />
                        ) : (
                          <UtensilsIcon size={20} />
                        )}
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                          {event.title}
                        </h3>
                        <div className="flex items-center space-x-2 text-sm text-gray-500">
                          <ClockIcon size={14} />
                          <span>
                            {format(event.start, 'HH:mm', { locale: de })} - {format(event.end, 'HH:mm', { locale: de })}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Location */}
                    {location && (
                      <div className="flex items-center space-x-2 mt-3">
                        <MapPinIcon size={14} className="text-gray-400 flex-shrink-0" />
                        <a
                          href={mapsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 hover:underline text-sm font-medium transition-colors"
                        >
                          {location}
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Date Badge */}
                  <div className="text-right">
                    <div className="bg-gray-100 px-3 py-2 rounded-lg">
                      <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {format(event.start, 'EEE', { locale: de })}
                      </div>
                      <div className="text-lg font-bold text-gray-900">
                        {format(event.start, 'dd', { locale: de })}
                      </div>
                      <div className="text-xs text-gray-500">
                        {format(event.start, 'MMM', { locale: de })}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Bottom accent bar */}
              <div className={`h-1 ${
                event.type === 'activity' ? 'bg-blue-500' : 'bg-purple-500'
              }`} />
            </div>
          );
        })}
      </div>
    );
  };

  const exportToPDF = async () => {
    try {
      // Dynamic import of jsPDF
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF();
      
      // Title
      doc.setFontSize(22);
      doc.setFont('helvetica', 'bold');
      doc.text('Reise-Kalender Agenda', 20, 25);
      
      // Trip dates
      doc.setFontSize(14);
      doc.setFont('helvetica', 'normal');
      if (trip.startDate && trip.endDate) {
        const dateRange = `${format(new Date(trip.startDate), 'dd. MMMM', { locale: de })} - ${format(new Date(trip.endDate), 'dd. MMMM yyyy', { locale: de })}`;
        doc.text(dateRange, 20, 40);
      }
      
      // Table headers with background
      let yPosition = 60;
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      
      // Header background
      doc.setFillColor(59, 130, 246); // Blue background
      doc.rect(15, yPosition - 8, 180, 12, 'F');
      
      // Header text in white
      doc.setTextColor(255, 255, 255);
      doc.text('DATUM', 20, yPosition);
      doc.text('ZEIT', 90, yPosition);
      doc.text('EREIGNIS', 140, yPosition);
      
      // Reset text color to black
      doc.setTextColor(0, 0, 0);
      yPosition += 20;
      
      // Events
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      const sortedEvents = events.sort((a, b) => a.start.getTime() - b.start.getTime());
      
             sortedEvents.forEach((event, index) => {
         if (yPosition > 250) {
           doc.addPage();
           yPosition = 30;
         }
         
         // Alternating row colors - taller rows for location
         if (index % 2 === 0) {
           doc.setFillColor(248, 250, 252); // Light gray
           doc.rect(15, yPosition - 6, 180, 20, 'F');
         }
         
         // Date
         const eventDate = format(event.start, 'EEEE, dd.MM.yyyy', { locale: de });
         doc.text(eventDate, 20, yPosition);
         
         // Time
         const timeRange = `${format(event.start, 'HH:mm', { locale: de })} - ${format(event.end, 'HH:mm', { locale: de })}`;
         doc.text(timeRange, 90, yPosition);
         
         // Event title with proper type indicator - make it clickable if location exists
         const typeIndicator = event.type === 'activity' ? '[Aktivität]' : '[Restaurant]';
         const eventTitle = `${typeIndicator} ${event.title}`;
         // Clean up any invalid characters from location
         const rawLocation = event.resource?.location || event.resource?.address || '';
         const location = rawLocation.replace(/[^\w\s\-,.äöüÄÖÜß]/g, '').trim();
         
         if (location) {
           // Make event title clickable - link to Google Maps
           const mapsUrl = `https://maps.google.com/maps?q=${encodeURIComponent(location)}`;
           doc.setTextColor(59, 130, 246); // Blue color for link
           doc.textWithLink(eventTitle, 140, yPosition, { url: mapsUrl });
           doc.setTextColor(0, 0, 0); // Reset to black
           
           // Add a small map icon to indicate it's clickable
           doc.setFontSize(8);
           doc.setTextColor(100, 100, 100); // Gray text
           doc.text('🗺️', 140 + doc.getTextWidth(eventTitle) + 3, yPosition);
           doc.setTextColor(0, 0, 0); // Reset to black
           doc.setFontSize(10);
         } else {
           // No location, just display title normally
           doc.text(eventTitle, 140, yPosition);
         }
         
         yPosition += 20;
       });
      
      // Add summary section
      yPosition += 10;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text('Zusammenfassung:', 20, yPosition);
      
      yPosition += 8;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      
      const activityCount = events.filter(e => e.type === 'activity').length;
      const restaurantCount = events.filter(e => e.type === 'restaurant').length;
      
      doc.text(`Aktivitäten: ${activityCount}`, 20, yPosition);
      doc.text(`Restaurants: ${restaurantCount}`, 20, yPosition + 6);
      doc.text(`Gesamt: ${events.length} Ereignisse`, 20, yPosition + 12);
      
      // Add footer with enhanced styling
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        
        // Footer line
        doc.setDrawColor(200, 200, 200);
        doc.line(20, 280, 190, 280);
        
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.text(`Seite ${i} von ${pageCount}`, 170, 290);
        doc.text(`Erstellt am ${format(new Date(), 'dd.MM.yyyy HH:mm', { locale: de })}`, 20, 290);
      }
      
      // Save the PDF with better filename
      const filename = `Reise-Agenda-${format(new Date(trip.startDate || new Date()), 'yyyy-MM-dd', { locale: de })}.pdf`;
      doc.save(filename);
    } catch (error) {
      console.error('Fehler beim PDF-Export:', error);
      alert('Fehler beim Erstellen der PDF-Datei. Bitte versuchen Sie es erneut.');
    }
  };

  const messages = {
    allDay: 'Ganztag',
    previous: '‹',
    next: '›',
    today: 'Heute',
    month: 'Monat',
    week: 'Woche',
    day: 'Tag',
    agenda: 'Agenda',
    date: 'DATUM',
    time: 'ZEIT',
    event: 'EREIGNIS',
    noEventsInRange: 'Keine Ereignisse in diesem Zeitraum',
    showMore: (total: number) => `+${total} weitere`,
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

  const formats = {
    timeGutterFormat: 'HH:mm',
    eventTimeRangeFormat: ({ start, end }: { start: Date; end: Date }) =>
      `${format(start, 'HH:mm', { locale: de })} - ${format(end, 'HH:mm', { locale: de })}`,
    // Agenda-Ansicht spezifische Formate
    agendaTimeFormat: (date: Date, culture?: string, localizer?: any) => 
      format(date, 'HH:mm', { locale: de }),
    agendaTimeRangeFormat: ({ start, end }: { start: Date; end: Date }) =>
      `${format(start, 'HH:mm', { locale: de })} - ${format(end, 'HH:mm', { locale: de })}`,
    agendaDateFormat: (date: Date, culture?: string, localizer?: any) =>
      format(date, 'EEEE, dd. MMMM yyyy', { locale: de }),
    agendaHeaderFormat: ({ start, end }: { start: Date; end: Date }) =>
      `${format(start, 'dd.MM.yyyy', { locale: de })} - ${format(end, 'dd.MM.yyyy', { locale: de })}`,
    // Wochenansicht vollständige Wochentags-Namen
    weekdayFormat: (date: Date) => format(date, 'EEEE', { locale: de }),
    dayHeaderFormat: (date: Date) => format(date, 'EEEE', { locale: de }),
    // Monatsansicht zeigt Monatsnamen
    monthHeaderFormat: (date: Date) => format(date, 'MMMM yyyy', { locale: de }),
  };

  return (
    <div className="space-y-8">
      {/* Ultra-Modern Calendar Card */}
      <Card className="border-0 shadow-xl bg-white/95 backdrop-blur-lg">
        <CardHeader className="pb-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-500 rounded-xl">
                <CalendarIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold text-gray-900">
                  Reise-Kalender
                </CardTitle>
                <p className="text-gray-500 mt-1">
                  {trip.startDate && trip.endDate 
                    ? `${format(new Date(trip.startDate), 'dd. MMMM', { locale: de })} - ${format(new Date(trip.endDate), 'dd. MMMM yyyy', { locale: de })}`
                    : 'Planen Sie Ihre Reise'
                  }
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500">
                {events.length} {events.length === 1 ? 'Ereignis' : 'Ereignisse'}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-8">
          {/* PDF Export Button - only visible in Agenda view */}
          {currentView === Views.AGENDA && events.length > 0 && (
            <div className="mb-4 flex justify-end">
              <Button
                onClick={exportToPDF}
                variant="outline"
                className="flex items-center space-x-2 hover:bg-blue-50 border-blue-200"
              >
                <Download size={16} />
                <span>Agenda als PDF exportieren</span>
              </Button>
            </div>
          )}
          {/* Conditional rendering based on view */}
          {currentView === Views.AGENDA ? (
            <div style={{ height: '650px', overflowY: 'auto' }} className="bg-gray-50 rounded-lg">
              <ModernAgenda />
            </div>
          ) : (
            <div style={{ height: '650px', display: 'flex', flexDirection: 'column' }} className="modern-calendar">
              <Calendar
                localizer={localizer}
                events={events}
                startAccessor="start"
                endAccessor="end"
                date={currentDate}
                onNavigate={(date: Date) => setCurrentDate(date)}
                defaultDate={defaultDate}
                views={[Views.MONTH, Views.WEEK, Views.DAY, Views.AGENDA]}
                view={currentView}
                onView={setCurrentView}
                eventPropGetter={eventStyleGetter}
                components={{
                  event: CustomEvent,
                  agenda: {
                    event: AgendaEvent,
                  },
                }}
                messages={messages}
                formats={formats}
                culture="de"
                className="react-big-calendar-custom"
                step={30}
                timeslots={2}
                min={new Date(2024, 0, 1, 6, 0, 0)}
                max={new Date(2024, 0, 1, 23, 59, 59)}
                dayPropGetter={(date: Date) => {
                  const isToday = format(date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
                  const dateStr = format(date, 'yyyy-MM-dd');
                  
                  let className = '';
                  
                  if (isToday) {
                    className += 'today-highlight ';
                  }
                  
                  if (trip.startDate && trip.endDate) {
                    // Normalize dates to avoid timezone issues
                    const tripStart = new Date(trip.startDate);
                    const tripEnd = new Date(trip.endDate);
                    const currentDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
                    const startDate = new Date(tripStart.getFullYear(), tripStart.getMonth(), tripStart.getDate());
                    const endDate = new Date(tripEnd.getFullYear(), tripEnd.getMonth(), tripEnd.getDate());
                    
                    const startDateStr = format(startDate, 'yyyy-MM-dd');
                    const endDateStr = format(endDate, 'yyyy-MM-dd');
                    const isStartDate = dateStr === startDateStr;
                    const isEndDate = dateStr === endDateStr;
                    const isTripDate = currentDate >= startDate && currentDate <= endDate;
                    
                    if (isTripDate) {
                      className += 'trip-date ';
                      
                      if (isStartDate && isEndDate) {
                        // Single day trip
                        className += 'trip-single ';
                      } else if (isStartDate) {
                        className += 'trip-start ';
                      } else if (isEndDate) {
                        className += 'trip-end ';
                      }
                    }
                  }
                  
                  return {
                    className: className.trim(),
                  };
                }}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modern Stats & Legend */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Event Types Legend */}
        <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-purple-50">
          <CardContent className="p-6">
            <h3 className="font-semibold text-gray-800 mb-4">Ereignis-Typen</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center shadow-sm">
                  <CalendarIcon size={16} className="text-white" />
                </div>
                <div>
                  <span className="font-medium text-gray-800">Aktivitäten</span>
                  <p className="text-sm text-gray-500">
                    {trip.activities?.filter(a => a.date).length || 0} geplant
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center shadow-sm">
                  <UtensilsIcon size={16} className="text-white" />
                </div>
                <div>
                  <span className="font-medium text-gray-800">Restaurants</span>
                  <p className="text-sm text-gray-500">
                    {trip.restaurants?.filter(r => r.date).length || 0} reserviert
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Trip Stats */}
        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <h3 className="font-semibold text-gray-800 mb-4">Reise-Übersicht</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Gesamte Ereignisse</span>
                <span className="font-bold text-2xl text-blue-600">{events.length}</span>
              </div>
              {trip.startDate && trip.endDate && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Reisetage</span>
                  <span className="font-bold text-2xl text-purple-600">
                    {Math.ceil((new Date(trip.endDate).getTime() - new Date(trip.startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1}
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Events Timeline */}
      {events.length > 0 && (
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-xl font-bold text-gray-800">
              <ClockIcon className="h-5 w-5 text-blue-600" />
              <span>Geplante Ereignisse</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {events
                .sort((a, b) => a.start.getTime() - b.start.getTime())
                .map((event) => (
                  <div key={event.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-all duration-200 group">
                    <div className="flex items-center space-x-4">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center shadow-sm ${
                        event.type === 'activity' ? 'bg-blue-500' : 'bg-purple-500'
                      }`}>
                        {event.type === 'activity' ? (
                          <CalendarIcon size={16} className="text-white" />
                        ) : (
                          <UtensilsIcon size={16} className="text-white" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <Badge 
                            variant={event.type === 'activity' ? 'default' : 'secondary'}
                            className={`text-xs ${
                              event.type === 'activity' 
                                ? 'bg-blue-100 text-blue-800 hover:bg-blue-200' 
                                : 'bg-purple-100 text-purple-800 hover:bg-purple-200'
                            }`}
                          >
                            {event.type === 'activity' ? 'Aktivität' : 'Restaurant'}
                          </Badge>
                          <span className="font-semibold text-gray-900">{event.title}</span>
                        </div>
                        <div className="flex items-center space-x-2 mt-1 text-sm text-gray-500">
                          <ClockIcon size={14} />
                          <span>
                            {format(event.start, 'HH:mm', { locale: de })} - {format(event.end, 'HH:mm', { locale: de })}
                          </span>
                          {event.resource?.location && (
                            <>
                              <span>•</span>
                              <MapPinIcon size={14} />
                              <span>{event.resource.location.replace(/[^\w\s\-,.äöüÄÖÜß]/g, '').trim()}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-gray-800">
                        {format(event.start, 'dd. MMM', { locale: de })}
                      </div>
                      <div className="text-sm text-gray-500">
                        {format(event.start, 'EEEE', { locale: de })}
                      </div>
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
