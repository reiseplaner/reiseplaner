import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { MessageCircle, Loader2 } from "lucide-react";

interface SupportDialogProps {
  children?: React.ReactNode;
}

interface SubscriptionInfo {
  status: 'free' | 'pro' | 'veteran';
}

export default function SupportDialog({ children }: SupportDialogProps) {
  const [open, setOpen] = useState(false);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [category, setCategory] = useState("");
  const { toast } = useToast();

  // Get subscription status to check if user has access
  const { data: subscriptionData } = useQuery<SubscriptionInfo>({
    queryKey: ['/api/auth/subscription'],
    queryFn: async () => {
      const response = await fetch('/api/auth/subscription', {
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error('Failed to fetch subscription');
      }
      return response.json();
    },
  });

  // Send support request mutation
  const sendSupportMutation = useMutation({
    mutationFn: async (data: { subject: string; message: string; category?: string }) => {
      const response = await fetch('/api/support', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Fehler beim Senden der Support-Anfrage');
      }

      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Support-Anfrage gesendet",
        description: data.message,
      });
      setOpen(false);
      setSubject("");
      setMessage("");
      setCategory("");
    },
    onError: (error: any) => {
      toast({
        title: "Fehler",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!subject.trim() || !message.trim()) {
      toast({
        title: "Fehler",
        description: "Bitte fülle alle Pflichtfelder aus.",
        variant: "destructive",
      });
      return;
    }

    sendSupportMutation.mutate({
      subject: subject.trim(),
      message: message.trim(),
      category: category || undefined,
    });
  };

  // Don't show support for free users
  if (!subscriptionData || subscriptionData.status === 'free') {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="outline" className="flex items-center gap-2">
            <MessageCircle className="h-4 w-4" />
            Support
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Premium Support
          </DialogTitle>
          <DialogDescription>
            Als {subscriptionData?.status === 'pro' ? 'Pro' : 'Veteran'}-Nutzer hast du Zugang zu unserem Premium Support. 
            Wir melden uns schnellstmöglich bei dir!
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="category">Kategorie (optional)</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Wähle eine Kategorie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="technical">Technisches Problem</SelectItem>
                <SelectItem value="feature">Feature-Wunsch</SelectItem>
                <SelectItem value="billing">Abrechnung</SelectItem>
                <SelectItem value="bug">Bug-Report</SelectItem>
                <SelectItem value="other">Sonstiges</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="subject">Betreff *</Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Kurze Beschreibung deines Anliegens"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Nachricht *</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Beschreibe dein Anliegen so detailliert wie möglich..."
              rows={5}
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={sendSupportMutation.isPending}
            >
              Abbrechen
            </Button>
            <Button
              type="submit"
              disabled={sendSupportMutation.isPending}
            >
              {sendSupportMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Wird gesendet...
                </>
              ) : (
                'Anfrage senden'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
} 