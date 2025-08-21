import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Edit, Trash2, ExternalLink, Check, X, Plane } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { apiRequest } from "@/lib/queryClient";
import { insertBudgetItemSchema, type TripWithDetails, type BudgetItem } from "@shared/schema";
import { z } from "zod";
import { supabase } from "@/lib/supabase";
import FlightSearchResults from "./FlightSearchResults";

interface BudgetOverviewProps {
  trip: TripWithDetails;
}

const budgetItemFormSchema = insertBudgetItemSchema.extend({
  unitPrice: z.string().min(1, "Preis ist erforderlich"),
  totalPrice: z.string().optional(),
});

// Helper function to safely parse float values
const safeParseFloat = (value: string | undefined | null): number => {
  if (!value || value.trim() === '') return 0;
  const parsed = parseFloat(value);
  return isNaN(parsed) ? 0 : parsed;
};

// Subcategory options for each main category
const subcategoryOptions = {
  "Transport": [
    "Flug",
    "Bahn", 
    "Mietwagen",
    "Öffentliche Verkehrsmittel",
    "Taxi / Uber / Grab",
    "Fähre / Boot",
    "Fahrrad / Roller",
    "Parkgebühren",
    "Sonstiges"
  ],
  "Hotel": [
    "Hotel",
    "Hostel",
    "Airbnb / Ferienwohnung",
    "Campingplatz",
    "Resort",
    "Homestay / Gastfamilie",
    "Übernachtung im Zug / Bus",
    "Sonstiges"
  ],
  "Verpflegung": [
    "Frühstück",
    "Mittagessen",
    "Abendessen",
    "Snacks / Streetfood",
    "Supermarkt / Selbstverpflegung",
    "Getränke / Bars / Alkohol",
    "Sonstiges"
  ],
  "Aktivitäten": [
    "Stadtführung",
    "Sehenswürdigkeiten",
    "Outdoor-Abenteuer (z. B. Tauchen, Wandern)",
    "Museen / Kultur",
    "Touren (Tagesausflüge, Mehrtagestouren)",
    "Sport (z. B. Surfen, Skifahren, Fitnessstudio)",
    "Veranstaltungen / Konzerte",
    "Wellness / Spa / Massage",
    "Kurs / Workshop (z. B. Kochkurs)",
    "Freizeitpark / Zoo",
    "Sonstiges"
  ],
  "Versicherung": [
    "Reisekrankenversicherung",
    "Reiserücktrittsversicherung",
    "Gepäckversicherung",
    "Mietwagenversicherung",
    "Auslandshaftpflicht",
    "Sonstiges"
  ],
  "Sonstiges": [
    "Souvenirs / Geschenke",
    "SIM-Karte / Internet",
    "Gebühren (Visum, Einreise, Wechselkurs)",
    "Trinkgelder",
    "Reinigung / Wäsche",
    "Apps / digitale Dienste",
    "Notfallreserven",
    "Sonstiges"
  ]
};

// Mapping für die exakten Tailwind-Klassen für die Farbkreise
const categoryDotClasses = {
  "Transport": "bg-blue-500",
  "Hotel": "bg-purple-500",
  "Verpflegung": "bg-green-500",
  "Aktivitäten": "bg-yellow-500",
  "Versicherung": "bg-red-500",
  "Sonstiges": "bg-slate-500"
} as const;

export default function BudgetOverview({ trip }: BudgetOverviewProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [addingToCategory, setAddingToCategory] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<BudgetItem | null>(null);
  const [flightSearchResults, setFlightSearchResults] = useState<any>(null);
  const [isSearchingFlights, setIsSearchingFlights] = useState(false);

  const form = useForm<z.infer<typeof budgetItemFormSchema>>({
    resolver: zodResolver(budgetItemFormSchema),
    defaultValues: {
      category: "",
      subcategory: "",
      quantity: 1,
      unitPrice: "",
      comment: "",
      affiliateLink: "",
    },
  });

  console.log("🔄 BudgetOverview re-rendered mit trip:", trip);
  console.log("🔄 Trip ID:", trip.id, "Type:", typeof trip.id);
  console.log("🔄 Budget Items Anzahl:", trip.budgetItems?.length || 0);
  
  // Konvertiere trip.id zu number falls es ein string ist, oder verwende 0 als Fallback
  const tripId = trip.id ? (typeof trip.id === 'string' ? parseInt(trip.id) : trip.id) : 0;
  console.log("🔄 Converted Trip ID:", tripId, "Type:", typeof tripId);
  
  const createBudgetItemMutation = useMutation({
    mutationFn: async (data: z.infer<typeof budgetItemFormSchema>) => {
      console.log("🔵 createBudgetItemMutation.mutationFn gestartet");
      console.log("🔵 Mutation gestartet mit Form-Daten:", data);
      
      // Überprüfe Supabase-Session vor API-Aufruf
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.error("🔴 Keine Supabase-Session gefunden!");
        throw new Error("Sie sind nicht angemeldet. Bitte laden Sie die Seite neu und melden Sie sich erneut an.");
      }
      
      const unitPrice = safeParseFloat(data.unitPrice);
      const totalPrice = unitPrice * (data.quantity || 1);
      
      // Clean up the data before sending
      const cleanData = {
        tripId: tripId,
        category: data.category?.trim(),
        subcategory: data.subcategory?.trim() || null,
        quantity: data.quantity || 1,
        unitPrice: unitPrice.toString(),
        totalPrice: totalPrice.toString(),
        comment: data.comment?.trim() || null,
        affiliateLink: data.affiliateLink?.trim() || null,
      };
      
      console.log("🔵 Daten, die gespeichert werden:", cleanData);
      console.log("🔵 API-URL:", `/api/trips/${tripId}/budget-items`);
      console.log("🔵 Trip ID für API-Call:", tripId, "Type:", typeof tripId);
      
      if (tripId === 0) {
        throw new Error("Trip ID ist 0 - kann nicht speichern");
      }
      
      const response = await apiRequest("POST", `/api/trips/${tripId}/budget-items`, cleanData);
      const result = await response.json();
      
      console.log("🔵 Backend-Antwort (newBudgetItem):", result);
      
      return result;
    },
    onSuccess: (newBudgetItem) => {
      console.log("🟢 onSuccess aufgerufen mit:", newBudgetItem);
      
      // Update the cache directly with the new budget item
      queryClient.setQueryData(["/api/trips", tripId.toString()], (oldData: any) => {
        if (!oldData) return oldData;
        
        console.log("🟢 Aktualisiere Cache direkt. Alte Daten:", oldData);
        
        // Handle both array and object structures
        let actualTrip;
        if (Array.isArray(oldData)) {
          actualTrip = oldData[0];
        } else if (oldData["0"]) {
          // Handle the weird structure with "0" key
          actualTrip = oldData["0"];
        } else {
          actualTrip = oldData;
        }
        
        console.log("🟢 Actual trip data:", actualTrip);
        console.log("🟢 Alte budgetItems:", oldData.budgetItems?.length || 0);
        
        const updatedTrip = {
          ...actualTrip,
          budgetItems: [...(oldData.budgetItems || []), newBudgetItem],
          activities: oldData.activities || [],
          restaurants: oldData.restaurants || []
        };
        
        console.log("🟢 Neue budgetItems nach Update:", updatedTrip.budgetItems.length);
        return updatedTrip;
      });
      
      console.log("🟢 Cache direkt aktualisiert (ohne Invalidierung), setze UI zurück");
      setAddingToCategory(null);
      form.reset();
      
      toast({
        title: "Budget-Eintrag erstellt",
        description: "Der Budget-Eintrag wurde erfolgreich hinzugefügt.",
      });
    },
    onError: (error) => {
      console.error("🔴 Error creating budget item:", error);
      
      let errorMessage = "Der Budget-Eintrag konnte nicht erstellt werden.";
      
      if (error.message.includes("nicht angemeldet")) {
        errorMessage = "Sie sind nicht angemeldet. Bitte laden Sie die Seite neu.";
      } else if (error.message.includes("401")) {
        errorMessage = "Ihre Sitzung ist abgelaufen. Bitte laden Sie die Seite neu.";
      } else if (error.message.includes("403")) {
        errorMessage = "Sie haben keine Berechtigung für diese Aktion.";
      } else if (error.message.includes("404")) {
        errorMessage = "Die Reise wurde nicht gefunden.";
      }
      
      toast({
        title: "Fehler",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const updateBudgetItemMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: z.infer<typeof budgetItemFormSchema> }) => {
      console.log("🔵 Update Budget Item Mutation gestartet mit:", { id, data });
      
      const unitPrice = safeParseFloat(data.unitPrice);
      const totalPrice = unitPrice * (data.quantity || 1);
      
      // Clean up the data before sending
      const cleanData = {
        category: data.category?.trim(),
        subcategory: data.subcategory?.trim() || null,
        quantity: data.quantity || 1,
        unitPrice: unitPrice.toString(),
        totalPrice: totalPrice.toString(),
        comment: data.comment?.trim() || null,
        affiliateLink: data.affiliateLink?.trim() || null,
      };
      
      console.log("🔵 Update-Daten, die gespeichert werden:", cleanData);
      
      const response = await apiRequest("PUT", `/api/budget-items/${id}`, cleanData);
      const result = await response.json();
      
      console.log("🔵 Backend-Antwort (updatedBudgetItem):", result);
      
      return result;
    },
    onSuccess: (updatedBudgetItem) => {
      console.log("🟢 Update onSuccess aufgerufen mit:", updatedBudgetItem);
      
      // Update the cache directly with the updated budget item
      queryClient.setQueryData(["/api/trips", tripId.toString()], (oldData: any) => {
        if (!oldData) return oldData;
        
        // Handle both array and object structures
        let actualTrip;
        if (Array.isArray(oldData)) {
          actualTrip = oldData[0];
        } else if (oldData["0"]) {
          actualTrip = oldData["0"];
        } else {
          actualTrip = oldData;
        }
        
        const updatedTrip = {
          ...actualTrip,
          budgetItems: oldData.budgetItems?.map((item: BudgetItem) => 
            item.id === updatedBudgetItem.id ? updatedBudgetItem : item
          ) || [],
          activities: oldData.activities || [],
          restaurants: oldData.restaurants || []
        };
        
        console.log("🟢 Budget Item aktualisiert im Cache");
        return updatedTrip;
      });
      
      setEditingItem(null);
      form.reset();
      
      toast({
        title: "Budget-Eintrag aktualisiert",
        description: "Der Budget-Eintrag wurde erfolgreich aktualisiert.",
      });
    },
    onError: (error) => {
      console.error("🔴 Error updating budget item:", error);
      toast({
        title: "Fehler",
        description: "Der Budget-Eintrag konnte nicht aktualisiert werden.",
        variant: "destructive",
      });
    },
  });

  const deleteBudgetItemMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/budget-items/${id}`);
      return id;
    },
    onSuccess: (deletedId) => {
      // Update the cache directly by removing the deleted item
      queryClient.setQueryData(["/api/trips", tripId.toString()], (oldData: any) => {
        if (!oldData) return oldData;
        
        // Handle both array and object structures
        let actualTrip;
        if (Array.isArray(oldData)) {
          actualTrip = oldData[0];
        } else if (oldData["0"]) {
          actualTrip = oldData["0"];
        } else {
          actualTrip = oldData;
        }
        
        const updatedTrip = {
          ...actualTrip,
          budgetItems: oldData.budgetItems?.filter((item: BudgetItem) => item.id !== deletedId) || [],
          activities: oldData.activities || [],
          restaurants: oldData.restaurants || []
        };
        
        console.log("🗑️ Budget-Item gelöscht, neue Anzahl:", updatedTrip.budgetItems.length);
        return updatedTrip;
      });
      
      toast({
        title: "Budget-Eintrag gelöscht",
        description: "Der Budget-Eintrag wurde erfolgreich gelöscht.",
      });
    },
    onError: () => {
      toast({
        title: "Fehler",
        description: "Der Budget-Eintrag konnte nicht gelöscht werden.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: z.infer<typeof budgetItemFormSchema>) => {
    console.log("🔵 onSubmit aufgerufen mit Daten:", data);
    console.log("🔵 createBudgetItemMutation.isPending:", createBudgetItemMutation.isPending);
    createBudgetItemMutation.mutate(data);
  };

  const handleAddNew = (category: string) => {
    setAddingToCategory(category);
    setEditingItem(null); // Schließe Edit-Modus falls offen
    form.reset({
      category,
      subcategory: "",
      quantity: 1,
      unitPrice: "",
      comment: "",
      affiliateLink: "",
    });
  };

  const handleCancelAdd = () => {
    setAddingToCategory(null);
    form.reset();
  };

  const handleEditItem = (item: BudgetItem) => {
    setEditingItem(item);
    setAddingToCategory(null); // Schließe Add-Modus falls offen
    
    // Fülle das Formular mit den aktuellen Werten
    form.reset({
      category: item.category,
      subcategory: item.subcategory || "",
      quantity: item.quantity || 1,
      unitPrice: item.unitPrice || "",
      comment: item.comment || "",
      affiliateLink: item.affiliateLink || "",
    });
  };

  const handleCancelEdit = () => {
    setEditingItem(null);
    form.reset();
  };

  const handleUpdateItem = () => {
    if (!editingItem) return;
    
    const formData = form.getValues();
    updateBudgetItemMutation.mutate({
      id: editingItem.id,
      data: formData
    });
  };

  const calculateBudgetSummary = () => {
    const totalBudget = safeParseFloat(trip.totalBudget);
    const plannedBudget = (trip.budgetItems || []).reduce((sum, item) => {
      return sum + safeParseFloat(item.totalPrice);
    }, 0);
    const remaining = totalBudget - plannedBudget;
    const percentage = totalBudget > 0 ? Math.round((plannedBudget / totalBudget) * 100) : 0;
    
    // Debug logs
    console.log("💰 Budget-Berechnung:");
    console.log("💰 trip.totalBudget (raw):", trip.totalBudget);
    console.log("💰 totalBudget (parsed):", totalBudget);
    console.log("💰 trip.budgetItems:", trip.budgetItems);
    console.log("💰 plannedBudget:", plannedBudget);
    console.log("💰 remaining:", remaining);
    console.log("💰 percentage:", percentage);
    
    // Calculate daily budget
    const startDate = trip.startDate ? new Date(trip.startDate) : null;
    const endDate = trip.endDate ? new Date(trip.endDate) : null;
    const days = startDate && endDate ? Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1 : 1;
    const dailyBudget = totalBudget / days;

    return {
      totalBudget,
      plannedBudget,
      remaining,
      percentage,
      dailyBudget,
      days,
    };
  };

  const summary = calculateBudgetSummary();

  // Validierung der Trip ID - zeige Fehlermeldung wenn ungültig
  if (!trip.id || tripId === 0) {
    console.error("❌ Trip ID ist ungültig:", trip.id);
    return (
      <div className="p-4 text-center text-red-600">
        <p>Fehler: Trip ID ist ungültig. Bitte laden Sie die Seite neu.</p>
      </div>
    );
  }

  const mainCategories = [
    "Transport",
    "Hotel", 
    "Verpflegung",
    "Aktivitäten",
    "Versicherung",
    "Sonstiges"
  ];

  // Group budget items by category
  const groupedBudgetItems = (trip.budgetItems || []).reduce((acc, item) => {
    const category = item.category || "Sonstiges";
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(item);
    return acc;
  }, {} as Record<string, BudgetItem[]>);

  // Calculate category totals
  const getCategoryTotal = (categoryItems: BudgetItem[]) => {
    return categoryItems.reduce((sum, item) => sum + safeParseFloat(item.totalPrice), 0);
  };

  // Summen der einzelnen Kategorien berechnen
  const categorySums = mainCategories.reduce((acc, category) => {
    acc[category] = getCategoryTotal(groupedBudgetItems[category] || []);
    return acc;
  }, {} as Record<string, number>);

  // Flight search mutation
  const searchFlightsMutation = useMutation({
    mutationFn: async (tripId: number) => {
      const response = await apiRequest("POST", `/api/trips/${tripId}/search-flights`);
      return await response.json();
    },
    onSuccess: (data) => {
      console.log("🟢 Flight search successful:", data);
      
      if (data.redirectUrl) {
        // Simple redirect to Omio
        window.open(data.redirectUrl, '_blank');
        toast({
          title: "Weiterleitung zu Omio",
          description: data.message || "Neue Seite wird geöffnet...",
        });
        setIsSearchingFlights(false);
      } else {
        // Fallback for other response types
        setFlightSearchResults(data);
        toast({
          title: "Flugsuche erfolgreich",
          description: `${data.flights?.length || 0} Flüge gefunden`,
        });
      }
    },
    onError: (error: any) => {
      console.error("🔴 Flight search error:", error);
      toast({
        title: "Flugsuche fehlgeschlagen",
        description: error.message || "Fehler beim Suchen von Flügen",
        variant: "destructive",
      });
    },
  });

  const handleSearchFlights = () => {
    setIsSearchingFlights(true);
    searchFlightsMutation.mutate(trip.id);
  };

  const handleCloseFlightResults = () => {
    setFlightSearchResults(null);
    setIsSearchingFlights(false);
  };

  // Check if there's a flight budget item in Transport category
  const hasFlightBudgetItem = trip.budgetItems?.some(item => 
    item.category === "Transport" && item.subcategory === "Flug"
  );

  return (
    <div className="space-y-6">
      {/* Budget Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Budget-Übersicht</CardTitle>
            <div className="text-right">
              <div className="text-sm text-slate-600">Gesamtbudget</div>
              <div className="text-2xl font-bold text-slate-900">
                €{summary.totalBudget.toLocaleString()}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-slate-50 rounded-lg p-4">
              <div className="text-sm text-slate-600">Verplant</div>
              <div className="text-xl font-bold text-green-600">
                €{summary.plannedBudget.toLocaleString()}
              </div>
              <div className="text-sm text-slate-500">{summary.percentage}% des Budgets</div>
            </div>
            <div className="bg-slate-50 rounded-lg p-4">
              <div className="text-sm text-slate-600">Verfügbar</div>
              <div className="text-xl font-bold text-slate-900">
                €{summary.remaining.toLocaleString()}
              </div>
              <div className="text-sm text-slate-500">
                {100 - summary.percentage}% übrig
              </div>
            </div>
            <div className="bg-slate-50 rounded-lg p-4">
              <div className="text-sm text-slate-600">Tagesbudget</div>
              <div className="text-xl font-bold text-slate-900">
                €{Math.round(summary.dailyBudget).toLocaleString()}
              </div>
              <div className="text-sm text-slate-500">{summary.days} Reisetage</div>
            </div>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-3 mt-6 flex overflow-hidden">
            {mainCategories.map((category) => {
              const value = categorySums[category];
              const percent = summary.totalBudget > 0 ? (value / summary.totalBudget) * 100 : 0;
              if (percent === 0) return null;
              return (
                <div
                  key={category}
                  className={`h-3 ${categoryDotClasses[category as keyof typeof categoryDotClasses]}`}
                  style={{ width: `${percent}%` }}
                  title={category}
                ></div>
              );
            })}
            {summary.remaining > 0 && (
              <div
                className="h-3 bg-slate-100"
                style={{ width: `${(summary.remaining / summary.totalBudget) * 100}%` }}
                title="Nicht verplant"
              ></div>
            )}
          </div>
          {/* Legende unter dem Balken */}
          <div className="flex flex-wrap gap-4 mt-2 text-xs items-center">
            {mainCategories.map((category) => (
              <div key={category} className="flex items-center gap-1">
                <span className={`inline-block w-3 h-3 rounded-full ${categoryDotClasses[category as keyof typeof categoryDotClasses]}`}></span>
                <span>{category}</span>
              </div>
            ))}
            <div className="flex items-center gap-1">
              <span className="inline-block w-3 h-3 rounded-full bg-slate-100 border border-slate-300"></span>
              <span>Nicht verplant</span>
            </div>
          </div>
          {summary.percentage > 100 && (
            <p className="text-sm text-red-600 mt-2 font-medium">
              ⚠️ Budget um €{(summary.plannedBudget - summary.totalBudget).toLocaleString()} überschritten!
            </p>
          )}
        </CardContent>
      </Card>

      {/* Budget Categories */}
      <div className="space-y-4">
        {mainCategories.map((category) => {
          const categoryItems = groupedBudgetItems[category] || [];
          const categoryTotal = getCategoryTotal(categoryItems);
          const isAddingToThisCategory = addingToCategory === category;
          
          return (
            <Card key={category}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full ${categoryDotClasses[category as keyof typeof categoryDotClasses]}`}></div>
                    <CardTitle className="text-lg">{category}</CardTitle>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-medium text-slate-600">
                      Gesamt: €{categoryTotal.toLocaleString()}
                    </span>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleAddNew(category)}
                      disabled={addingToCategory !== null || editingItem !== null}
                      className="text-xs"
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      {category} hinzufügen
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50">
                        <th className="text-left py-3 px-3 text-xs font-medium text-slate-600 uppercase tracking-wider">
                          Unterkategorie wählen
                        </th>
                        <th className="text-left py-3 px-3 text-xs font-medium text-slate-600 uppercase tracking-wider">
                          Preis
                        </th>
                        <th className="text-left py-3 px-3 text-xs font-medium text-slate-600 uppercase tracking-wider">
                          Einheit
                        </th>
                        <th className="text-left py-3 px-3 text-xs font-medium text-slate-600 uppercase tracking-wider">
                          Gesamt
                        </th>
                        <th className="text-left py-3 px-3 text-xs font-medium text-slate-600 uppercase tracking-wider">
                          Kommentar
                        </th>
                        <th className="text-left py-3 px-3 text-xs font-medium text-slate-600 uppercase tracking-wider">
                          Buchungslink
                        </th>
                        <th className="text-left py-3 px-3 text-xs font-medium text-slate-600 uppercase tracking-wider">
                          Aktionen
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {/* Existing items */}
                      {categoryItems.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50">
                          {editingItem?.id === item.id ? (
                            // Edit mode row
                            <>
                              <td className="py-3 px-3">
                                <Select 
                                  value={form.watch("subcategory") || ""} 
                                  onValueChange={(value) => form.setValue("subcategory", value)}
                                >
                                  <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Unterkategorie wählen" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {subcategoryOptions[category as keyof typeof subcategoryOptions]?.map((option) => (
                                      <SelectItem key={option} value={option}>
                                        {option}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </td>
                              <td className="py-3 px-3">
                                <Input
                                  type="text"
                                  placeholder="0.00"
                                  value={form.watch("unitPrice") || ""}
                                  onChange={(e) => form.setValue("unitPrice", e.target.value)}
                                  className="w-full"
                                />
                              </td>
                              <td className="py-3 px-3">
                                <Input
                                  type="number"
                                  value={form.watch("quantity") || 1}
                                  onChange={(e) => form.setValue("quantity", parseInt(e.target.value) || 1)}
                                  className="w-full"
                                  min="1"
                                />
                              </td>
                              <td className="py-3 px-3 text-sm font-semibold text-slate-900">
                                €{(safeParseFloat(form.watch("unitPrice")) * (form.watch("quantity") || 1)).toLocaleString()}
                              </td>
                              <td className="py-3 px-3">
                                <Input
                                  type="text"
                                  placeholder="Kommentar..."
                                  value={form.watch("comment") || ""}
                                  onChange={(e) => form.setValue("comment", e.target.value)}
                                  className="w-full"
                                />
                              </td>
                              <td className="py-3 px-3">
                                <Input
                                  type="text"
                                  placeholder="https://..."
                                  value={form.watch("affiliateLink") || ""}
                                  onChange={(e) => form.setValue("affiliateLink", e.target.value)}
                                  className="w-full"
                                />
                              </td>
                              <td className="py-3 px-3">
                                <div className="flex space-x-1">
                                  <Button 
                                    size="sm" 
                                    variant="ghost" 
                                    className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                                    onClick={handleUpdateItem}
                                    disabled={updateBudgetItemMutation.isPending}
                                  >
                                    <Check className="h-3 w-3" />
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="ghost"
                                    className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                    onClick={handleCancelEdit}
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                </div>
                              </td>
                            </>
                          ) : (
                            // Normal display mode
                            <>
                              <td className="py-3 px-3 text-sm text-slate-900 font-medium">
                                {item.subcategory?.trim() || "-"}
                              </td>
                              <td className="py-3 px-3 text-sm text-slate-600">
                                €{safeParseFloat(item.unitPrice).toLocaleString()}
                              </td>
                              <td className="py-3 px-3 text-sm text-slate-600">
                                {item.quantity}x
                              </td>
                              <td className="py-3 px-3 text-sm font-semibold text-slate-900">
                                €{safeParseFloat(item.totalPrice).toLocaleString()}
                              </td>
                              <td className="py-3 px-3 text-sm text-slate-600 max-w-xs truncate">
                                {item.comment || "-"}
                              </td>
                              <td className="py-3 px-3 text-sm">
                                {item.affiliateLink ? (
                                  <a 
                                    href={item.affiliateLink} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                                  >
                                    <ExternalLink className="h-3 w-3" />
                                    Link
                                  </a>
                                ) : (
                                  <span className="text-slate-400">-</span>
                                )}
                              </td>
                              <td className="py-3 px-3">
                                <div className="flex space-x-1">
                                  <Button 
                                    size="sm" 
                                    variant="ghost" 
                                    className="h-8 w-8 p-0"
                                    onClick={() => handleEditItem(item)}
                                    disabled={editingItem !== null || addingToCategory !== null}
                                  >
                                    <Edit className="h-3 w-3" />
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="ghost"
                                    onClick={() => deleteBudgetItemMutation.mutate(item.id)}
                                    disabled={deleteBudgetItemMutation.isPending}
                                    className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                  {/* Flight search button for flight budget items */}
                                  {item.category === "Transport" && item.subcategory === "Flug" && (
                                    <Button 
                                      size="sm" 
                                      variant="ghost"
                                      onClick={handleSearchFlights}
                                      disabled={searchFlightsMutation.isPending}
                                      className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                      title="Flüge prüfen"
                                    >
                                      <Plane className="h-3 w-3" />
                                    </Button>
                                  )}
                                </div>
                              </td>
                            </>
                          )}
                        </tr>
                      ))}
                      
                      {/* Add new item row */}
                      {isAddingToThisCategory && (
                        <tr className="bg-blue-50 border-2 border-blue-200">
                          <td className="py-3 px-3">
                            <Select 
                              value={form.watch("subcategory") || ""} 
                              onValueChange={(value) => form.setValue("subcategory", value)}
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Unterkategorie wählen" />
                              </SelectTrigger>
                              <SelectContent className="bg-white border border-slate-200 shadow-lg backdrop-blur-md bg-white/95">
                                {subcategoryOptions[category as keyof typeof subcategoryOptions]?.map((option) => (
                                  <SelectItem key={option} value={option}>
                                    {option}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </td>
                          <td className="py-3 px-3">
                            <Input
                              type="text"
                              placeholder="0.00"
                              value={form.watch("unitPrice") || ""}
                              onChange={(e) => form.setValue("unitPrice", e.target.value)}
                              className="w-full"
                            />
                          </td>
                          <td className="py-3 px-3">
                            <Input
                              type="number"
                              value={form.watch("quantity") || 1}
                              onChange={(e) => form.setValue("quantity", parseInt(e.target.value) || 1)}
                              className="w-full"
                              min="1"
                            />
                          </td>
                          <td className="py-3 px-3 text-sm font-semibold text-slate-900">
                            €{(safeParseFloat(form.watch("unitPrice")) * (form.watch("quantity") || 1)).toLocaleString()}
                          </td>
                          <td className="py-3 px-3">
                            <Input
                              type="text"
                              placeholder="Kommentar..."
                              value={form.watch("comment") || ""}
                              onChange={(e) => form.setValue("comment", e.target.value)}
                              className="w-full"
                            />
                          </td>
                          <td className="py-3 px-3">
                            <Input
                              type="text"
                              placeholder="https://..."
                              value={form.watch("affiliateLink") || ""}
                              onChange={(e) => form.setValue("affiliateLink", e.target.value)}
                              className="w-full"
                            />
                          </td>
                          <td className="py-3 px-3">
                            <div className="flex space-x-1">
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                                onClick={() => {
                                  console.log("🔵 Submit-Button geklickt");
                                  const formData = form.getValues();
                                  console.log("🔵 Form-Daten vom Button:", formData);
                                  onSubmit(formData);
                                }}
                                disabled={createBudgetItemMutation.isPending}
                              >
                                <Check className="h-3 w-3" />
                              </Button>
                              <Button 
                                size="sm" 
                                variant="ghost"
                                className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                onClick={handleCancelAdd}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      )}
                      
                      {/* Empty state */}
                      {categoryItems.length === 0 && !isAddingToThisCategory && (
                        <tr>
                          <td colSpan={7} className="py-6 text-center text-slate-500 bg-slate-50">
                            <p className="text-sm">Noch keine Einträge in dieser Kategorie.</p>
                            <p className="text-xs mt-1">Klicke auf "{category} hinzufügen" um zu beginnen.</p>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Flight Search Results Modal */}
      {flightSearchResults && (
        <FlightSearchResults
          searchCriteria={flightSearchResults.searchCriteria}
          flights={flightSearchResults.flights}
          onClose={handleCloseFlightResults}
        />
      )}

      {/* Recommendations Placeholder */}
      <Card className="border-2 border-dashed border-slate-300 bg-slate-50">
        <CardContent className="p-8 text-center">
          <div className="text-4xl mb-4">💡</div>
          <h3 className="text-lg font-semibold text-slate-600 mb-2">Unsere Empfehlungen</h3>
          <p className="text-slate-500 mb-4">
            Hier werden später personalisierte Hotel- und Flugempfehlungen angezeigt
          </p>
          <div className="flex justify-center space-x-4">
            <div className="bg-white rounded-lg p-4 border border-slate-200 opacity-60">
              <div className="text-2xl mb-2">🚗</div>
              <div className="text-sm text-slate-500">Mietwagen-Angebote</div>
            </div>
            <div className="bg-white rounded-lg p-4 border border-slate-200 opacity-60">
              <div className="text-2xl mb-2">🗺️</div>
              <div className="text-sm text-slate-500">Aktivitäten-Vorschläge</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
