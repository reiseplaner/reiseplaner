import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Shield, BarChart3, Target, Cookie } from "lucide-react";
import { useLocation } from "wouter";
import { useCookies } from "@/contexts/CookieContext";
import { useState } from "react";
import Footer from "@/components/Footer";

export default function CookieEinstellungen() {
  const [, navigate] = useLocation();
  const { preferences, updatePreferences } = useCookies();
  const [tempPreferences, setTempPreferences] = useState(preferences);

  const handleSave = () => {
    updatePreferences(tempPreferences);
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-6">
          <Button
            variant="ghost" 
            onClick={() => navigate("/")}
            className="flex items-center space-x-2"
          >
            <ArrowLeft size={16} />
            <span>Zurück</span>
          </Button>
        </div>

        <Card className="shadow-lg">
          <CardHeader>
            <div className="flex items-center space-x-3">
              <Cookie className="h-8 w-8 text-primary" />
              <CardTitle className="text-2xl font-bold text-gray-900">
                Cookie-Einstellungen
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-8">
            <div>
              <p className="text-gray-700 mb-6">
                Verwalten Sie Ihre Cookie-Präferenzen. Sie können Ihre Einstellungen jederzeit ändern.
              </p>
            </div>

            {/* Necessary Cookies */}
            <div className="border rounded-lg p-6 bg-green-50">
              <div className="flex items-start space-x-4">
                <Shield className="h-6 w-6 text-green-600 mt-1" />
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold text-gray-900">Notwendige Cookies</h3>
                    <Checkbox checked={true} disabled />
                  </div>
                  <p className="text-gray-700 mb-4">
                    Diese Cookies sind für die ordnungsgemäße Funktion der Website unerlässlich. 
                    Sie ermöglichen grundlegende Funktionen wie Sicherheit, Netzwerk-Management und Zugänglichkeit.
                  </p>
                  <div className="bg-white p-4 rounded border text-sm">
                    <h4 className="font-medium mb-2">Verwendete Cookies:</h4>
                    <ul className="space-y-1 text-gray-600">
                      <li>• <strong>sidebar_state:</strong> Speichert UI-Präferenzen</li>
                      <li>• <strong>auth_session:</strong> Verwaltet Benutzeranmeldung</li>
                      <li>• <strong>cookie_preferences:</strong> Speichert Ihre Cookie-Einstellungen</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Analytics Cookies */}
            <div className="border rounded-lg p-6">
              <div className="flex items-start space-x-4">
                <BarChart3 className="h-6 w-6 text-blue-600 mt-1" />
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold text-gray-900">Analyse-Cookies</h3>
                    <Checkbox 
                      checked={tempPreferences.analytics}
                      onCheckedChange={(checked) => 
                        setTempPreferences(prev => ({ ...prev, analytics: checked as boolean }))
                      }
                    />
                  </div>
                  <p className="text-gray-700 mb-4">
                    Diese Cookies sammeln Informationen darüber, wie Besucher die Website nutzen. 
                    Alle Daten werden anonymisiert und helfen uns, die Website zu verbessern.
                  </p>
                  <div className="bg-gray-50 p-4 rounded border text-sm">
                    <h4 className="font-medium mb-2">Geplante Services:</h4>
                    <ul className="space-y-1 text-gray-600">
                      <li>• <strong>Google Analytics:</strong> Website-Nutzungsstatistiken</li>
                      <li>• <strong>Performance Monitoring:</strong> Ladezeiten und Fehlererfassung</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Marketing Cookies */}
            <div className="border rounded-lg p-6">
              <div className="flex items-start space-x-4">
                <Target className="h-6 w-6 text-purple-600 mt-1" />
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold text-gray-900">Marketing-Cookies</h3>
                    <Checkbox 
                      checked={tempPreferences.marketing}
                      onCheckedChange={(checked) => 
                        setTempPreferences(prev => ({ ...prev, marketing: checked as boolean }))
                      }
                    />
                  </div>
                  <p className="text-gray-700 mb-4">
                    Diese Cookies werden für Werbezwecke verwendet. Sie verfolgen Besucher auf verschiedenen 
                    Websites und sammeln Informationen, um maßgeschneiderte Anzeigen bereitzustellen.
                  </p>
                  <div className="bg-gray-50 p-4 rounded border text-sm">
                    <h4 className="font-medium mb-2">Mögliche zukünftige Services:</h4>
                    <ul className="space-y-1 text-gray-600">
                      <li>• <strong>Remarketing:</strong> Personalisierte Werbung</li>
                      <li>• <strong>Social Media:</strong> Integration sozialer Netzwerke</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t">
              <Button onClick={handleSave} className="flex-1">
                Einstellungen speichern
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setTempPreferences({ necessary: true, analytics: true, marketing: true })}
                className="flex-1"
              >
                Alle akzeptieren
              </Button>
              <Button 
                variant="ghost" 
                onClick={() => setTempPreferences({ necessary: true, analytics: false, marketing: false })}
              >
                Alle ablehnen
              </Button>
            </div>
          </CardContent>
        </Card>
        <Footer />
      </div>
    </div>
  );
} 