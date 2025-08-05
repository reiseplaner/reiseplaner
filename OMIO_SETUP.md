# Omio API Setup & Fehlerbehebung

## 🔧 Schritt 1: .env-Datei erstellen

Erstellen Sie eine neue Datei namens `.env` im Projektroot (gleiche Ebene wie `package.json`):

```env
# Omio API Configuration
OMIO_ACCOUNT_SID=IRCxhCYwRgKw5197603nvomBbdxhpp9do1
OMIO_AUTH_TOKEN=VhXWQCe3khJoA_ARJSFkqt-6cDZMhzsj
OMIO_AFFILIATE_ID=5197603

# Omio API Base URL
OMIO_API_BASE_URL=https://api.omio.com
```

## 🔄 Schritt 2: Server neu starten

Nach dem Erstellen der `.env`-Datei:

1. **Terminal öffnen** im Projektroot
2. **Server stoppen**: `Ctrl+C` oder `pkill -f "tsx server/index.ts"`
3. **Server starten**: `cd client && npm run dev`

## 🎯 Wie die Datenübertragung funktioniert

### **Automatische Parameterübertragung:**

Wenn Sie auf "Bei Omio buchen" klicken, werden folgende Daten automatisch übertragen:

- ✅ **Abflughafen**: `departure=FRA` (aus Ihren Reisedaten)
- ✅ **Zielflughafen**: `destination=JFK` (aus Ihren Reisedaten)  
- ✅ **Reisedatum**: `departureDate=2025-06-01` (aus Ihren Reisedaten)
- ✅ **Anzahl Passagiere**: `passengers=5` (aus Ihren Reisedaten)
- ✅ **Klasse**: `class=economy` (Standard)
- ✅ **Affiliate-ID**: Automatisch in der URL enthalten

### **Beispiel-URL:**
```
https://omio.sjv.io/mObGEX?departure=FRA&destination=JFK&departureDate=2025-06-01&passengers=5&class=economy&flight_id=LH441
```

## 🐛 Fehlerbehebung "Bad Gateway"

### **Mögliche Ursachen:**

1. **Omio API noch nicht aktiv**
   - Lösung: Kontaktieren Sie Omio Support zur API-Aktivierung

2. **Falsche API-Endpoints**
   - Lösung: Prüfen Sie die Omio API-Dokumentation für korrekte URLs

3. **Affiliate-Link-Konfiguration**
   - Lösung: Prüfen Sie, ob `omio.sjv.io/mObGEX` korrekt konfiguriert ist

### **Debug-Schritte:**

1. **Server-Logs prüfen:**
   ```bash
   # Schauen Sie nach diesen Meldungen:
   🔵 Using real Omio API          # ✅ API wird verwendet
   🔵 Omio API credentials not configured  # ❌ .env fehlt
   ```

2. **Browser-Netzwerk-Tab:**
   - Öffnen Sie Entwicklertools (F12)
   - Gehen Sie zum "Network"-Tab
   - Klicken Sie auf "Flüge prüfen"
   - Prüfen Sie die API-Requests

3. **Test mit Mock-Daten:**
   - Ohne `.env`-Datei werden Mock-Daten verwendet
   - Diese sollten immer funktionieren

## 📊 Status-Überprüfung

### **✅ Funktioniert (Mock-Daten):**
```
🔵 Omio API credentials not configured, using mock data
🟢 Flight search completed successfully
```

### **✅ Funktioniert (Echte API):**
```
🔵 Using real Omio API
🔵 Omio API response status: 200
🟢 Transformed flight results: 3 flights
```

### **❌ Problem:**
```
🔴 Omio API error: 502 Bad Gateway
🔵 Falling back to mock data
```

## 🎯 Nächste Schritte

1. **Erstellen Sie die `.env`-Datei** wie oben beschrieben
2. **Starten Sie den Server neu**
3. **Testen Sie die Flugsuche**
4. **Prüfen Sie die Server-Logs**

Bei weiteren Problemen kontaktieren Sie den Omio Support für API-Aktivierung und korrekte Endpoint-URLs. 