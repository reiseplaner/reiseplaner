import { MapPin, Wallet, Calendar, FileDown } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Landing() {
  const handleLogin = () => {
    window.location.href = "/api/login";
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
            <Button onClick={handleLogin} className="bg-primary text-white hover:bg-primary/90">
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
                  onClick={handleLogin}
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
    </div>
  );
}
