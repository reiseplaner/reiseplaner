import { useState } from "react";
import { useParams } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import Navigation from "@/components/Navigation";
import {
  Heart,
  MessageCircle,
  MapPin,
  Calendar,
  Users,
  Euro,
  Clock,
  ArrowLeft,
  Send,
  Trash2,
} from "lucide-react";
import type { PublicTripWithDetails } from "@shared/schema";
import Footer from "@/components/Footer";

export default function PublicTripDetail() {
  const { slug } = useParams();
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newComment, setNewComment] = useState("");

  // Fetch trip with community features
  const { data: trip, isLoading } = useQuery({
    queryKey: ["/api/public/trips", slug, "community"],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/public/trips/${slug}/community`);
      return response.json() as Promise<PublicTripWithDetails>;
    },
    enabled: !!slug,
  });

  // Upvote mutation
  const upvoteMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/public/trips/${slug}/upvote`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/public/trips", slug, "community"] });
    },
    onError: (error: any) => {
      toast({
        title: "Fehler",
        description: error.message || "Upvote konnte nicht verarbeitet werden.",
        variant: "destructive",
      });
    },
  });

  // Comment mutation
  const commentMutation = useMutation({
    mutationFn: async (content: string) => {
      const response = await apiRequest("POST", `/api/public/trips/${slug}/comments`, {
        content,
      });
      return response.json();
    },
    onSuccess: () => {
      setNewComment("");
      queryClient.invalidateQueries({ queryKey: ["/api/public/trips", slug, "community"] });
      toast({
        title: "Kommentar hinzugefügt",
        description: "Dein Kommentar wurde erfolgreich hinzugefügt.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Fehler",
        description: error.message || "Kommentar konnte nicht hinzugefügt werden.",
        variant: "destructive",
      });
    },
  });

  // Delete comment mutation
  const deleteCommentMutation = useMutation({
    mutationFn: async (commentId: number) => {
      const response = await apiRequest("DELETE", `/api/comments/${commentId}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/public/trips", slug, "community"] });
      toast({
        title: "Kommentar gelöscht",
        description: "Der Kommentar wurde erfolgreich gelöscht.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Fehler",
        description: error.message || "Kommentar konnte nicht gelöscht werden.",
        variant: "destructive",
      });
    },
  });

  const handleUpvote = () => {
    if (!isAuthenticated) {
      toast({
        title: "Anmeldung erforderlich",
        description: "Du musst angemeldet sein, um Reisen zu bewerten.",
        variant: "destructive",
      });
      return;
    }
    upvoteMutation.mutate();
  };

  const handleAddComment = () => {
    if (!isAuthenticated) {
      toast({
        title: "Anmeldung erforderlich",
        description: "Du musst angemeldet sein, um Kommentare zu schreiben.",
        variant: "destructive",
      });
      return;
    }

    if (!newComment.trim()) {
      toast({
        title: "Kommentar erforderlich",
        description: "Bitte schreibe einen Kommentar.",
        variant: "destructive",
      });
      return;
    }

    commentMutation.mutate(newComment);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Nicht angegeben";
    return new Date(dateString).toLocaleDateString("de-DE");
  };

  const formatTime = (timeString: string | null) => {
    if (!timeString) return "";
    return timeString;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navigation />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-slate-200 rounded w-1/3 mb-4"></div>
            <div className="h-4 bg-slate-200 rounded w-2/3 mb-8"></div>
            <div className="space-y-4">
              <div className="h-32 bg-slate-200 rounded"></div>
              <div className="h-32 bg-slate-200 rounded"></div>
              <div className="h-32 bg-slate-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navigation />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card>
            <CardContent className="py-12 text-center">
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                Reiseplan nicht gefunden
              </h3>
              <p className="text-slate-600">
                Der angeforderte Reiseplan existiert nicht oder ist nicht öffentlich verfügbar.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navigation />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.history.back()}
            className="mr-4"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-slate-900">{trip.name}</h1>
            {trip.description && (
              <p className="text-slate-600 mt-2">{trip.description}</p>
            )}
          </div>
        </div>

        {/* Trip Info */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="flex items-center">
                <MapPin className="h-5 w-5 text-slate-400 mr-2" />
                <span className="text-sm text-slate-600">{trip.destination || "Unbekannt"}</span>
              </div>
              <div className="flex items-center">
                <Calendar className="h-5 w-5 text-slate-400 mr-2" />
                <span className="text-sm text-slate-600">
                  {formatDate(trip.startDate)} - {formatDate(trip.endDate)}
                </span>
              </div>
              <div className="flex items-center">
                <Users className="h-5 w-5 text-slate-400 mr-2" />
                <span className="text-sm text-slate-600">{trip.travelers} Personen</span>
              </div>
              {trip.totalBudget && (
                <div className="flex items-center">
                  <Euro className="h-5 w-5 text-slate-400 mr-2" />
                  <span className="text-sm text-slate-600">
                    €{parseFloat(trip.totalBudget).toLocaleString()}
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Community Actions */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Button
                  variant={trip.isUpvotedByUser ? "default" : "outline"}
                  size="sm"
                  onClick={handleUpvote}
                  disabled={upvoteMutation.isPending}
                  className="flex items-center"
                >
                  <Heart className={`h-4 w-4 mr-2 ${trip.isUpvotedByUser ? "fill-current" : ""}`} />
                  {trip.upvoteCount}
                </Button>
                <div className="flex items-center text-sm text-slate-500">
                  <MessageCircle className="h-4 w-4 mr-1" />
                  <span>{trip.comments.length} Kommentare</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Budget Overview */}
        {trip.budgetItems.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Budget</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {trip.budgetItems.map((item) => (
                  <div key={item.id} className="flex justify-between items-center">
                    <div>
                      <span className="font-medium">{item.category}</span>
                      {item.subcategory && (
                        <span className="text-slate-500 ml-2">- {item.subcategory}</span>
                      )}
                      {item.comment && (
                        <p className="text-sm text-slate-600 mt-1">{item.comment}</p>
                      )}
                    </div>
                    <span className="font-semibold">
                      €{parseFloat(item.totalPrice || "0").toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Activities */}
        {trip.activities.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Aktivitäten</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {trip.activities.map((activity) => (
                  <div key={activity.id} className="border-l-4 border-blue-500 pl-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="font-semibold">{activity.title}</h4>
                        {activity.category && (
                          <Badge variant="secondary" className="mt-1">
                            {activity.category}
                          </Badge>
                        )}
                        {activity.location && (
                          <p className="text-sm text-slate-600 mt-1">{activity.location}</p>
                        )}
                        {activity.comment && (
                          <p className="text-sm text-slate-600 mt-1">{activity.comment}</p>
                        )}
                      </div>
                      <div className="text-right text-sm text-slate-500">
                        {activity.date && <div>{formatDate(activity.date)}</div>}
                        {(activity.timeFrom || activity.timeTo) && (
                          <div className="flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
                            {formatTime(activity.timeFrom)}
                            {activity.timeTo && ` - ${formatTime(activity.timeTo)}`}
                          </div>
                        )}
                        {activity.price && (
                          <div className="font-semibold">
                            €{parseFloat(activity.price).toLocaleString()}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Restaurants */}
        {trip.restaurants.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Restaurants</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {trip.restaurants.map((restaurant) => (
                  <div key={restaurant.id} className="border-l-4 border-green-500 pl-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="font-semibold">{restaurant.name}</h4>
                        <div className="flex items-center space-x-2 mt-1">
                          {restaurant.cuisine && (
                            <Badge variant="outline">{restaurant.cuisine}</Badge>
                          )}
                          {restaurant.priceRange && (
                            <Badge variant="secondary">{restaurant.priceRange}</Badge>
                          )}
                        </div>
                        {restaurant.address && (
                          <p className="text-sm text-slate-600 mt-1">{restaurant.address}</p>
                        )}
                        {restaurant.comment && (
                          <p className="text-sm text-slate-600 mt-1">{restaurant.comment}</p>
                        )}
                      </div>
                      <div className="text-right text-sm text-slate-500">
                        {restaurant.date && <div>{formatDate(restaurant.date)}</div>}
                        {(restaurant.timeFrom || restaurant.timeTo) && (
                          <div className="flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
                            {formatTime(restaurant.timeFrom)}
                            {restaurant.timeTo && ` - ${formatTime(restaurant.timeTo)}`}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Comments Section */}
        <Card>
          <CardHeader>
            <CardTitle>Kommentare ({trip.comments.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Add Comment */}
            {isAuthenticated && (
              <div className="mb-6">
                <Textarea
                  placeholder="Schreibe einen Kommentar..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="mb-3"
                />
                <Button
                  onClick={handleAddComment}
                  disabled={commentMutation.isPending || !newComment.trim()}
                  size="sm"
                >
                  <Send className="h-4 w-4 mr-2" />
                  Kommentar hinzufügen
                </Button>
              </div>
            )}

            {!isAuthenticated && (
              <div className="mb-6 p-4 bg-slate-100 rounded-lg">
                <p className="text-sm text-slate-600">
                  Melde dich an, um Kommentare zu schreiben und Reisen zu bewerten.
                </p>
              </div>
            )}

            <Separator className="mb-6" />

            {/* Comments List */}
            <div className="space-y-4">
              {trip.comments.length === 0 ? (
                <p className="text-slate-500 text-center py-8">
                  Noch keine Kommentare. Sei der Erste!
                </p>
              ) : (
                                  trip.comments.map((comment) => (
                    <div key={comment.id} className="flex space-x-3">
                      <Avatar className="h-8 w-8 flex-shrink-0">
                        <AvatarImage 
                          src={localStorage.getItem(`profileImage_${comment.userId}`) || ""} 
                          alt={comment.user.username || `${comment.user.firstName} ${comment.user.lastName}` || "Anonymer Benutzer"} 
                        />
                        <AvatarFallback className="bg-slate-300 text-slate-600">
                          {(comment.user.username?.[0] || comment.user.firstName?.[0] || "A").toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium text-sm">
                            {comment.user.username || `${comment.user.firstName} ${comment.user.lastName}` || "Anonymer Benutzer"}
                          </span>
                          <span className="text-xs text-slate-500">
                            {comment.createdAt ? new Date(comment.createdAt.toString()).toLocaleDateString("de-DE") : "Unbekannt"}
                          </span>
                        </div>
                        {user?.id === comment.userId && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteCommentMutation.mutate(comment.id)}
                            disabled={deleteCommentMutation.isPending}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                      <p className="text-sm text-slate-700 mt-1">{comment.content}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      <Footer />
    </div>
  );
} 