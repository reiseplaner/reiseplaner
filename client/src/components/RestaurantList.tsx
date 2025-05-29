import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Edit, Trash2, MapPin, Calendar, Clock, Utensils } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { apiRequest } from "@/lib/queryClient";
import { insertRestaurantSchema, type TripWithDetails, type Restaurant } from "@shared/schema";
import { z } from "zod";

interface RestaurantListProps {
  trip: TripWithDetails;
}

const restaurantFormSchema = insertRestaurantSchema;

export default function RestaurantList({ trip }: RestaurantListProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRestaurant, setEditingRestaurant] = useState<Restaurant | null>(null);

  const form = useForm<z.infer<typeof restaurantFormSchema>>({
    resolver: zodResolver(restaurantFormSchema),
    defaultValues: {
      name: "",
      address: "",
      date: "",
      time: "",
      cuisine: "",
      priceRange: "",
      reservationLink: "",
      status: "geplant",
      comment: "",
    },
  });

  const createRestaurantMutation = useMutation({
    mutationFn: async (data: z.infer<typeof restaurantFormSchema>) => {
      const response = await apiRequest("POST", `/api/trips/${trip.id}/restaurants`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trips", trip.id.toString()] });
      setIsDialogOpen(false);
      form.reset();
      toast({
        title: "Restaurant hinzugefügt",
        description: "Das Restaurant wurde erfolgreich hinzugefügt.",
      });
    },
    onError: () => {
      toast({
        title: "Fehler",
        description: "Das Restaurant konnte nicht hinzugefügt werden.",
        variant: "destructive",
      });
    },
  });

  const deleteRestaurantMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/restaurants/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trips", trip.id.toString()] });
      toast({
        title: "Restaurant gelöscht",
        description: "Das Restaurant wurde erfolgreich gelöscht.",
      });
    },
    onError: () => {
      toast({
        title: "Fehler",
        description: "Das Restaurant konnte nicht gelöscht werden.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: z.infer<typeof restaurantFormSchema>) => {
    createRestaurantMutation.mutate(data);
  };

  const getStatusBadge = (status: string) => {
    return status === "reserviert" 
      ? <Badge className="bg-green-500 text-white">Reserviert</Badge>
      : <Badge variant="secondary">Geplant</Badge>;
  };

  const getPriceRangeDisplay = (priceRange: string) => {
    switch (priceRange) {
      case "€": return "€ (Budget)";
      case "€€": return "€€ (Mittel)";
      case "€€€": return "€€€ (Gehoben)";
      case "€€€€": return "€€€€ (Luxus)";
      default: return priceRange;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Restaurant-Planung</CardTitle>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary text-white hover:bg-primary/90">
                <Plus className="h-4 w-4 mr-2" />
                Restaurant hinzufügen
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Restaurant hinzufügen</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Restaurantname</FormLabel>
                        <FormControl>
                          <Input placeholder="z.B. Locavore" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Adresse</FormLabel>
                        <FormControl>
                          <Input placeholder="z.B. Jl. Dewisita, Ubud" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="date"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Datum</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="time"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Uhrzeit</FormLabel>
                          <FormControl>
                            <Input type="time" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="cuisine"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Küche</FormLabel>
                          <FormControl>
                            <Input placeholder="z.B. Modern Indonesisch" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="priceRange"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Preisklasse</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Preisklasse wählen" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="€">€ (Budget)</SelectItem>
                              <SelectItem value="€€">€€ (Mittel)</SelectItem>
                              <SelectItem value="€€€">€€€ (Gehoben)</SelectItem>
                              <SelectItem value="€€€€">€€€€ (Luxus)</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="geplant">Geplant</SelectItem>
                            <SelectItem value="reserviert">Reserviert</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="comment"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Kommentar (optional)</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Zusätzliche Informationen" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="reservationLink"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Reservierungslink (optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="https://" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex justify-end space-x-2">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setIsDialogOpen(false)}
                    >
                      Abbrechen
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={createRestaurantMutation.isPending}
                      className="bg-primary text-white hover:bg-primary/90"
                    >
                      Hinzufügen
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {(trip.restaurants || []).length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            <div className="text-4xl mb-4">🍽️</div>
            <p className="mb-2">Noch keine Restaurants geplant.</p>
            <p className="text-sm">Füge dein erstes Restaurant hinzu, um zu beginnen.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {(trip.restaurants || []).map((restaurant) => (
              <Card key={restaurant.id} className="border border-slate-200">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-slate-900">{restaurant.name}</h3>
                        {getStatusBadge(restaurant.status || "geplant")}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 text-sm text-slate-600 mb-3">
                        {restaurant.address && (
                          <div className="flex items-center">
                            <MapPin className="h-4 w-4 mr-2" />
                            <span>{restaurant.address}</span>
                          </div>
                        )}
                        {restaurant.date && (
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-2" />
                            <span>{new Date(restaurant.date).toLocaleDateString("de-DE")}</span>
                          </div>
                        )}
                        {restaurant.time && (
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 mr-2" />
                            <span>{restaurant.time}</span>
                          </div>
                        )}
                        {restaurant.cuisine && (
                          <div className="flex items-center">
                            <Utensils className="h-4 w-4 mr-2" />
                            <span>{restaurant.cuisine}</span>
                          </div>
                        )}
                        {restaurant.priceRange && (
                          <div className="flex items-center">
                            <span className="font-medium">{restaurant.priceRange}</span>
                          </div>
                        )}
                      </div>
                      {restaurant.comment && (
                        <p className="text-sm text-slate-500">{restaurant.comment}</p>
                      )}
                      {restaurant.reservationLink && (
                        <a 
                          href={restaurant.reservationLink} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-sm text-primary hover:underline mt-2 inline-block"
                        >
                          Reservierungslink →
                        </a>
                      )}
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      <Button size="sm" variant="ghost">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => deleteRestaurantMutation.mutate(restaurant.id)}
                        disabled={deleteRestaurantMutation.isPending}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
