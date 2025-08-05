import { useMemo, useState, useEffect } from "react";
// @ts-ignore - react-big-calendar types issue
import { Calendar, dateFnsLocalizer, Views, View } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { de } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CalendarIcon, ClockIcon, MapPinIcon, UtensilsIcon, Download, Lock, Crown } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import type { TripWithDetails } from "@shared/schema";
import UpgradeModal from "./UpgradeModal";
import "react-big-calendar/lib/css/react-big-calendar.css";
import "./calendar-styles.css";

interface TripCalendarProps {
  trip: TripWithDetails;
}

interface SubscriptionInfo {
  status: 'free' | 'pro' | 'veteran';
  tripsUsed: number;
  tripsLimit: number;
  canExport: boolean;
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
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeFeature, setUpgradeFeature] = useState<'calendar' | 'export'>('calendar');

  // Get subscription info
  const { data: subscriptionInfo } = useQuery<SubscriptionInfo>({
    queryKey: ["/api/user/subscription"],
    retry: false,
    staleTime: 0, // Always consider data stale
    refetchOnWindowFocus: true, // Refetch when window gains focus
    refetchOnMount: true, // Always refetch on mount
  });

  const isFreePlan = !subscriptionInfo || subscriptionInfo.status === 'free';
  const canExport = subscriptionInfo?.canExport || false;

  // Debug: Log when component renders
  console.log('🔍 TripCalendar render:', {
    currentView,
    currentDate: format(currentDate, 'yyyy-MM-dd'),
    tripActivities: trip.activities?.length || 0,
    tripRestaurants: trip.restaurants?.length || 0
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

    console.log('🔍 Generated events:', calendarEvents.length, calendarEvents);
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

  const AgendaEvent = ({ event }: { event: CalendarEvent }) => {
    // Clean up any invalid characters from location
    const rawLocation = event.resource?.location || event.resource?.address || '';
    const location = rawLocation.replace(/[^\w\s\-,.äöüÄÖÜß]/g, '').trim();
    const mapsUrl = location ? `https://maps.google.com/maps?q=${encodeURIComponent(location)}` : '';
    
    return (
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden group p-4">
        <div className="flex items-start justify-between">
          {/* Event Info */}
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-2">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                event.type === 'activity' 
                  ? 'bg-blue-100 text-blue-600' 
                  : 'bg-purple-100 text-purple-600'
              }`}>
                {event.type === 'activity' ? (
                  <CalendarIcon size={16} />
                ) : (
                  <UtensilsIcon size={16} />
                )}
              </div>
              <div>
                <h3 className="text-base font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                  {event.title}
                </h3>
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  <ClockIcon size={12} />
                  <span>
                    {format(event.start, 'HH:mm', { locale: de })} - {format(event.end, 'HH:mm', { locale: de })}
                  </span>
                </div>
              </div>
            </div>
            
            {/* Location */}
            {location && (
              <div className="flex items-center space-x-2 mt-2">
                <MapPinIcon size={12} className="text-gray-400 flex-shrink-0" />
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
        </div>
        
        {/* Bottom accent bar */}
        <div className={`h-1 mt-3 rounded ${
          event.type === 'activity' ? 'bg-blue-500' : 'bg-purple-500'
        }`} />
      </div>
    );
  };

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
    // Check if user can export
    if (!canExport) {
      setUpgradeFeature('export');
      setShowUpgradeModal(true);
      return;
    }

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

  // Effect to manually highlight trip dates after calendar renders
  useEffect(() => {
    if (!trip.startDate || !trip.endDate) return;

    const highlightTripDates = () => {
      // Normalize dates to midnight to avoid time comparison issues
      const startDate = new Date(trip.startDate!);
      startDate.setHours(0, 0, 0, 0);
      
      const endDate = new Date(trip.endDate!);
      endDate.setHours(0, 0, 0, 0); // Set to midnight of the end date
      
      console.log('🔍 Trip dates:', format(startDate, 'yyyy-MM-dd'), 'to', format(endDate, 'yyyy-MM-dd'));
      
      if (currentView === Views.MONTH) {
        // Handle month view button styling
        const buttonLinks = document.querySelectorAll('.react-big-calendar-custom .rbc-month-view .rbc-date-cell .rbc-button-link');
        
        console.log('🔍 Found', buttonLinks.length, 'button links in month view');
        
        buttonLinks.forEach((button) => {
          const buttonElement = button as HTMLElement;
          const dateText = buttonElement.textContent?.trim();
          
          if (!dateText || isNaN(parseInt(dateText))) return;
          
          const dayNumber = parseInt(dateText);
          
          // Reset all styles first
          buttonElement.style.backgroundColor = '';
          buttonElement.style.color = '';
          buttonElement.style.fontWeight = '';
          buttonElement.style.borderRadius = '';
          buttonElement.style.border = '';
          buttonElement.style.boxShadow = '';
          
          // Check if this button is in current month by checking if it's grayed out
          const parentCell = buttonElement.closest('.rbc-date-cell') as HTMLElement;
          const isOffRange = parentCell?.classList.contains('rbc-off-range');
          
          let buttonDate: Date;
          
          if (!isOffRange) {
            // This is definitely in the current displayed month
            buttonDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), dayNumber);
          } else {
            // This might be from previous or next month, but we still want to check if it's in trip range
            // Try current month first
            buttonDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), dayNumber);
            
            // If that doesn't work, try previous month
            if (dayNumber > 15) {
              buttonDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, dayNumber);
            } else {
              // Try next month
              buttonDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, dayNumber);
            }
          }
          
          const buttonDateStr = format(buttonDate, 'yyyy-MM-dd');
          
          // Check if this date is within trip range (normalize buttonDate for comparison)
          const normalizedButtonDate = new Date(buttonDate);
          normalizedButtonDate.setHours(0, 0, 0, 0);
          const isInTripRange = normalizedButtonDate >= startDate && normalizedButtonDate <= endDate;
          
          console.log('🔍 Checking date:', buttonDateStr, 'normalized:', format(normalizedButtonDate, 'yyyy-MM-dd'), 'inRange:', isInTripRange);
          
          if (isInTripRange) {
            console.log('🟢 Highlighting date:', buttonDateStr);
            
            // Apply styles ONLY to button
            buttonElement.style.backgroundColor = '#10B981';
            buttonElement.style.color = 'white';
            buttonElement.style.fontWeight = '600';
            buttonElement.style.borderRadius = '8px';
            buttonElement.style.border = '2px solid white';
            buttonElement.style.boxShadow = '0 2px 8px rgba(16, 185, 129, 0.3)';
          }
        });
      } else if (currentView === Views.WEEK || currentView === Views.DAY) {
        // Handle week/day view header and column styling
        const headers = document.querySelectorAll('.react-big-calendar-custom .rbc-time-header .rbc-header');
        const daySlots = document.querySelectorAll('.react-big-calendar-custom .rbc-day-slot');
        
        console.log('🔍 Found', headers.length, 'headers and', daySlots.length, 'day slots in week/day view');
        
        // Clear previous trip-date classes
        headers.forEach(header => header.classList.remove('trip-date'));
        daySlots.forEach(slot => slot.classList.remove('trip-date'));
        
        // Check each day in the current week/day view
        const viewStart = new Date(currentDate);
        if (currentView === Views.WEEK) {
          // For week view, get the start of the week (Monday = 1, Sunday = 0)
          // In Germany, weeks start on Monday, but getDay() returns 0 for Sunday
          const dayOfWeek = currentDate.getDay();
          const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Convert Sunday=0 to 6, others subtract 1
          viewStart.setDate(currentDate.getDate() - daysToSubtract);
        }
        viewStart.setHours(0, 0, 0, 0);
        
        console.log('🔍 Week view start:', format(viewStart, 'yyyy-MM-dd'), 'Current date:', format(currentDate, 'yyyy-MM-dd'));
        
        for (let i = 0; i < (currentView === Views.WEEK ? 7 : 1); i++) {
          const checkDate = new Date(viewStart);
          checkDate.setDate(viewStart.getDate() + i);
          checkDate.setHours(0, 0, 0, 0);
          
          const isInTripRange = checkDate >= startDate && checkDate <= endDate;
          
          console.log('🔍 Week day', i, ':', format(checkDate, 'yyyy-MM-dd'), 'inRange:', isInTripRange);
          
          if (isInTripRange) {
            console.log('🟢 Adding trip-date class for:', format(checkDate, 'yyyy-MM-dd'));
            
            // Add trip-date class to corresponding header and day slot
            if (headers[i]) {
              headers[i].classList.add('trip-date');
            }
            if (daySlots[i]) {
              daySlots[i].classList.add('trip-date');
            }
          }
        }
      }
    };

    // Run immediately and on calendar changes
    const timeoutId = setTimeout(highlightTripDates, 100);
    
    return () => clearTimeout(timeoutId);
  }, [trip.startDate, trip.endDate, currentDate, currentView]);

  return (
    <div className="space-y-8">
      {/* Upgrade Modal */}
      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        feature={upgradeFeature}
      />

      {/* Ultra-Modern Calendar Card */}
      <Card className="border-0 shadow-xl bg-white/95 backdrop-blur-lg">
        <CardHeader className="pb-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-xl ${isFreePlan ? 'bg-gray-400' : 'bg-blue-500'}`}>
                <CalendarIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
                  <span>Reise-Kalender</span>
                  {isFreePlan && <Lock className="h-5 w-5 text-gray-400" />}
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
          {/* Premium Feature Block for Free Users */}
          {isFreePlan ? (
            <div className="text-center py-16 space-y-6">
              <div className="relative">
                <div className="p-4 bg-gradient-to-br from-purple-100 to-blue-100 rounded-full w-24 h-24 mx-auto flex items-center justify-center">
                  <Crown className="h-12 w-12 text-purple-600" />
                </div>
                <div className="absolute -top-2 -right-2 bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-1 rounded-full">
                  PRO
                </div>
              </div>
              
              <div className="space-y-3">
                <h3 className="text-xl font-bold text-gray-900">
                  Kalender-Funktion freischalten
                </h3>
                <p className="text-gray-600 max-w-md mx-auto">
                  Organisieren Sie Ihre Reise mit unserem interaktiven Kalender. 
                  Sehen Sie alle Aktivitäten und Restaurants in der Zeitübersicht.
                </p>
              </div>

              <div className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-lg p-4 max-w-sm mx-auto">
                <div className="text-2xl font-bold text-purple-600 mb-2">
                  €4.99<span className="text-sm font-normal text-gray-500">/Monat</span>
                </div>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>✓ Bis zu 10 Reisen</li>
                  <li>✓ Interaktiver Kalender</li>
                  <li>✓ PDF Export</li>
                  <li>✓ Premium Support</li>
                </ul>
              </div>

              <Button
                onClick={() => {
                  setUpgradeFeature('calendar');
                  setShowUpgradeModal(true);
                }}
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold px-8 py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
              >
                Jetzt freischalten
              </Button>
            </div>
          ) : (
            <>
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
              
              {/* Calendar with custom agenda rendering */}
              {currentView === Views.AGENDA ? (
                <div>
                  {/* Custom navigation bar for agenda */}
                  <div style={{ marginBottom: '20px' }}>
                    <div className="rbc-toolbar">
                      <span className="rbc-btn-group">
                        <button 
                          type="button" 
                          onClick={() => setCurrentDate(new Date())}
                          className="rbc-btn"
                        >
                          Heute
                        </button>
                        <button 
                          type="button" 
                          onClick={() => {
                            const newDate = new Date(currentDate);
                            newDate.setMonth(newDate.getMonth() - 1);
                            setCurrentDate(newDate);
                          }}
                          className="rbc-btn"
                        >
                          ‹
                        </button>
                        <button 
                          type="button" 
                          onClick={() => {
                            const newDate = new Date(currentDate);
                            newDate.setMonth(newDate.getMonth() + 1);
                            setCurrentDate(newDate);
                          }}
                          className="rbc-btn"
                        >
                          ›
                        </button>
                      </span>
                      <span className="rbc-toolbar-label">
                        {format(currentDate, 'MMMM yyyy', { locale: de })}
                      </span>
                      <span className="rbc-btn-group">
                        <button 
                          type="button" 
                          onClick={() => setCurrentView(Views.MONTH)}
                          className="rbc-btn"
                        >
                          Monat
                        </button>
                        <button 
                          type="button" 
                          onClick={() => setCurrentView(Views.WEEK)}
                          className="rbc-btn"
                        >
                          Woche
                        </button>
                        <button 
                          type="button" 
                          onClick={() => setCurrentView(Views.DAY)}
                          className="rbc-btn"
                        >
                          Tag
                        </button>
                        <button 
                          type="button" 
                          className="rbc-btn rbc-active"
                        >
                          Agenda
                        </button>
                      </span>
                    </div>
                  </div>
                  {/* Modern Agenda Component */}
                  <div style={{ height: '650px', overflowY: 'auto' }} className="bg-gray-50 rounded-lg">
                    <ModernAgenda />
                  </div>
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
            </>
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
