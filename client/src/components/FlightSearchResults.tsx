import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plane, Clock, ExternalLink, X } from "lucide-react";

interface FlightResult {
  id: string;
  airline: string;
  flightNumber: string;
  departure: {
    airport: string;
    time: string;
    date: string;
  };
  arrival: {
    airport: string;
    time: string;
    date: string;
  };
  duration: string;
  stops: number;
  price: {
    amount: number;
    currency: string;
  };
  bookingLink: string;
  cabinClass: string;
}

interface FlightSearchResultsProps {
  searchCriteria: {
    departure: string;
    destination: string;
    date: string;
    travelers: number;
  };
  flights: FlightResult[];
  onClose: () => void;
}

export default function FlightSearchResults({ searchCriteria, flights, onClose }: FlightSearchResultsProps) {
  const [sortBy, setSortBy] = useState<'price' | 'duration' | 'departure'>('price');

  const sortedFlights = [...flights].sort((a, b) => {
    switch (sortBy) {
      case 'price':
        return a.price.amount - b.price.amount;
      case 'duration':
        return a.duration.localeCompare(b.duration);
      case 'departure':
        return a.departure.time.localeCompare(b.departure.time);
      default:
        return 0;
    }
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-DE', {
      weekday: 'short',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Flugsuche-Ergebnisse</h2>
            <p className="text-slate-600 mt-1">
              {searchCriteria.departure} → {searchCriteria.destination} • {formatDate(searchCriteria.date)} • {searchCriteria.travelers} Person{searchCriteria.travelers > 1 ? 'en' : ''}
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="p-6">
          {/* Sort Options */}
          <div className="flex gap-2 mb-6">
            <span className="text-sm font-medium text-slate-700 self-center">Sortieren nach:</span>
            <Button
              variant={sortBy === 'price' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSortBy('price')}
            >
              Preis
            </Button>
            <Button
              variant={sortBy === 'duration' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSortBy('duration')}
            >
              Flugdauer
            </Button>
            <Button
              variant={sortBy === 'departure' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSortBy('departure')}
            >
              Abflugzeit
            </Button>
          </div>

          {/* Flight Results */}
          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            {sortedFlights.map((flight) => (
              <Card key={flight.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-6">
                      {/* Airline Info */}
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <Plane className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900">{flight.airline}</div>
                          <div className="text-sm text-slate-600">{flight.flightNumber}</div>
                        </div>
                      </div>

                      {/* Flight Details */}
                      <div className="flex items-center space-x-8">
                        <div className="text-center">
                          <div className="text-lg font-bold text-slate-900">{flight.departure.time}</div>
                          <div className="text-sm text-slate-600">{flight.departure.airport}</div>
                        </div>
                        
                        <div className="flex flex-col items-center">
                          <div className="flex items-center space-x-2 text-slate-600">
                            <Clock className="h-4 w-4" />
                            <span className="text-sm">{flight.duration}</span>
                          </div>
                          <div className="w-16 h-px bg-slate-300 my-1"></div>
                          <div className="text-xs text-slate-500">
                            {flight.stops === 0 ? 'Direktflug' : `${flight.stops} Stopp${flight.stops > 1 ? 's' : ''}`}
                          </div>
                        </div>

                        <div className="text-center">
                          <div className="text-lg font-bold text-slate-900">{flight.arrival.time}</div>
                          <div className="text-sm text-slate-600">{flight.arrival.airport}</div>
                        </div>
                      </div>
                    </div>

                    {/* Price and Booking */}
                    <div className="text-right space-y-2">
                      <div className="text-2xl font-bold text-slate-900">
                        €{flight.price.amount.toLocaleString()}
                      </div>
                      <div className="text-sm text-slate-600">{flight.cabinClass}</div>
                      <Button 
                        className="w-full"
                        onClick={() => window.open(flight.bookingLink, '_blank')}
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Bei Omio buchen
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {flights.length === 0 && (
            <div className="text-center py-12">
              <Plane className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Keine Flüge gefunden</h3>
              <p className="text-slate-600">
                Für Ihre Suchkriterien wurden keine Flüge gefunden. Versuchen Sie es mit anderen Daten oder Zielen.
              </p>
            </div>
          )}
        </div>

        <div className="border-t p-6 bg-slate-50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-slate-600">
              Preise verstehen sich pro Person. Affiliate-Links zu Omio für einfache Buchung.
            </div>
            <Button variant="outline" onClick={onClose}>
              Schließen
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
} 