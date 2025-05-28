import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Edit, Trash2, MapPin, Calendar, Clock, Euro } from "lucide-react";
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
import { insertActivitySchema, type TripWithDetails, type Activity } from "@shared/schema";
import { z } from "zod";

interface ActivityListProps {
  trip: TripWithDetails;
}

const activityFormSchema = insertActivitySchema.extend({
  price: z.string().optional(),
});

export default function ActivityList({ trip }: ActivityListProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);

  const form = useForm<z.infer<typeof activityFormSchema>>({
    resolver: zodResolver(activityFormSchema),
    defaultValues: {
      title: "",
      location: "",
      date: "",
      time: "",
      price: "",
      comment: "",
      bookingLink: "",
      status: "geplant",
    },
  });

  const createActivityMutation = useMutation({
    mutationFn: async (data: z.infer<typeof activityFormSchema>) => {
      const response = await apiRequest("POST", `/api/trips/${trip.id}/activities`, {
        ...data,
        price: data.price ? parseFloat(data.price).toString() : undefined,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trips", trip.id.toString()] });
      setIsDialogOpen(false);
      form.reset();
      toast({
        title: "Aktivität erstellt",
        description: "Die Aktivität wurde erfolgreich hinzugefügt.",
      });
    },
    onError: () => {
      toast({
        title: "Fehler",
        description: "Die Aktivität konnte nicht erstellt werden.",
        variant: "destructive",
      });
    },
  });

  const deleteActivityMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/activities/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trips", trip.id.toString()] });
      toast({
        title: "Aktivität gelöscht",
        description: "Die Aktivität wurde erfolgreich gelöscht.",
      });
    },
    onError: () => {
      toast({
        title: "Fehler",
        description: "Die Aktivität konnte nicht gelöscht werden.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: z.infer<typeof activityFormSchema>) => {
    createActivityMutation.mutate(data);
  };

  const getStatusBadge = (status: string) => {
    return status === "gebucht" 
      ? <Badge className="bg-green-500 text-white">Gebucht</Badge>
      : <Badge variant="secondary">Geplant</Badge>;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Aktivitäten planen</CardTitle>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary text-white hover:bg-primary/90">
                <Plus className="h-4 w-4 mr-2" />
                Aktivität hinzufügen
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Aktivität hinzufügen</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Titel</FormLabel>
                        <FormControl>
                          <Input placeholder="z.B. Tanah Lot Tempel Tour" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ort</FormLabel>
                        <FormControl>
                          <Input placeholder="z.B. Tanah Lot, Bali" {...field} />
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
                      name="price"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Preis (€)</FormLabel>
                          <FormControl>
                            <Input type="text" placeholder="0.00" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
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
                              <SelectItem value="gebucht">Gebucht</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
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
                    name="bookingLink"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Buchungslink (optional)</FormLabel>
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
                      disabled={createActivityMutation.isPending}
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
        {trip.activities.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            <div className="text-4xl mb-4">🎯</div>
            <p className="mb-2">Noch keine Aktivitäten geplant.</p>
            <p className="text-sm">Füge deine erste Aktivität hinzu, um zu beginnen.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {trip.activities.map((activity) => (
              <Card key={activity.id} className="border border-slate-200">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-slate-900">{activity.title}</h3>
                        {getStatusBadge(activity.status || "geplant")}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm text-slate-600 mb-3">
                        {activity.location && (
                          <div className="flex items-center">
                            <MapPin className="h-4 w-4 mr-2" />
                            <span>{activity.location}</span>
                          </div>
                        )}
                        {activity.date && (
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-2" />
                            <span>{new Date(activity.date).toLocaleDateString("de-DE")}</span>
                          </div>
                        )}
                        {activity.time && (
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 mr-2" />
                            <span>{activity.time}</span>
                          </div>
                        )}
                        {activity.price && (
                          <div className="flex items-center">
                            <Euro className="h-4 w-4 mr-2" />
                            <span>€{parseFloat(activity.price).toLocaleString()} / Person</span>
                          </div>
                        )}
                      </div>
                      {activity.comment && (
                        <p className="text-sm text-slate-500">{activity.comment}</p>
                      )}
                      {activity.bookingLink && (
                        <a 
                          href={activity.bookingLink} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-sm text-primary hover:underline mt-2 inline-block"
                        >
                          Buchungslink →
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
                        onClick={() => deleteActivityMutation.mutate(activity.id)}
                        disabled={deleteActivityMutation.isPending}
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
