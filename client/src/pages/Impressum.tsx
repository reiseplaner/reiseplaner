import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";

export default function Impressum() {
  const [, navigate] = useLocation();

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
            <CardTitle className="text-2xl font-bold text-gray-900">
              Impressum
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 text-gray-700">
            <div>
              <h3 className="text-lg font-semibold mb-2">Angaben gemäß § 5 TMG</h3>
              <div className="space-y-1">
                <p><strong>Kuhn Marketing</strong></p>
                <p>Hauptstraße 17a</p>
                <p>53604 Bad Honnef</p>
                <p>Deutschland</p>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">Kontakt</h3>
              <div className="space-y-1">
                <p>E-Mail: reiseveteran@gmail.com</p>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">Vertreten durch</h3>
              <p>Kuhn Marketing</p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">Umsatzsteuer-ID</h3>
              <p>Umsatzsteuer-Identifikationsnummer gemäß § 27 a Umsatzsteuergesetz:</p>
              <p>DE353221696</p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">Redaktionell verantwortlich</h3>
              <div className="space-y-1">
                <p>Kuhn Marketing</p>
                <p>Hauptstraße 17a</p>
                <p>53604 Bad Honnef</p>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">EU-Streitschlichtung</h3>
              <p>
                Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit: 
                <a href="https://ec.europa.eu/consumers/odr/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline ml-1">
                  https://ec.europa.eu/consumers/odr/
                </a>
              </p>
              <p>Unsere E-Mail-Adresse finden Sie oben im Impressum.</p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">Verbraucherstreitbeilegung/Universalschlichtungsstelle</h3>
              <p>
                Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer 
                Verbraucherschlichtungsstelle teilzunehmen.
              </p>
            </div>

            <div className="border-t pt-4 text-sm text-gray-500">
              <p>
                <strong>Hinweis:</strong> Bitte passen Sie dieses Impressum an Ihre spezifischen 
                Unternehmensangaben an. Dies ist nur ein Template und rechtliche Beratung wird empfohlen.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 