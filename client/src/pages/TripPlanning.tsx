import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { ArrowLeft, Save, Share, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import Navigation from "@/components/Navigation";
import BudgetOverview from "@/components/BudgetOverview";
import ActivityList from "@/components/ActivityList";
import RestaurantList from "@/components/RestaurantList";
import TripCalendar from "@/components/TripCalendar";
import { apiRequest } from "@/lib/queryClient";
import { exportTripToPDF, exportTripToCSV } from "@/lib/exportUtils";
import { insertTripSchema, type TripWithDetails } from "@shared/schema";
import { z } from "zod";

const generalDataSchema = z.object({
  name: z.string().min(1, "Reisename ist erforderlich"),
  departure: z.string().optional(),
  destination: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  travelers: z.number().min(1, "Mindestens 1 Person erforderlich"),
  totalBudget: z.string().min(1, "Gesamtbudget ist erforderlich"),
});

export default function TripPlanning() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  console.log("🔄 TripPlanning Komponente gerendert, Trip ID:", id);
  console.log("🔄 Aktuelle Zeit:", new Date().toISOString());

  const [activeTab, setActiveTab] = useState(() => {
    // Versuche den aktiven Tab aus localStorage zu laden
    const savedTab = localStorage.getItem(`trip-${id}-active-tab`);
    console.log("🔄 Lade gespeicherten Tab:", savedTab);
    return savedTab || "general";
  });
  const isInitialLoadRef = useRef(true);

  const { data: trip, isLoading } = useQuery<TripWithDetails>({
    queryKey: ["/api/trips", id],
    enabled: !!id,
  });

  const form = useForm<z.infer<typeof generalDataSchema>>({
    resolver: zodResolver(generalDataSchema),
    defaultValues: {
      name: "",
      departure: "",
      destination: "",
      startDate: "",
      endDate: "",
      travelers: 1,
      totalBudget: "",
    },
  });

  // Formular zurücksetzen, wenn sich trip ändert
  useEffect(() => {
    if (trip) {
      console.log("Resetting form with trip data:", trip);
      const formData = {
        name: trip.name ?? "",
        departure: trip.departure ?? "",
        destination: trip.destination ?? "",
        startDate: trip.startDate ?? "",
        endDate: trip.endDate ?? "",
        travelers: trip.travelers ?? 1,
        totalBudget: trip.totalBudget !== undefined && trip.totalBudget !== null ? String(trip.totalBudget) : "",
      };
      console.log("Form data to set:", formData);
      form.reset(formData);
    }
  }, [trip, form]);

  const updateTripMutation = useMutation({
    mutationFn: async (data: z.infer<typeof generalDataSchema>) => {
      // Transform form data to match API expectations
      const apiData = {
        name: data.name,
        departure: data.departure?.trim() || null,
        destination: data.destination?.trim() || null,
        startDate: data.startDate?.trim() || null,
        endDate: data.endDate?.trim() || null,
        travelers: data.travelers,
        totalBudget: data.totalBudget?.trim() ? parseFloat(data.totalBudget.trim()) : null,
      };
      
      console.log("Sending data to API:", apiData);
      const response = await apiRequest("PUT", `/api/trips/${id}`, apiData);
      return response.json();
    },
    onSuccess: (updatedTrip) => {
      console.log("Trip successfully updated:", updatedTrip);
      
      // Force cache refresh to get updated data
      queryClient.invalidateQueries({ queryKey: ["/api/trips", id] });
      
      toast({
        title: "Reise gespeichert",
        description: "Deine Änderungen wurden erfolgreich gespeichert.",
      });
    },
    onError: (error) => {
      console.error("Update trip error:", error);
      toast({
        title: "Fehler",
        description: `Die Reise konnte nicht gespeichert werden: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const handleExportPDF = () => {
    if (trip) {
      exportTripToPDF(trip);
      toast({
        title: "PDF exportiert",
        description: "Der Reiseplan wurde als PDF heruntergeladen.",
      });
    }
  };

  const handleExportCSV = () => {
    if (trip) {
      exportTripToCSV(trip);
      toast({
        title: "CSV exportiert",
        description: "Der Reiseplan wurde als CSV heruntergeladen.",
      });
    }
  };

  const onSubmit = (data: z.infer<typeof generalDataSchema>) => {
    updateTripMutation.mutate(data);
  };

  // Speichere den aktiven Tab im localStorage
  const handleTabChange = (newTab: string) => {
    console.log("🔄 Tab-Wechsel von", activeTab, "zu", newTab);
    setActiveTab(newTab);
    localStorage.setItem(`trip-${id}-active-tab`, newTab);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-slate-200 rounded w-1/3 mb-8"></div>
            <div className="h-96 bg-slate-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card>
            <CardContent className="py-12 text-center">
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Reise nicht gefunden</h2>
              <p className="text-slate-600 mb-6">Die angeforderte Reise existiert nicht oder du hast keine Berechtigung.</p>
              <Button onClick={() => setLocation("/")}>
                Zurück zum Dashboard
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation("/")}
              className="mr-4"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">{trip.name}</h1>
              <p className="text-slate-600">Reiseplanung und Budget-Management</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Button variant="outline" onClick={handleExportPDF}>
              <Download className="h-4 w-4 mr-2" />
              PDF
            </Button>
            <Button variant="outline" onClick={handleExportCSV}>
              <Download className="h-4 w-4 mr-2" />
              CSV
            </Button>
            <Button
              onClick={form.handleSubmit(onSubmit)}
              disabled={updateTripMutation.isPending}
              className="bg-primary text-white hover:bg-primary/90"
            >
              <Save className="h-4 w-4 mr-2" />
              Speichern
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="general">Allgemeine Daten</TabsTrigger>
            <TabsTrigger value="budget">Budget</TabsTrigger>
            <TabsTrigger value="activities">Aktivitäten</TabsTrigger>
            <TabsTrigger value="restaurants">Restaurants</TabsTrigger>
            <TabsTrigger value="calendar">Kalender</TabsTrigger>
          </TabsList>

          {/* General Data Tab */}
          <TabsContent value="general">
            <Card>
              <CardHeader>
                <CardTitle>Reise-Grunddaten</CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Reisename</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="travelers"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Anzahl Personen</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                {...field} 
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="departure"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Abflughafen (IATA)</FormLabel>
                            <FormControl>
                              <Input placeholder="z.B. FRA, MUC, BER" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="destination"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Zielort (IATA)</FormLabel>
                            <FormControl>
                              <Input placeholder="z.B. DPS, BKK, JFK" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="startDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Reisebeginn</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="endDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Reiseende</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="totalBudget"
                        render={({ field }) => (
                          <FormItem className="md:col-span-2">
                            <FormLabel>Gesamtbudget (€) *</FormLabel>
                            <FormControl>
                              <Input 
                                type="text" 
                                className="text-lg font-semibold"
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                            <p className="text-sm text-slate-500">
                              Dieses Budget wird für die Fortschrittsanzeige verwendet
                            </p>
                          </FormItem>
                        )}
                      />
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Budget Tab */}
          <TabsContent value="budget">
            <BudgetOverview trip={trip} />
          </TabsContent>

          {/* Activities Tab */}
          <TabsContent value="activities">
            <ActivityList trip={trip} />
          </TabsContent>

          {/* Restaurants Tab */}
          <TabsContent value="restaurants">
            <RestaurantList trip={trip} />
          </TabsContent>

          {/* Calendar Tab */}
          <TabsContent value="calendar">
            <TripCalendar trip={trip} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
