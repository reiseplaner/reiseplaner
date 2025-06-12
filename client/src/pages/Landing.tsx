import { MapPin, Wallet, Calendar, FileDown, ArrowRight, Check, Sparkles, Users, TrendingUp, Star } from "lucide-react";
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
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-lg border-b border-slate-100 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <MapPin className="h-7 w-7 text-slate-800 mr-3" />
              <span className="text-xl font-semibold text-slate-900">ReiseVeteran</span>
            </div>
            <Button 
              onClick={() => setShowAuth(true)} 
              className="bg-slate-900 text-white hover:bg-slate-800 px-6 py-2 rounded-full font-medium transition-all duration-200"
            >
              Anmelden
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-20 pb-16 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-slate-100 text-slate-700 px-4 py-2 rounded-full text-sm font-medium mb-8">
              <Sparkles className="h-4 w-4" />
              Moderne Reiseplanung für Profis
            </div>
            <h1 className="text-5xl md:text-7xl font-bold text-slate-900 mb-6 leading-tight">
              Plane deine
              <span className="bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent block">
                perfekte Reise
              </span>
            </h1>
            <p className="text-xl text-slate-600 mb-12 max-w-2xl mx-auto leading-relaxed">
              Budget verwalten, Aktivitäten planen und mit der Community teilen. 
              Alles in einer eleganten, professionellen Plattform.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                onClick={() => setShowAuth(true)}
                className="bg-slate-900 text-white hover:bg-slate-800 px-8 py-4 text-lg font-semibold rounded-full transition-all duration-200 flex items-center gap-2"
              >
                Kostenlos starten
                <ArrowRight className="h-5 w-5" />
              </Button>
              <Button 
                variant="outline"
                className="border-2 border-slate-200 text-slate-700 hover:bg-slate-50 px-8 py-4 text-lg font-semibold rounded-full transition-all duration-200"
              >
                Demo ansehen
              </Button>
            </div>
          </div>

          {/* Visual Mockup - Clean Design */}
          <div className="relative max-w-4xl mx-auto">
            <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-3xl p-8 shadow-xl border border-slate-200">
              <div className="bg-white rounded-2xl p-6 shadow-lg">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <div className="ml-4 bg-slate-100 px-4 py-2 rounded-lg text-sm text-slate-600 font-mono">
                    reiseveteran.app
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-slate-900">Meine Tokio Reise</h3>
                    <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                      Budget: €2,340 / €2,500
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-slate-50 p-4 rounded-xl">
                      <div className="text-sm text-slate-600 mb-1">Aktivitäten</div>
                      <div className="text-2xl font-bold text-slate-900">12</div>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-xl">
                      <div className="text-sm text-slate-600 mb-1">Restaurants</div>
                      <div className="text-2xl font-bold text-slate-900">8</div>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-xl">
                      <div className="text-sm text-slate-600 mb-1">Tage</div>
                      <div className="text-2xl font-bold text-slate-900">7</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="absolute -top-6 -right-6 bg-white p-4 rounded-2xl shadow-lg border border-slate-200">
              <div className="flex items-center gap-2">
                <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                <span className="text-sm font-medium text-slate-900">Perfekt geplant!</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">
              Alles was du brauchst
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Professionelle Tools für die perfekte Reiseorganisation - elegant und einfach zu bedienen
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white">
              <CardHeader className="text-center pb-4">
                <div className="bg-slate-900 w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Wallet className="h-7 w-7 text-white" />
                </div>
                <CardTitle className="text-xl font-semibold text-slate-900">Budget-Management</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-slate-600 leading-relaxed">
                  Behalte dein Reisebudget im Blick mit detaillierten Kategorien und automatischen Berechnungen.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white">
              <CardHeader className="text-center pb-4">
                <div className="bg-slate-900 w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Calendar className="h-7 w-7 text-white" />
                </div>
                <CardTitle className="text-xl font-semibold text-slate-900">Aktivitäten & Termine</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-slate-600 leading-relaxed">
                  Plane Aktivitäten und Restaurantbesuche mit automatischer Kalenderansicht.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white">
              <CardHeader className="text-center pb-4">
                <div className="bg-slate-900 w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <FileDown className="h-7 w-7 text-white" />
                </div>
                <CardTitle className="text-xl font-semibold text-slate-900">Export & Teilen</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-slate-600 leading-relaxed">
                  Exportiere deine Reisepläne als PDF oder CSV und teile sie mit der Community.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Social Proof Section */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">
              Vertrauen von Reisenden weltweit
            </h2>
            <p className="text-xl text-slate-600">
              Tausende nutzen bereits ReiseVeteran für ihre perfekte Reiseplanung
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            <div className="text-center">
              <div className="text-4xl font-bold text-slate-900 mb-2">5,000+</div>
              <div className="text-slate-600">Geplante Reisen</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-slate-900 mb-2">98%</div>
              <div className="text-slate-600">Zufriedene Nutzer</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-slate-900 mb-2">50+</div>
              <div className="text-slate-600">Länder erreicht</div>
            </div>
          </div>

          <div className="bg-slate-50 rounded-3xl p-12 text-center">
            <div className="flex justify-center mb-6">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star key={star} className="h-6 w-6 text-yellow-500 fill-yellow-500" />
              ))}
            </div>
            <blockquote className="text-xl text-slate-700 mb-6 max-w-3xl mx-auto leading-relaxed">
              "ReiseVeteran hat meine Art zu reisen komplett verändert. Die intuitive Bedienung und 
              professionellen Tools machen die Reiseplanung zu einem echten Vergnügen."
            </blockquote>
            <div className="text-slate-600">
              <div className="font-semibold">Sarah M.</div>
              <div>Weltreisende aus Berlin</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-slate-900">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Bereit für deine nächste Reise?
          </h2>
          <p className="text-xl text-slate-300 mb-12 max-w-2xl mx-auto">
            Starte jetzt kostenlos und erlebe, wie einfach professionelle Reiseplanung sein kann.
          </p>
          <Button 
            onClick={() => setShowAuth(true)}
            className="bg-white text-slate-900 hover:bg-slate-100 px-12 py-4 text-lg font-semibold rounded-full transition-all duration-200"
          >
            Jetzt kostenlos starten
          </Button>
        </div>
      </section>

      {/* Auth Modal */}
      {showAuth && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md border-0 shadow-2xl">
            <CardHeader className="text-center">
              <div className="flex justify-between items-center mb-4">
                <CardTitle className="text-2xl font-bold text-slate-900">Willkommen</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAuth(false)}
                  className="h-8 w-8 p-0 text-slate-500 hover:text-slate-900"
                >
                  ✕
                </Button>
              </div>
              <CardDescription className="text-slate-600">
                Melde dich an oder erstelle ein neues Konto
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="signin" className="space-y-6">
                <TabsList className="grid w-full grid-cols-2 bg-slate-100">
                  <TabsTrigger value="signin" className="font-medium">Anmelden</TabsTrigger>
                  <TabsTrigger value="signup" className="font-medium">Registrieren</TabsTrigger>
                </TabsList>
                
                <TabsContent value="signin" className="space-y-4">
                  <form onSubmit={handleEmailSignIn} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="signin-email" className="text-slate-700 font-medium">E-Mail</Label>
                      <Input
                        id="signin-email"
                        name="email"
                        type="email"
                        placeholder="deine@email.com"
                        required
                        disabled={isLoading}
                        className="border-slate-200 focus:border-slate-400 rounded-lg"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signin-password" className="text-slate-700 font-medium">Passwort</Label>
                      <Input
                        id="signin-password"
                        name="password"
                        type="password"
                        placeholder="••••••••"
                        required
                        disabled={isLoading}
                        className="border-slate-200 focus:border-slate-400 rounded-lg"
                      />
                    </div>
                    <Button 
                      type="submit" 
                      className="w-full bg-slate-900 hover:bg-slate-800 rounded-lg py-3 font-medium" 
                      disabled={isLoading}
                    >
                      {isLoading ? "Anmeldung läuft..." : "Anmelden"}
                    </Button>
                  </form>
                  
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-slate-200" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-white px-2 text-slate-500 font-medium">oder</span>
                    </div>
                  </div>
                  
                  <Button
                    onClick={handleGoogleSignIn}
                    variant="outline"
                    className="w-full border-slate-200 hover:bg-slate-50 rounded-lg py-3 font-medium"
                    disabled={isLoading}
                  >
                    Mit Google anmelden
                  </Button>
                </TabsContent>
                
                <TabsContent value="signup" className="space-y-4">
                  <form onSubmit={handleEmailSignUp} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="signup-email" className="text-slate-700 font-medium">E-Mail</Label>
                      <Input
                        id="signup-email"
                        name="email"
                        type="email"
                        placeholder="deine@email.com"
                        required
                        disabled={isLoading}
                        className="border-slate-200 focus:border-slate-400 rounded-lg"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-password" className="text-slate-700 font-medium">Passwort</Label>
                      <Input
                        id="signup-password"
                        name="password"
                        type="password"
                        placeholder="••••••••"
                        required
                        disabled={isLoading}
                        minLength={6}
                        className="border-slate-200 focus:border-slate-400 rounded-lg"
                      />
                    </div>
                    <Button 
                      type="submit" 
                      className="w-full bg-slate-900 hover:bg-slate-800 rounded-lg py-3 font-medium" 
                      disabled={isLoading}
                    >
                      {isLoading ? "Registrierung läuft..." : "Konto erstellen"}
                    </Button>
                  </form>
                  
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-slate-200" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-white px-2 text-slate-500 font-medium">oder</span>
                    </div>
                  </div>
                  
                  <Button
                    onClick={handleGoogleSignIn}
                    variant="outline"
                    className="w-full border-slate-200 hover:bg-slate-50 rounded-lg py-3 font-medium"
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
