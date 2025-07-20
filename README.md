# 🌍 ReiseVeteran - Travel Planning App

Eine moderne, benutzerfreundliche Webanwendung zur kompletten Reiseplanung mit intelligenter Budgetierung, Aktivitäten-Management und nahtloser Zahlungsabwicklung.

![Travel Planning](https://img.shields.io/badge/Travel-Planning-blue)
![React](https://img.shields.io/badge/React-18.3-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue)
![Stripe](https://img.shields.io/badge/Stripe-Payments-green)
![Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black)

## ✨ Features

### 🎯 Kernfunktionen
- **📊 Intelligente Budgetplanung** - Detaillierte Kategorisierung und Tracking
- **🗓️ Aktivitäten-Management** - Planung und Buchung von Reiseaktivitäten
- **🍽️ Restaurant-Planer** - Restaurantreservierungen und Empfehlungen
- **📅 Kalender-Integration** - Übersichtliche Zeitplanung mit react-big-calendar
- **💰 Kostenaufteilung** - Faires Aufteilen von Reisekosten zwischen Reisenden

### 💳 Zahlungssystem
- **Pro Plan** (€4,99/Monat oder €49,99/Jahr) - Bis zu 10 Reisen
- **Veteran Plan** (€19,99/Monat oder €199,90/Jahr) - Unbegrenzte Reisen
- **Stripe-Integration** - Sichere Zahlungsabwicklung
- **PDF-Export** - Professionelle Reiseunterlagen

### 🔒 Sicherheit
- **Supabase Authentication** - Sichere Benutzeranmeldung
- **PostgreSQL Database** - Zuverlässige Datenspeicherung
- **Environment Variables** - Geschützte API-Keys
- **TypeScript** - Typsichere Entwicklung

## 🚀 Tech Stack

| Bereich | Technologie |
|---------|-------------|
| **Frontend** | React 18.3 + TypeScript + Vite |
| **UI Framework** | Tailwind CSS + shadcn/ui |
| **Backend** | Node.js + Express |
| **Database** | PostgreSQL + Supabase |
| **Authentication** | Supabase Auth |
| **Payments** | Stripe |
| **Calendar** | react-big-calendar |
| **Export** | jsPDF + Papaparse |
| **Deployment** | Vercel |

## 📦 Installation

### Voraussetzungen
- Node.js 18+ 
- npm oder yarn
- Git

### Setup

1. **Repository klonen**
```bash
git clone https://github.com/IHR_USERNAME/reise-veteran.git
cd reise-veteran
```

2. **Dependencies installieren**
```bash
npm install
```

3. **Environment Variables konfigurieren**
```bash
cp .env.example .env
# .env Datei mit echten Werten ausfüllen
```

4. **Development Server starten**
```bash
npm run dev
```

5. **Build für Produktion**
```bash
npm run build
```

## 🔧 Environment Variables

Kopieren Sie `.env.example` zu `.env` und füllen Sie die Werte aus:

```env
# Database
DATABASE_URL=your_database_url

# Supabase
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Stripe
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_webhook_secret

# Optional: Omio Integration
OMIO_AFFILIATE_ID=your_affiliate_id
```

## 📱 Verwendung

### 1. **Reise erstellen**
- Reisedaten eingeben (Abflug, Ziel, Termine, Teilnehmer)
- Gesamtbudget festlegen

### 2. **Budget planen**
- Kategorien: Transport, Hotel, Verpflegung, Aktivitäten
- Detaillierte Kostenkalkulation
- Echtzeit-Budget-Tracking

### 3. **Aktivitäten & Restaurants**
- Aktivitäten mit Terminplanung
- Restaurant-Reservierungen
- Google Maps Integration

### 4. **Kostenaufteilung**
- Faire Aufteilung zwischen Reisenden
- Beleg-Management
- Abrechnungsübersicht

### 5. **Export & Sharing**
- PDF-Export der kompletten Reiseplanung
- Kalender-Export
- Reise-Sharing mit anderen

## 🏗️ Projektstruktur

```
├── client/                 # React Frontend
│   ├── src/
│   │   ├── components/     # UI Komponenten
│   │   ├── pages/         # Seiten-Komponenten
│   │   ├── hooks/         # React Hooks
│   │   └── lib/           # Utilities & Config
├── server/                # Express Backend
│   ├── routes/            # API Routes
│   ├── types/             # TypeScript Types
│   ├── webhooks/          # Stripe Webhooks
│   └── middleware/        # Express Middleware
├── shared/                # Geteilte Types & Schema
├── migrations/            # Datenbank Migrationen
└── uploads/              # File Uploads
```

## 🚀 Deployment

### Vercel Deployment

1. **GitHub Repository erstellen**
2. **Vercel Dashboard** → New Project
3. **Environment Variables** in Vercel setzen
4. **Automatisches Deployment** bei Git Push

### Stripe Live-Konfiguration

1. **Stripe Dashboard** → Live-Modus aktivieren
2. **Products & Prices** erstellen
3. **Webhooks** konfigurieren: `/api/webhooks/stripe`
4. **Live-Keys** in Environment Variables setzen

## 🧪 Testing

```bash
# Tests ausführen
npm test

# Build testen
npm run build

# Type checking
npm run check
```

## 📄 API Documentation

### Authentication
Alle API-Endpoints benötigen Supabase Authentication:
```
Authorization: Bearer <supabase_token>
```

### Hauptendpoints
- `GET /api/trips` - Alle Reisen abrufen
- `POST /api/trips` - Neue Reise erstellen
- `GET /api/trips/:id` - Einzelne Reise abrufen
- `POST /api/subscription/create-checkout` - Stripe Checkout
- `POST /api/webhooks/stripe` - Stripe Webhooks

## 🤝 Contributing

1. Fork das Projekt
2. Feature Branch erstellen (`git checkout -b feature/AmazingFeature`)
3. Commit erstellen (`git commit -m 'Add AmazingFeature'`)
4. Branch pushen (`git push origin feature/AmazingFeature`)
5. Pull Request öffnen

## 📝 License

Distributed under the MIT License. See `LICENSE` for more information.

## 📞 Support

- **Email**: support@reise-veteran.com
- **Documentation**: [docs.reise-veteran.com](https://docs.reise-veteran.com)
- **Issues**: [GitHub Issues](https://github.com/IHR_USERNAME/reise-veteran/issues)

## 🙏 Acknowledgments

- [Supabase](https://supabase.com) - Backend-as-a-Service
- [Stripe](https://stripe.com) - Zahlungsabwicklung
- [Vercel](https://vercel.com) - Deployment Platform
- [shadcn/ui](https://ui.shadcn.com) - UI Components
- [Tailwind CSS](https://tailwindcss.com) - CSS Framework

---

**Made with ❤️ for travelers by travelers**
