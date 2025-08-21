import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useState, useMemo, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import Navigation from "@/components/Navigation";
import { Heart, MapPin, Calendar, Users, Plane, Mountain, Building } from "lucide-react";
import type { Trip, PublicTripWithUser } from "@shared/schema";
import CopyTripDialog, { type CopyOptions } from "@/components/CopyTripDialog";
import UpgradePrompt from "@/components/UpgradePrompt";
import Footer from "@/components/Footer";

// Extended trip type with upvote count
type TripWithUpvotes = PublicTripWithUser & { 
  upvoteCount: number;
};

export default function Community() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  // Filter states
  const [destinationFilter, setDestinationFilter] = useState("all");
  const [durationFilter, setDurationFilter] = useState("all");
  const [budgetFilter, setBudgetFilter] = useState("all");
  const [sortFilter, setSortFilter] = useState("newest");

  // Copy dialog state
  const [copyDialogOpen, setCopyDialogOpen] = useState(false);
  const [tripToCopy, setTripToCopy] = useState<TripWithUpvotes | null>(null);

  // Upgrade prompt state
  const [upgradePromptOpen, setUpgradePromptOpen] = useState(false);
  const [limitInfo, setLimitInfo] = useState<{
    currentPlan: 'free' | 'pro' | 'veteran';
    tripsUsed: number;
    tripsLimit: number;
  } | null>(null);

  const { data: publicTrips = [], isLoading } = useQuery({
    queryKey: ["/api/public/trips"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/public/trips");
      const data = await response.json() as TripWithUpvotes[];
      return data;
    },
  });

  const copyTripMutation = useMutation({
    mutationFn: async ({ trip, options }: { trip: TripWithUpvotes; options: CopyOptions }) => {
      console.log("🔍 Copying trip:", trip, "with options:", options);
      
      // Create the new trip
      const response = await apiRequest("POST", "/api/trips", {
        name: `${trip.name} (Kopie)`,
        departure: trip.departure,
        destination: trip.destination,
        startDate: trip.startDate,
        endDate: trip.endDate,
        travelers: trip.travelers,
        totalBudget: trip.totalBudget,
        description: trip.description,
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const newTrip = await response.json();
      console.log("🔍 Created new trip:", newTrip);
      
      // Copy selected components
      const copyPromises = [];
      
      // Copy budget items if selected
      if (options.copyBudgetItems && trip.budgetItems && trip.budgetItems.length > 0) {
        console.log("🔍 Copying budget items:", trip.budgetItems.length);
        
        const budgetPromises = trip.budgetItems.map(async (budgetItem) => {
          const budgetResponse = await apiRequest("POST", `/api/trips/${newTrip.id}/budget-items`, {
            category: budgetItem.category,
            subcategory: budgetItem.subcategory,
            quantity: budgetItem.quantity || 1,
            unitPrice: budgetItem.unitPrice,
            totalPrice: budgetItem.totalPrice,
            comment: budgetItem.comment,
            affiliateLink: budgetItem.affiliateLink,
          });
          
          if (!budgetResponse.ok) {
            console.error("🔴 Failed to copy budget item:", budgetItem);
          }
        });
        
        copyPromises.push(...budgetPromises);
      }
      
      // Copy activities if selected
      if (options.copyActivities && trip.activities && trip.activities.length > 0) {
        console.log("🔍 Copying activities:", trip.activities.length);
        
        const activityPromises = trip.activities.map(async (activity) => {
          const activityResponse = await apiRequest("POST", `/api/trips/${newTrip.id}/activities`, {
            title: activity.title,
            category: activity.category,
            location: activity.location,
            date: activity.date,
            timeFrom: activity.timeFrom,
            timeTo: activity.timeTo,
            price: activity.price,
            comment: activity.comment,
            bookingLink: activity.bookingLink,
            status: activity.status,
          });
          
          if (!activityResponse.ok) {
            console.error("🔴 Failed to copy activity:", activity);
          }
        });
        
        copyPromises.push(...activityPromises);
      }
      
      // Copy restaurants if selected
      if (options.copyRestaurants && trip.restaurants && trip.restaurants.length > 0) {
        console.log("🔍 Copying restaurants:", trip.restaurants.length);
        
        const restaurantPromises = trip.restaurants.map(async (restaurant) => {
          const restaurantResponse = await apiRequest("POST", `/api/trips/${newTrip.id}/restaurants`, {
            name: restaurant.name,
            address: restaurant.address,
            date: restaurant.date,
            timeFrom: restaurant.timeFrom,
            timeTo: restaurant.timeTo,
            cuisine: restaurant.cuisine,
            priceRange: restaurant.priceRange,
            reservationLink: restaurant.reservationLink,
            status: restaurant.status,
            comment: restaurant.comment,
          });
          
          if (!restaurantResponse.ok) {
            console.error("🔴 Failed to copy restaurant:", restaurant);
          }
        });
        
        copyPromises.push(...restaurantPromises);
      }
      
      // Wait for all copy operations to complete
      await Promise.all(copyPromises);
      
      console.log("🟢 All selected items copied successfully");
      return newTrip;
    },
    onSuccess: (newTrip) => {
      queryClient.invalidateQueries({ queryKey: ["/api/trips"] });
      setCopyDialogOpen(false);
      setTripToCopy(null);
      setLocation(`/trip-planning/${newTrip.id}`);
      toast({
        title: "Reise kopiert",
        description: "Die Reise wurde erfolgreich zu deinem Account hinzugefügt.",
      });
    },
    onError: (error) => {
      console.error("🔴 Copy trip error:", error);
      
      // Check if it's a plan limit error
      if (error.message && error.message.includes('403:')) {
        try {
          const errorData = JSON.parse(error.message.split('403: ')[1]);
          if (errorData.limitReached && errorData.upgradeRequired) {
            // Show upgrade prompt instead of generic error
            setLimitInfo({
              currentPlan: errorData.currentPlan || 'free',
              tripsUsed: 2, // Default values based on error message
              tripsLimit: 2
            });
            setUpgradePromptOpen(true);
            setCopyDialogOpen(false);
            return;
          }
        } catch (parseError) {
          console.error("🔴 Failed to parse error data:", parseError);
        }
      }
      
      // Also check for the specific German error message
      if (error.message && error.message.includes('Sie haben das Limit von 1 Reise für den FREE Plan erreicht')) {
        setLimitInfo({
          currentPlan: 'free',
          tripsUsed: 1,
          tripsLimit: 1
        });
        setUpgradePromptOpen(true);
        setCopyDialogOpen(false);
        return;
      }
      
      // Generic error handling
      toast({
        title: "Fehler",
        description: "Die Reise konnte nicht kopiert werden.",
        variant: "destructive",
      });
    },
  });

  const handleCopyClick = (trip: TripWithUpvotes) => {
    setTripToCopy(trip);
    setCopyDialogOpen(true);
  };

  const handleCopyConfirm = (options: CopyOptions) => {
    if (tripToCopy) {
      copyTripMutation.mutate({ trip: tripToCopy, options });
    }
  };

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
    if (!budgetItems || budgetItems.length === 0) {
      return 0;
    }
    
    return budgetItems.reduce((sum, item) => {
      const amount = parseFloat(item.totalPrice || "0");
      return sum + amount;
    }, 0);
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

  // Helper function to get profile image for a user
  const getUserProfileImage = (userId: string): string => {
    // Try to get from localStorage first
    const cachedUrl = localStorage.getItem(`profileImage_${userId}`);
    if (cachedUrl) {
      console.log('💾 Community: Using cached profile image for user', userId, ':', cachedUrl);
      return cachedUrl.startsWith('http') ? cachedUrl : `${window.location.origin}${cachedUrl}`;
    }
    return "";
  };

  // Helper function to get user initials
  const getUserInitials = (user: any): string => {
    return (user?.username?.[0] || user?.firstName?.[0] || "A").toUpperCase();
  };

  // Listen for profile image updates and refresh the page
  useEffect(() => {
    const handleProfileImageUpdate = (e: CustomEvent) => {
      console.log('💾 Community: Detected profile image update, refreshing trips');
      // Invalidate the trips query to refresh the data
      queryClient.invalidateQueries({ queryKey: ["/api/trips/public"] });
    };

    window.addEventListener('profileImageUpdated', handleProfileImageUpdate as EventListener);
    return () => window.removeEventListener('profileImageUpdated', handleProfileImageUpdate as EventListener);
  }, [queryClient]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navigation />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 text-center">
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
                              {trip.budgetItems && trip.budgetItems.length > 0 && (
                                <span className="text-xs text-slate-500">
                                  Verplant: €{getPlannedBudget(trip.budgetItems).toLocaleString()}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Author und Action */}
                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                      <div className="flex items-center">
                        <Avatar className="h-8 w-8 mr-2">
                          <AvatarImage 
                            src={getUserProfileImage(trip.user?.id || '')} 
                            alt={`${trip.user?.firstName} ${trip.user?.lastName}`}
                            onError={() => {
                              console.log('🔴 Community: Profilbild konnte nicht geladen werden für User:', trip.user?.id);
                            }}
                            onLoad={() => {
                              console.log('✅ Community: Profilbild erfolgreich geladen für User:', trip.user?.id);
                            }}
                          />
                          <AvatarFallback className="text-xs bg-gradient-to-br from-purple-400 to-blue-500 text-white">
                            {getUserInitials(trip.user)}
                          </AvatarFallback>
                        </Avatar>
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
                          handleCopyClick(trip);
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

      {/* Copy Trip Dialog */}
      {tripToCopy && (
        <CopyTripDialog
          isOpen={copyDialogOpen}
          onClose={() => {
            setCopyDialogOpen(false);
            setTripToCopy(null);
          }}
          onConfirm={handleCopyConfirm}
          trip={tripToCopy}
          isLoading={copyTripMutation.isPending}
        />
      )}

      {/* Upgrade Prompt */}
      {limitInfo && (
        <UpgradePrompt
          isOpen={upgradePromptOpen}
          onClose={() => {
            setUpgradePromptOpen(false);
            setLimitInfo(null);
          }}
          currentPlan={limitInfo.currentPlan}
          tripsUsed={limitInfo.tripsUsed}
          tripsLimit={limitInfo.tripsLimit}
        />
      )}

      <Footer />
    </div>
  );
}
