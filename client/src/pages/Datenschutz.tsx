import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";
import Footer from "@/components/Footer";

export default function Datenschutz() {
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
              Datenschutzerklärung
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 text-gray-700">
            <div>
              <h3 className="text-lg font-semibold mb-2">1. Datenschutz auf einen Blick</h3>
              <h4 className="font-semibold mb-2">Allgemeine Hinweise</h4>
              <p>
                Die folgenden Hinweise geben einen einfachen Überblick darüber, was mit Ihren 
                personenbezogenen Daten passiert, wenn Sie diese Website besuchen. Personenbezogene 
                Daten sind alle Daten, mit denen Sie persönlich identifiziert werden können.
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Datenerfassung auf dieser Website</h4>
              <p className="mb-2"><strong>Wer ist verantwortlich für die Datenerfassung auf dieser Website?</strong></p>
              <p>
                Die Datenverarbeitung auf dieser Website erfolgt durch den Websitebetreiber. 
                Dessen Kontaktdaten können Sie dem Impressum dieser Website entnehmen.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">2. Hosting</h3>
              <p>
                Wir hosten die Inhalte unserer Website bei folgenden Anbietern:
              </p>
              <h4 className="font-semibold mb-2 mt-4">Externes Hosting</h4>
              <p>
                Diese Website wird extern gehostet. Die personenbezogenen Daten, die auf dieser 
                Website erfasst werden, werden auf den Servern des Hosters / der Hoster gespeichert.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">3. Allgemeine Hinweise und Pflichtinformationen</h3>
              <h4 className="font-semibold mb-2">Datenschutz</h4>
              <p>
                Die Betreiber dieser Seiten nehmen den Schutz Ihrer persönlichen Daten sehr ernst. 
                Wir behandeln Ihre personenbezogenen Daten vertraulich und entsprechend den 
                gesetzlichen Datenschutzvorschriften sowie dieser Datenschutzerklärung.
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Hinweis zur verantwortlichen Stelle</h4>
              <p>Die verantwortliche Stelle für die Datenverarbeitung auf dieser Website ist:</p>
              <div className="bg-gray-50 p-4 rounded-lg mt-2">
                <p>Kuhn Marketing</p>
                <p>Hauptstraße 17a</p>
                <p>53604 Bad Honnef</p>
                <p>E-Mail: reiseveteran@gmail.com</p>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">4. Datenerfassung auf dieser Website</h3>
              <h4 className="font-semibold mb-2">Cookies</h4>
              <p className="mb-4">
                Unsere Internetseiten verwenden so genannte "Cookies". Cookies sind kleine 
                Datenpakete und richten auf Ihrem Endgerät keinen Schaden an. Sie werden entweder 
                vorübergehend für die Dauer einer Sitzung (Session-Cookies) oder dauerhaft 
                (dauerhafte Cookies) auf Ihrem Endgerät gespeichert.
              </p>
              
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <h5 className="font-medium mb-2">Verwendete Cookie-Kategorien:</h5>
                <ul className="space-y-2 text-sm">
                  <li>
                    <strong>Notwendige Cookies:</strong> Diese Cookies sind für die Grundfunktionen der Website erforderlich (z.B. Anmeldung, UI-Einstellungen).
                  </li>
                  <li>
                    <strong>Analyse-Cookies:</strong> Mit Ihrer Einwilligung verwenden wir Analyse-Tools wie Google Analytics zur Verbesserung unserer Website.
                  </li>
                  <li>
                    <strong>Marketing-Cookies:</strong> Diese werden nur bei Ihrer ausdrücklichen Zustimmung für personalisierte Inhalte verwendet.
                  </li>
                </ul>
              </div>
              
              <p className="text-sm">
                Sie können Ihre Cookie-Einstellungen jederzeit in unseren{' '}
                <a href="/cookie-einstellungen" className="text-blue-600 hover:underline">
                  Cookie-Einstellungen
                </a> ändern.
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Server-Log-Dateien</h4>
              <p>
                Der Provider der Seiten erhebt und speichert automatisch Informationen in 
                so genannten Server-Log-Dateien, die Ihr Browser automatisch an uns übermittelt.
              </p>
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li>Browsertyp und Browserversion</li>
                <li>verwendetes Betriebssystem</li>
                <li>Referrer URL</li>
                <li>Hostname des zugreifenden Rechners</li>
                <li>Uhrzeit der Serveranfrage</li>
                <li>IP-Adresse</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Kontaktformular</h4>
              <p>
                Wenn Sie uns per Kontaktformular Anfragen zukommen lassen, werden Ihre Angaben 
                aus dem Anfrageformular inklusive der von Ihnen dort angegebenen Kontaktdaten 
                zwecks Bearbeitung der Anfrage und für den Fall von Anschlussfragen bei uns gespeichert.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">5. Analyse-Tools und Werbung</h3>
              <h4 className="font-semibold mb-2">Google Analytics (bei Einwilligung)</h4>
              <p>
                Bei Ihrer Einwilligung verwenden wir Google Analytics, einen Webanalysedienst der Google Ireland 
                Limited ("Google"). Google Analytics verwendet Cookies, die eine Analyse der Benutzung der 
                Website durch Sie ermöglichen. Die durch das Cookie erzeugten Informationen über Ihre Benutzung 
                dieser Website werden in der Regel an einen Server von Google in den USA übertragen und dort gespeichert.
              </p>
              <p className="mt-2 text-sm bg-blue-50 p-3 rounded">
                <strong>Wichtig:</strong> Google Analytics wird nur aktiviert, wenn Sie in unseren Cookie-Einstellungen 
                zugestimmt haben. Sie können diese Einwilligung jederzeit widerrufen.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">6. Plugins und Tools</h3>
              <h4 className="font-semibold mb-2">Google Fonts</h4>
              <p>
                Diese Seite nutzt zur einheitlichen Darstellung von Schriftarten so genannte 
                Google Fonts, die von Google bereitgestellt werden. Beim Aufruf einer Seite lädt 
                Ihr Browser die benötigten Fonts in ihren Browsercache.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">7. Ihre Rechte</h3>
              <p>Sie haben folgende Rechte:</p>
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li>Recht auf Auskunft über Ihre bei uns gespeicherten personenbezogenen Daten</li>
                <li>Recht auf Berichtigung unrichtiger oder Vervollständigung unvollständiger Daten</li>
                <li>Recht auf Löschung Ihrer bei uns gespeicherten Daten</li>
                <li>Recht auf Einschränkung der Datenverarbeitung</li>
                <li>Recht auf Datenübertragbarkeit</li>
                <li>Widerspruchsrecht gegen die Verarbeitung Ihrer Daten</li>
                <li>Recht auf Beschwerde bei einer Aufsichtsbehörde</li>
                <li><strong>Recht auf Widerruf von Cookie-Einwilligungen</strong> - jederzeit in den Cookie-Einstellungen</li>
              </ul>
            </div>

            <div className="border-t pt-4 text-sm text-gray-500">
              <p>
                <strong>Hinweis:</strong> Diese Datenschutzerklärung ist ein Template und muss 
                an Ihre spezifischen Gegebenheiten angepasst werden. Rechtliche Beratung wird empfohlen.
              </p>
              <p className="mt-2">
                Stand: {new Date().toLocaleDateString('de-DE')}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
      <Footer />
    </div>
  );
} 