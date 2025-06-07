import { MapPin, Wallet, Calendar, FileDown, Mail, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import Footer from "@/components/Footer";

export default function Landing() {
  const { signInWithGoogle, signInWithEmail, signUpWithEmail } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showAuth, setShowAuth] = useState(false);

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);
      await signInWithGoogle();
    } catch (error) {
      toast({
        title: "Anmeldung fehlgeschlagen",
        description: "Es gab ein Problem bei der Google-Anmeldung. Bitte versuche es erneut.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    try {
      setIsLoading(true);
      await signInWithEmail(email, password);
      toast({
        title: "Erfolgreich angemeldet!",
        description: "Willkommen zurück bei ReiseVeteran.",
      });
    } catch (error) {
      toast({
        title: "Anmeldung fehlgeschlagen",
        description: "E-Mail oder Passwort ist falsch. Bitte versuche es erneut.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    try {
      setIsLoading(true);
      await signUpWithEmail(email, password);
      toast({
        title: "Registrierung erfolgreich!",
        description: "Bitte prüfe deine E-Mails für die Bestätigung.",
      });
    } catch (error) {
      toast({
        title: "Registrierung fehlgeschlagen",
        description: "Es gab ein Problem bei der Registrierung. Bitte versuche es erneut.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <MapPin className="h-8 w-8 text-primary mr-3" />
              <span className="text-xl font-bold text-slate-900">ReiseVeteran</span>
            </div>
            <Button onClick={() => setShowAuth(true)} className="bg-primary text-white hover:bg-primary/90">
              Anmelden
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-600 to-purple-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold mb-6">
                Plane deine perfekte Reise mit System
              </h1>
              <p className="text-xl text-blue-100 mb-8">
                Budget verwalten, Aktivitäten planen, Restaurants finden - alles an einem Ort. 
                Mit automatischem Kalender und Export-Funktionen.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  onClick={() => setShowAuth(true)}
                  className="bg-white text-primary px-8 py-3 text-lg font-semibold hover:bg-slate-50"
                >
                  Jetzt Reise planen
                </Button>
                <Button 
                  variant="outline"
                  className="border-2 border-white text-white px-8 py-3 text-lg font-semibold hover:bg-white hover:text-primary"
                >
                  Demo ansehen
                </Button>
              </div>
            </div>
            <div className="hidden lg:block">
              <img 
                src="https://images.unsplash.com/photo-1488646953014-85cb44e25828?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600" 
                alt="Travel planning workspace" 
                className="rounded-xl shadow-2xl" 
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">
              Alles was du für deine Reiseplanung brauchst
            </h2>
            <p className="text-lg text-slate-600">
              Professionelle Tools für die perfekte Reiseorganisation
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="bg-primary bg-opacity-10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Wallet className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2">Budget-Management</h3>
              <p className="text-slate-600">
                Behalte dein Reisebudget im Blick mit detaillierten Kategorien und automatischen Berechnungen.
              </p>
            </div>
            <div className="text-center p-6">
              <div className="bg-green-500 bg-opacity-10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2">Aktivitäten & Termine</h3>
              <p className="text-slate-600">
                Plane Aktivitäten und Restaurantbesuche mit automatischer Kalenderansicht.
              </p>
            </div>
            <div className="text-center p-6">
              <div className="bg-yellow-500 bg-opacity-10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileDown className="h-8 w-8 text-yellow-600" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2">Export & Teilen</h3>
              <p className="text-slate-600">
                Exportiere deine Reisepläne als PDF oder CSV und teile sie mit der Community.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Auth Modal */}
      {showAuth && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="text-2xl font-bold">Willkommen</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAuth(false)}
                  className="h-8 w-8 p-0"
                >
                  ✕
                </Button>
              </div>
              <CardDescription>
                Melde dich an oder erstelle ein neues Konto
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="signin" className="space-y-4">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="signin">Anmelden</TabsTrigger>
                  <TabsTrigger value="signup">Registrieren</TabsTrigger>
                </TabsList>
                
                <TabsContent value="signin" className="space-y-4">
                  <form onSubmit={handleEmailSignIn} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="signin-email">E-Mail</Label>
                      <Input
                        id="signin-email"
                        name="email"
                        type="email"
                        placeholder="deine@email.com"
                        required
                        disabled={isLoading}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signin-password">Passwort</Label>
                      <Input
                        id="signin-password"
                        name="password"
                        type="password"
                        placeholder="••••••••"
                        required
                        disabled={isLoading}
                      />
                    </div>
                    <Button 
                      type="submit" 
                      className="w-full" 
                      disabled={isLoading}
                    >
                      {isLoading ? "Anmeldung läuft..." : "Anmelden"}
                    </Button>
                  </form>
                  
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-2 text-muted-foreground">oder</span>
                    </div>
                  </div>
                  
                  <Button
                    onClick={handleGoogleSignIn}
                    variant="outline"
                    className="w-full"
                    disabled={isLoading}
                  >
                    Mit Google anmelden
                  </Button>
                </TabsContent>
                
                <TabsContent value="signup" className="space-y-4">
                  <form onSubmit={handleEmailSignUp} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="signup-email">E-Mail</Label>
                      <Input
                        id="signup-email"
                        name="email"
                        type="email"
                        placeholder="deine@email.com"
                        required
                        disabled={isLoading}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-password">Passwort</Label>
                      <Input
                        id="signup-password"
                        name="password"
                        type="password"
                        placeholder="••••••••"
                        required
                        disabled={isLoading}
                        minLength={6}
                      />
                    </div>
                    <Button 
                      type="submit" 
                      className="w-full" 
                      disabled={isLoading}
                    >
                      {isLoading ? "Registrierung läuft..." : "Konto erstellen"}
                    </Button>
                  </form>
                  
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-2 text-muted-foreground">oder</span>
                    </div>
                  </div>
                  
                  <Button
                    onClick={handleGoogleSignIn}
                    variant="outline"
                    className="w-full"
                    disabled={isLoading}
                  >
                    Mit Google registrieren
                  </Button>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      )}
      
      {/* Footer */}
      <Footer />
    </div>
  );
}
