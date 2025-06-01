import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Share, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface ShareTripDialogProps {
  tripId: number;
  tripName: string;
  isAlreadyShared?: boolean;
  existingDescription?: string;
  publicSlug?: string;
}

export default function ShareTripDialog({ 
  tripId, 
  tripName, 
  isAlreadyShared, 
  existingDescription,
  publicSlug 
}: ShareTripDialogProps) {
  const [open, setOpen] = useState(false);
  const [description, setDescription] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Set initial description when dialog opens
  useEffect(() => {
    if (open && existingDescription) {
      setDescription(existingDescription);
    }
  }, [open, existingDescription]);

  const shareTripMutation = useMutation({
    mutationFn: async (description: string) => {
      const response = await apiRequest("POST", `/api/trips/${tripId}/share`, {
        description: description.trim()
      });
      return response.json();
    },
    onSuccess: (data) => {
      // Update the trip cache to reflect the shared status
      queryClient.invalidateQueries({ queryKey: ["/api/trips", tripId.toString()] });
      queryClient.invalidateQueries({ queryKey: ["/api/public/trips"] });
      
      setOpen(false);
      setDescription("");
      
      toast({
        title: "Reise geteilt!",
        description: "Deine Reise ist jetzt in der Community sichtbar und kann von anderen Reisenden entdeckt werden.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Fehler beim Teilen",
        description: error.message || "Die Reise konnte nicht geteilt werden.",
        variant: "destructive",
      });
    },
  });

  const handleShare = () => {
    if (!description.trim()) {
      toast({
        title: "Beschreibung erforderlich",
        description: "Bitte beschreibe deine Reise, damit andere sie besser verstehen können.",
        variant: "destructive",
      });
      return;
    }

    shareTripMutation.mutate(description);
  };

  const handleViewPublic = () => {
    if (publicSlug) {
      window.open(`/community/${publicSlug}`, '_blank');
    }
  };

  if (isAlreadyShared) {
    return (
      <div className="flex space-x-2">
        <Button variant="outline" disabled>
          <Share className="h-4 w-4 mr-2" />
          Bereits geteilt
        </Button>
        {publicSlug && (
          <Button variant="outline" onClick={handleViewPublic}>
            <ExternalLink className="h-4 w-4 mr-2" />
            Öffentlich ansehen
          </Button>
        )}
      </div>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Share className="h-4 w-4 mr-2" />
          Mit Community teilen
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Reise mit der Community teilen</DialogTitle>
          <DialogDescription>
            Teile "{tripName}" mit anderen Reisenden! Deine Reise wird öffentlich sichtbar und kann von anderen als Inspiration genutzt werden.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="description">
              Beschreibung deiner Reise *
            </Label>
            <Textarea
              id="description"
              placeholder="Beschreibe deine Reise... Was macht sie besonders? Welche Highlights erwarten andere Reisende? Teile deine Erfahrungen und Tipps!"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="resize-none"
            />
            <p className="text-sm text-muted-foreground">
              Eine gute Beschreibung hilft anderen Reisenden, deine Reise zu verstehen und sich inspirieren zu lassen.
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Abbrechen
          </Button>
          <Button 
            onClick={handleShare}
            disabled={shareTripMutation.isPending || !description.trim()}
          >
            {shareTripMutation.isPending ? "Wird geteilt..." : "Jetzt teilen"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 