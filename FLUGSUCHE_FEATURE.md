# Flugsuche-Feature

## Übersicht

Die neue Flugsuche-Funktion ermöglicht es Nutzern, direkt aus dem Reiseplaner heraus nach passenden Flügen zu suchen. Die Funktion ist über die Omio API integriert und bietet eine nahtlose Buchungserfahrung.

## Funktionsweise

### 1. Voraussetzungen

Damit der "Flüge prüfen" Button erscheint, müssen folgende Bedingungen erfüllt sein:

- Ein Budgeteintrag der Kategorie "Transport" mit Unterkategorie "Flug" muss existieren
- Die Reise muss folgende Daten enthalten:
  - Abflughafen (IATA-Code, z.B. FRA)
  - Zielort (IATA-Code, z.B. BKK)
  - Reisebeginn (Datum)
  - Anzahl der Personen

### 2. Benutzerinteraktion

1. **Button erscheint**: Sobald ein Flug-Budgeteintrag erstellt wurde, erscheint ein Flugzeug-Icon (✈️) in der Aktionen-Spalte
2. **Flugsuche starten**: Klick auf den Button startet die Suche über die Omio API
3. **Ergebnisse anzeigen**: Die Suchergebnisse werden in einem Modal-Dialog angezeigt
4. **Sortierung**: Nutzer können die Ergebnisse nach Preis, Flugdauer oder Abflugzeit sortieren
5. **Buchung**: Direkter Link zur Buchung bei Omio mit Affiliate-Tracking

## Technische Implementierung

### Backend (Server)

**Neue API-Route**: `POST /api/trips/:tripId/search-flights`

- Überprüft Berechtigung des Nutzers
- Validiert Reisedaten
- Prüft Existenz eines Flug-Budgeteintrags
- Führt Proxy-Request zur Omio API durch (aktuell Mock-Daten)
- Gibt strukturierte Flugdaten zurück

### Frontend (Client)

**Neue Komponenten**:

1. **FlightSearchResults.tsx**: Modal-Dialog für Suchergebnisse
   - Sortierbare Flugliste
   - Responsive Design
   - Affiliate-Links zu Omio

2. **Erweiterte BudgetOverview.tsx**:
   - Flugsuche-Button für Flug-Budgeteinträge
   - Integration der Suchergebnisse
   - State-Management für Flugsuche

### Datenstruktur

```typescript
interface FlightResult {
  id: string;
  airline: string;
  flightNumber: string;
  departure: {
    airport: string;
    time: string;
    date: string;
  };
  arrival: {
    airport: string;
    time: string;
    date: string;
  };
  duration: string;
  stops: number;
  price: {
    amount: number;
    currency: string;
  };
  bookingLink: string;
  cabinClass: string;
}
```

## Sicherheit

- **API-Schlüssel**: Werden nur serverseitig in .env-Variablen gespeichert
- **Proxy-Pattern**: Frontend hat keinen direkten Zugriff auf externe APIs
- **Authentifizierung**: Alle Requests sind authentifiziert und autorisiert

## Zukünftige Erweiterungen

### Echte Omio API Integration

Aktuell werden Mock-Daten verwendet. Für die Produktionsumgebung:

1. Omio API-Schlüssel in `.env` hinzufügen:
   ```
   OMIO_API_KEY=your_api_key_here
   OMIO_AFFILIATE_ID=your_affiliate_id
   ```

2. Server-Route erweitern:
   ```typescript
   // Ersetze Mock-Daten durch echten API-Call
   const omioResponse = await fetch('https://api.omio.com/search', {
     headers: {
       'Authorization': `Bearer ${process.env.OMIO_API_KEY}`,
       'Content-Type': 'application/json'
     },
     method: 'POST',
     body: JSON.stringify({
       from: trip.departure,
       to: trip.destination,
       date: trip.startDate,
       passengers: trip.travelers
     })
   });
   ```

### Weitere Features

- **Rückflug-Suche**: Automatische Suche nach Rückflügen
- **Preisalerts**: Benachrichtigungen bei Preisänderungen
- **Kalender-Integration**: Flexible Datumsauswahl
- **Filter-Optionen**: Airline, Abflugzeit, Zwischenstopps
- **Vergleich**: Integration weiterer Flugportale

## Testing

### Manueller Test

1. Neue Reise erstellen mit:
   - Abflughafen: FRA
   - Zielort: BKK
   - Reisedatum: Zukünftiges Datum
   - Personen: 2

2. Budgeteintrag erstellen:
   - Kategorie: Transport
   - Unterkategorie: Flug
   - Preis: 500€

3. Flugzeug-Button sollte erscheinen
4. Klick öffnet Suchergebnisse mit 3 Mock-Flügen

### Fehlerbehandlung

- Fehlende Reisedaten → Fehlermeldung
- Kein Flug-Budget → Fehlermeldung  
- API-Fehler → Toast-Benachrichtigung
- Keine Ergebnisse → Leerer Zustand

## Deployment

Die Funktion ist vollständig implementiert und einsatzbereit. Für die Produktionsumgebung:

1. Omio API-Credentials konfigurieren
2. Affiliate-Links anpassen
3. Error-Monitoring einrichten
4. Performance-Optimierung für große Ergebnismengen

## Support

Bei Fragen oder Problemen:
- Prüfe Browser-Konsole auf Fehler
- Überprüfe Server-Logs für API-Fehler
- Validiere Reisedaten-Vollständigkeit 