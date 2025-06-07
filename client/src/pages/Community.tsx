import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import Navigation from "@/components/Navigation";
import { Heart, MapPin, Calendar, Users, Plane, Mountain, Building } from "lucide-react";
import type { Trip, PublicTripWithUser } from "@shared/schema";

// Extended trip type with upvote count
type TripWithUpvotes = PublicTripWithUser & { 
  upvoteCount: number;
};

export default function Community() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Filter states
  const [destinationFilter, setDestinationFilter] = useState("all");
  const [durationFilter, setDurationFilter] = useState("all");
  const [budgetFilter, setBudgetFilter] = useState("all");
  const [sortFilter, setSortFilter] = useState("newest");

  const { data: publicTrips = [], isLoading } = useQuery({
    queryKey: ["/api/public/trips"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/public/trips");
      const data = await response.json() as TripWithUpvotes[];
      console.log("🔍 Community: Loaded trips:", data.length);
      data.forEach((trip, index) => {
        console.log(`🔍 Trip ${index}:`, trip.name);
        console.log(`🔍 - budgetItems:`, trip.budgetItems);
        console.log(`🔍 - budgetItems length:`, trip.budgetItems?.length);
        if (trip.budgetItems && trip.budgetItems.length > 0) {
          console.log(`🔍 - first budget item:`, trip.budgetItems[0]);
        }
      });
      return data;
    },
  });

  const copyTripMutation = useMutation({
    mutationFn: async (publicTrip: TripWithUpvotes) => {
      const response = await apiRequest("POST", "/api/trips", {
        name: `${publicTrip.name} (Kopie)`,
        departure: publicTrip.departure,
        destination: publicTrip.destination,
        startDate: publicTrip.startDate,
        endDate: publicTrip.endDate,
        travelers: publicTrip.travelers,
        description: publicTrip.description,
      });
      return response.json();
    },
    onSuccess: (newTrip) => {
      queryClient.invalidateQueries({ queryKey: ["/api/trips"] });
      setLocation(`/trip-planning/${newTrip.id}`);
      toast({
        title: "Reise kopiert",
        description: "Die Reise wurde erfolgreich zu deinem Account hinzugefügt.",
      });
    },
    onError: () => {
      toast({
        title: "Fehler",
        description: "Die Reise konnte nicht kopiert werden.",
        variant: "destructive",
      });
    },
  });

  // Destination region mapping
  const getDestinationRegion = (destination: string): string => {
    const regionMap: { [key: string]: string } = {
      // EUROPA
      "LHR": "europe", "LGW": "europe", "STN": "europe", "LTN": "europe", // London
      "CDG": "europe", "ORY": "europe", // Paris
      "FRA": "europe", // Frankfurt
      "AMS": "europe", // Amsterdam
      "MAD": "europe", // Madrid
      "BCN": "europe", // Barcelona
      "FCO": "europe", "CIA": "europe", // Rom
      "MXP": "europe", "LIN": "europe", // Mailand
      "VCE": "europe", // Venedig
      "NAP": "europe", // Neapel
      "MUC": "europe", // München
      "BER": "europe", // Berlin
      "DUS": "europe", "CGN": "europe", // Düsseldorf, Köln
      "HAM": "europe", // Hamburg
      "STR": "europe", // Stuttgart
      "VIE": "europe", // Wien
      "ZUR": "europe", "BSL": "europe", "GVA": "europe", // Schweiz
      "BRU": "europe", // Brüssel
      "CPH": "europe", // Kopenhagen
      "ARN": "europe", // Stockholm
      "OSL": "europe", // Oslo
      "HEL": "europe", // Helsinki
      "WAW": "europe", // Warschau
      "PRG": "europe", // Prag
      "BUD": "europe", // Budapest
      "ATH": "europe", // Athen
      "DUB": "europe", // Dublin
      "EDI": "europe", "GLA": "europe", // Edinburgh, Glasgow
      "MAN": "europe", // Manchester
      "LIS": "europe", // Lissabon
      "OPO": "europe", // Porto
      "KEF": "europe", // Reykjavik
      "RIX": "europe", // Riga
      "TLL": "europe", // Tallinn
      "VNO": "europe", // Vilnius
      "SOF": "europe", // Sofia
      "OTP": "europe", // Bukarest
      "BEG": "europe", // Belgrad
      "ZAG": "europe", // Zagreb
      "LJU": "europe", // Ljubljana
      "SKP": "europe", // Skopje
      "TIA": "europe", // Tirana
      "SPU": "europe", "DBV": "europe", // Split, Dubrovnik

      // ASIEN
      "NRT": "asia", "HND": "asia", // Tokyo
      "ICN": "asia", // Seoul
      "PVG": "asia", "SHA": "asia", // Shanghai
      "PEK": "asia", "PKX": "asia", // Peking
      "CAN": "asia", // Guangzhou
      "SZX": "asia", // Shenzhen
      "HKG": "asia", // Hong Kong
      "TPE": "asia", // Taipei
      "SIN": "asia", // Singapur
      "BKK": "asia", "DMK": "asia", // Bangkok
      "KUL": "asia", // Kuala Lumpur
      "CGK": "asia", // Jakarta
      "DPS": "asia", // Bali
      "MNL": "asia", // Manila
      "DEL": "asia", // Delhi
      "BOM": "asia", // Mumbai
      "BLR": "asia", // Bangalore
      "MAA": "asia", // Chennai
      "CCU": "asia", // Kolkata
      "HYD": "asia", // Hyderabad
      "AMD": "asia", // Ahmedabad
      "COK": "asia", // Kochi
      "GOI": "asia", // Goa
      "KTM": "asia", // Kathmandu
      "CMB": "asia", // Colombo
      "RGN": "asia", // Yangon
      "VTE": "asia", // Vientiane
      "PNH": "asia", // Phnom Penh
      "SGN": "asia", "HAN": "asia", // Ho Chi Minh, Hanoi
      "FUK": "asia", "KIX": "asia", "NGO": "asia", // Japan
      "PUS": "asia", // Busan
      "TSN": "asia", "XIY": "asia", "CTU": "asia", // China
      "ULN": "asia", // Ulaanbaatar
      "TAS": "asia", // Taschkent
      "ALA": "asia", // Almaty
      "FRU": "asia", // Bischkek
      "DYU": "asia", // Duschanbe
      "ASB": "asia", // Aschgabat

      // AMERIKA
      "JFK": "america", "LGA": "america", "EWR": "america", // New York
      "LAX": "america", // Los Angeles
      "SFO": "america", "OAK": "america", "SJC": "america", // San Francisco Bay
      "ORD": "america", "MDW": "america", // Chicago
      "MIA": "america", "FLL": "america", // Miami, Fort Lauderdale
      "LAS": "america", // Las Vegas
      "DEN": "america", // Denver
      "SEA": "america", // Seattle
      "ATL": "america", // Atlanta
      "DFW": "america", "DAL": "america", // Dallas
      "IAH": "america", "HOU": "america", // Houston
      "PHX": "america", // Phoenix
      "CLT": "america", // Charlotte
      "MSP": "america", // Minneapolis
      "DTW": "america", // Detroit
      "BOS": "america", "PWM": "america", // Boston
      "BWI": "america", "DCA": "america", "IAD": "america", // Washington DC
      "YYZ": "america", "YYC": "america", "YVR": "america", // Kanada
      "YUL": "america", "YQB": "america", // Montreal, Quebec
      "YOW": "america", // Ottawa
      "YHZ": "america", // Halifax
      "MEX": "america", // Mexiko-Stadt
      "CUN": "america", // Cancún
      "GDL": "america", // Guadalajara
      "PVR": "america", // Puerto Vallarta
      "SJO": "america", // San José, Costa Rica
      "PTY": "america", // Panama City
      "GUA": "america", // Guatemala City
      "SAL": "america", // San Salvador
      "TGU": "america", // Tegucigalpa
      "MGA": "america", // Managua
      "HAV": "america", // Havanna
      "SXM": "america", // Sint Maarten
      "CUR": "america", // Curaçao
      "AUA": "america", // Aruba
      "GRU": "america", "CGH": "america", // São Paulo
      "GIG": "america", "SDU": "america", // Rio de Janeiro
      "BSB": "america", // Brasília
      "FOR": "america", // Fortaleza
      "REC": "america", // Recife
      "SSA": "america", // Salvador
      "POA": "america", // Porto Alegre
      "BEL": "america", // Belém
      "MAO": "america", // Manaus
      "EZE": "america", "AEP": "america", // Buenos Aires
      "SCL": "america", // Santiago
      "LIM": "america", // Lima
      "BOG": "america", // Bogotá
      "UIO": "america", // Quito
      "CCS": "america", // Caracas
      "PBM": "america", // Paramaribo
      "GEO": "america", // Georgetown
      "MVD": "america", // Montevideo
      "ASU": "america", // Asunción

      // AFRIKA
      "CAI": "africa", // Kairo
      "JNB": "africa", // Johannesburg
      "CPT": "africa", // Kapstadt
      "DUR": "africa", // Durban
      "LOS": "africa", // Lagos
      "ABV": "africa", // Abuja
      "ACC": "africa", // Accra
      "ABJ": "africa", // Abidjan
      "DKR": "africa", // Dakar
      "CAS": "africa", "RAK": "africa", // Casablanca, Marrakesch
      "TUN": "africa", // Tunis
      "ALG": "africa", // Algier
      "ADD": "africa", // Addis Abeba
      "NBO": "africa", // Nairobi
      "DAR": "africa", // Dar es Salaam
      "KGL": "africa", // Kigali
      "EBB": "africa", // Entebbe
      "LUN": "africa", // Lusaka
      "HRE": "africa", // Harare
      "WDH": "africa", // Windhoek
      "GBE": "africa", // Gaborone
      "MSU": "africa", // Maseru
      "MPM": "africa", // Maputo
      "TNR": "africa", // Antananarivo

      // OZEANIEN
      "SYD": "oceania", // Sydney
      "MEL": "oceania", // Melbourne
      "BNE": "oceania", // Brisbane
      "PER": "oceania", // Perth
      "ADL": "oceania", // Adelaide
      "CBR": "oceania", // Canberra
      "DRW": "oceania", // Darwin
      "HBA": "oceania", // Hobart
      "AKL": "oceania", // Auckland
      "WLG": "oceania", // Wellington
      "CHC": "oceania", // Christchurch
      "NAN": "oceania", // Nadi, Fidschi
      "PPT": "oceania", // Papeete, Tahiti
      "NOU": "oceania", // Nouméa
      "POM": "oceania", // Port Moresby
      "HIR": "oceania", // Honiara
      "VLI": "oceania", // Port Vila

      // NAHER OSTEN
      "DXB": "middle-east", "DWC": "middle-east", // Dubai
      "AUH": "middle-east", // Abu Dhabi
      "DOH": "middle-east", // Doha
      "KWI": "middle-east", // Kuwait
      "RUH": "middle-east", "JED": "middle-east", // Riad, Jeddah
      "BAH": "middle-east", // Bahrain
      "MCT": "middle-east", // Maskat
      "TLV": "middle-east", // Tel Aviv
      "AMM": "middle-east", // Amman
      "BEY": "middle-east", // Beirut
      "DAM": "middle-east", // Damaskus
      "BGW": "middle-east", // Bagdad
      "EBL": "middle-east", // Erbil
      "IKA": "middle-east", // Tehran
      "SHJ": "middle-east", // Sharjah
      "RKT": "middle-east", // Ras al-Khaimah
    };
    
    return regionMap[destination] || "other";
  };

  const getDestinationInfo = (destination: string) => {
    const destinationMap: { [key: string]: { icon: any } } = {
      "DPS": { icon: Mountain }, // Bali
      "NRT": { icon: Mountain }, // Japan
      "KEF": { icon: Mountain }, // Iceland
      "ATH": { icon: Building }, // Greece
      "CDG": { icon: Building }, // Paris
      "NYC": { icon: Building }, // New York
      "LON": { icon: Building }, // London
      "ROM": { icon: Building }, // Rom
      "BCN": { icon: Building }, // Barcelona
      "AMS": { icon: Building }, // Amsterdam
    };
    
    const defaultDestination = { icon: Plane };
    return destinationMap[destination || ""] || defaultDestination;
  };

  // Calculate trip duration in days
  const getTripDuration = (startDate: string, endDate: string): number => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Calculate planned budget from budget items
  const getPlannedBudget = (budgetItems: TripWithUpvotes['budgetItems']): number => {
    console.log("🔍 getPlannedBudget called with:", budgetItems);
    if (!budgetItems || budgetItems.length === 0) {
      console.log("🔍 No budget items found");
      return 0;
    }
    
    const total = budgetItems.reduce((sum, item) => {
      const amount = parseFloat(item.totalPrice || "0");
      console.log(`🔍 Budget item: ${item.category} - ${item.subcategory}: €${amount}`);
      return sum + amount;
    }, 0);
    
    console.log("🔍 Total planned budget:", total);
    return total;
  };

  // Filter and sort trips
  const filteredAndSortedTrips = useMemo(() => {
    let filtered = publicTrips.filter(trip => {
      // Destination filter
      if (destinationFilter !== "all") {
        const region = getDestinationRegion(trip.destination || "");
        if (destinationFilter !== region) return false;
      }

      // Duration filter
      if (durationFilter !== "all" && trip.startDate && trip.endDate) {
        const duration = getTripDuration(trip.startDate, trip.endDate);
        switch (durationFilter) {
          case "very-short":
            if (duration < 1 || duration > 3) return false;
            break;
          case "short":
            if (duration < 1 || duration > 7) return false;
            break;
          case "medium":
            if (duration < 7 || duration > 14) return false;
            break;
          case "long":
            if (duration <= 14) return false;
            break;
        }
      }

      // Budget filter
      if (budgetFilter !== "all" && trip.totalBudget) {
        const budget = parseFloat(trip.totalBudget);
        switch (budgetFilter) {
          case "low":
            if (budget >= 1000) return false;
            break;
          case "medium":
            if (budget < 1000 || budget > 3000) return false;
            break;
          case "medium-high":
            if (budget < 3000 || budget > 5000) return false;
            break;
          case "high":
            if (budget <= 5000) return false;
            break;
        }
      }

      return true;
    });

    // Sort trips
    switch (sortFilter) {
      case "popular":
        filtered.sort((a, b) => (b.upvoteCount || 0) - (a.upvoteCount || 0));
        break;
      case "most-comments":
        // Note: This would need comment count from the backend
        // For now, using upvote count as proxy
        filtered.sort((a, b) => (b.upvoteCount || 0) - (a.upvoteCount || 0));
        break;
      case "rating":
        // Note: This would need rating data from the backend
        // For now, using upvote count as proxy
        filtered.sort((a, b) => (b.upvoteCount || 0) - (a.upvoteCount || 0));
        break;
      case "newest":
      default:
        filtered.sort((a, b) => new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime());
        break;
    }

    return filtered;
  }, [publicTrips, destinationFilter, durationFilter, budgetFilter, sortFilter]);

  const handleTripClick = (trip: TripWithUpvotes) => {
    if (trip.publicSlug) {
      setLocation(`/community/${trip.publicSlug}`);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-slate-200 rounded w-1/3 mb-2"></div>
            <div className="h-4 bg-slate-200 rounded w-1/2 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white rounded-xl overflow-hidden">
                  <div className="h-48 bg-slate-200"></div>
                  <div className="p-6 space-y-4">
                    <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                    <div className="h-3 bg-slate-200 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Community-Reisepläne</h1>
          <p className="text-slate-600">Entdecke Inspiration von anderen Reisenden und teile deine eigenen Pläne</p>
        </div>

        {/* Filters */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Zielort</label>
                <Select value={destinationFilter} onValueChange={setDestinationFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Alle Ziele" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle Ziele</SelectItem>
                    <SelectItem value="europe">Europa</SelectItem>
                    <SelectItem value="asia">Asien</SelectItem>
                    <SelectItem value="america">Amerika</SelectItem>
                    <SelectItem value="africa">Afrika</SelectItem>
                    <SelectItem value="oceania">Ozeanien</SelectItem>
                    <SelectItem value="middle-east">Naher Osten</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Dauer</label>
                <Select value={durationFilter} onValueChange={setDurationFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Alle Dauern" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle Dauern</SelectItem>
                    <SelectItem value="very-short">1-3 Tage</SelectItem>
                    <SelectItem value="short">1-7 Tage</SelectItem>
                    <SelectItem value="medium">1-2 Wochen</SelectItem>
                    <SelectItem value="long">2+ Wochen</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Budget</label>
                <Select value={budgetFilter} onValueChange={setBudgetFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Alle Budgets" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle Budgets</SelectItem>
                    <SelectItem value="low">{'<'} €1.000</SelectItem>
                    <SelectItem value="medium">€1.000 - €3.000</SelectItem>
                    <SelectItem value="medium-high">€3.000 - €5.000</SelectItem>
                    <SelectItem value="high">{'>'} €5.000</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Sortierung</label>
                <Select value={sortFilter} onValueChange={setSortFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Neueste" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Neueste</SelectItem>
                    <SelectItem value="popular">Beliebteste</SelectItem>
                    <SelectItem value="most-comments">Meist kommentierte</SelectItem>
                    <SelectItem value="rating">Bewertung</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Community Trip Cards */}
        {filteredAndSortedTrips.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <div className="text-slate-400 mb-4">
                <Heart className="h-16 w-16 mx-auto" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                Noch keine öffentlichen Reisen
              </h3>
              <p className="text-slate-600">
                Sei der Erste und teile deine Reisepläne mit der Community!
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAndSortedTrips.map((trip) => {
              const destinationInfo = getDestinationInfo(trip.destination || "");
              const IconComponent = destinationInfo.icon;
              
              return (
                <Card 
                  key={trip.id} 
                  className="group hover:shadow-xl hover:scale-[1.02] transition-all duration-300 cursor-pointer overflow-hidden border-0 bg-white/80 backdrop-blur-sm"
                  onClick={() => handleTripClick(trip)}
                >
                  <CardContent className="p-6 relative">
                    {/* Header mit Icon und Destination */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-slate-100 rounded-lg">
                          <IconComponent className="h-6 w-6 text-gray-700" />
                        </div>
                        {trip.destination && (
                          <div className="text-gray-700 font-medium bg-slate-100 px-3 py-1 rounded-full text-sm">
                            {trip.destination}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center text-sm text-slate-500">
                        <Heart className="h-4 w-4 mr-1" />
                        <span>{trip.upvoteCount || 0}</span>
                      </div>
                    </div>

                    {/* Trip Name */}
                    <div className="mb-3">
                      <h3 className="text-xl font-bold text-gray-900 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-purple-600 group-hover:to-blue-600 group-hover:bg-clip-text transition-all duration-300">
                        {trip.name}
                      </h3>
                    </div>
                    
                    {trip.description && (
                      <p className="text-sm text-slate-600 mb-4 line-clamp-2">{trip.description}</p>
                    )}
                    
                    {/* Trip Details */}
                    <div className="grid grid-cols-1 gap-2 text-sm text-gray-600 mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="p-1.5 bg-purple-100 rounded-lg">
                          <Users className="h-4 w-4 text-purple-600" />
                        </div>
                        <span className="font-medium">{trip.travelers} Personen</span>
                      </div>
                      
                      {trip.totalBudget && (
                        <div className="space-y-2">
                          <div className="flex items-center space-x-3">
                            <div className="p-1.5 bg-emerald-100 rounded-lg">
                              <span className="text-emerald-600 font-bold text-xs">€</span>
                            </div>
                            <div className="flex flex-col">
                              <span className="font-medium text-sm">
                                Gesamtbudget: €{parseFloat(trip.totalBudget).toLocaleString()}
                              </span>
                              {(() => {
                                console.log(`🔍 Rendering trip ${trip.name}: budgetItems exist?`, !!trip.budgetItems);
                                console.log(`🔍 budgetItems length:`, trip.budgetItems?.length);
                                const plannedBudget = getPlannedBudget(trip.budgetItems);
                                console.log(`🔍 Calculated planned budget:`, plannedBudget);
                                
                                if (trip.budgetItems && trip.budgetItems.length > 0) {
                                  return (
                                    <span className="text-xs text-slate-500">
                                      Verplant: €{plannedBudget.toLocaleString()}
                                    </span>
                                  );
                                }
                                return null;
                              })()}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Author und Action */}
                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-blue-500 rounded-full mr-2 flex items-center justify-center">
                          <span className="text-white text-xs font-semibold">
                            {(trip.user?.username?.[0] || trip.user?.firstName?.[0] || "A").toUpperCase()}
                          </span>
                        </div>
                        <span className="text-sm text-slate-600">
                          {trip.user?.username || 
                           (trip.user?.firstName && trip.user?.lastName ? 
                             `${trip.user.firstName} ${trip.user.lastName}` : 
                             "Anonymer Benutzer")}
                        </span>
                      </div>
                      <Button 
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          copyTripMutation.mutate(trip);
                        }}
                        disabled={copyTripMutation.isPending}
                        className="bg-primary text-white hover:bg-primary/90"
                      >
                        Kopieren
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
