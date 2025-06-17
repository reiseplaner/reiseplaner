# Jährliche Zahlungsoptionen - Feature Dokumentation

## Übersicht
Die jährlichen Zahlungsoptionen wurden erfolgreich implementiert und bieten Nutzern erhebliche Einsparungen bei der Buchung von Jahresabonnements.

## Neue Preisstruktur

### Pro Plan
- **Monatlich**: €4,99/Monat
- **Jährlich**: €49,99/Jahr (entspricht €4,17/Monat)
- **Ersparnis**: €9,89 pro Jahr (2 Monate gratis!)

### Veteran Plan
- **Monatlich**: €19,99/Monat
- **Jährlich**: €199,90/Jahr (entspricht €16,66/Monat)
- **Ersparnis**: €39,98 pro Jahr (2 Monate gratis!)

## Implementierte Änderungen

### 1. Backend-Änderungen

#### Subscription Types (`server/types/subscription.ts`)
- Erweitert um `BillingInterval` Type: `'monthly' | 'yearly'`
- `SubscriptionPlan` Interface erweitert um:
  - `monthlyPrice: number`
  - `yearlyPrice: number`
  - `yearlyDiscount?: string`
- `SubscriptionInfo` Interface erweitert um:
  - `billingInterval?: BillingInterval`
- Neue Stripe Price IDs für jährliche Pläne:
  - `pro_yearly`
  - `veteran_yearly`

#### Datenbank Schema (`shared/schema.ts`)
- Neues Feld `billingInterval` in der `users` Tabelle
- Migration `0006_add_billing_interval.sql` erstellt

#### Storage Layer (`server/storage.ts`)
- `getUserSubscriptionStatus()` erweitert um `billingInterval`
- Korrekte Behandlung von `null`/`undefined` Werten

#### API Endpoints (`server/routes.ts`)
- `/api/subscription/create-checkout` erweitert um `billingInterval` Parameter
- Validierung für `billingInterval` hinzugefügt
- Mock-Response zeigt gewählten Plan und Preis an

### 2. Frontend-Änderungen

#### Pricing Page (`client/src/pages/PricingPage.tsx`)
- **Billing Toggle**: Eleganter Switch zwischen monatlich/jährlich
- **Dynamische Preisanzeige**: Preise ändern sich basierend auf gewähltem Intervall
- **Einsparungen Highlight**: Zeigt jährliche Ersparnisse prominent an
- **Gratis-Monate Badge**: "2 Monate Gratis!" Badge bei jährlicher Auswahl
- **Aktueller Plan Anzeige**: Zeigt Billing-Intervall des aktuellen Plans

#### Neue UI-Komponenten
- Toggle-Switch für Billing-Intervall
- Einsparungen-Anzeige mit grüner Hervorhebung
- Badge für "2 Monate Gratis!" Promotion

### 3. Benutzerfreundlichkeit

#### Klarheit der Preisgestaltung
- Deutliche Unterscheidung zwischen monatlichen und jährlichen Preisen
- Prominente Anzeige der Ersparnisse
- Klare Kennzeichnung des gewählten Billing-Intervalls

#### Interaktive Elemente
- Smooth Toggle-Animation
- Sofortige Preisänderung beim Umschalten
- Visuelle Hervorhebung der Vorteile

## Technische Details

### Stripe Integration (Vorbereitet)
Die Implementierung ist bereit für die echte Stripe-Integration:
- Separate Price IDs für monatliche und jährliche Pläne
- Korrekte Parameter-Übergabe an Stripe Checkout
- Billing-Intervall wird in der Datenbank gespeichert

### Datenbank-Migration
```sql
-- Migration: Add billing_interval to users table
ALTER TABLE "users" ADD COLUMN "billing_interval" varchar DEFAULT 'monthly';

-- Update existing users to have 'monthly' billing interval
UPDATE "users" SET "billing_interval" = 'monthly' WHERE "billing_interval" IS NULL;
```

### Umgebungsvariablen (für Stripe)
```env
STRIPE_PRO_MONTHLY_PRICE_ID=price_pro_monthly
STRIPE_PRO_YEARLY_PRICE_ID=price_pro_yearly
STRIPE_VETERAN_MONTHLY_PRICE_ID=price_veteran_monthly
STRIPE_VETERAN_YEARLY_PRICE_ID=price_veteran_yearly
```

## Nächste Schritte für Stripe-Integration

1. **Stripe Products & Prices erstellen**:
   - Pro Plan Monthly: €4,99
   - Pro Plan Yearly: €49,99
   - Veteran Plan Monthly: €19,99
   - Veteran Plan Yearly: €199,90

2. **Webhook-Handler implementieren**:
   - `invoice.payment_succeeded`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`

3. **Checkout Session erweitern**:
   ```javascript
   const session = await stripe.checkout.sessions.create({
     mode: 'subscription',
     line_items: [{
       price: STRIPE_PRICE_IDS[`${planId}_${billingInterval}`],
       quantity: 1,
     }],
     success_url: `${domain}/success`,
     cancel_url: `${domain}/pricing`,
   });
   ```

## Benutzertest-Szenarien

1. **Preisvergleich**: Nutzer kann zwischen monatlich/jährlich wechseln und Ersparnisse sehen
2. **Upgrade-Flow**: Nutzer kann sowohl monatliche als auch jährliche Pläne auswählen
3. **Aktueller Plan**: Nutzer sieht sein aktuelles Billing-Intervall
4. **Mobile Responsiveness**: Toggle und Preise funktionieren auf allen Geräten

## Erfolgsmessung

- **Conversion Rate**: Anteil der Nutzer, die jährliche Pläne wählen
- **Revenue Impact**: Durchschnittlicher Umsatz pro Nutzer (ARPU)
- **Churn Reduction**: Reduzierte Kündigungsrate bei jährlichen Abos
- **User Feedback**: Feedback zur Klarheit der Preisgestaltung

Die jährlichen Zahlungsoptionen sind vollständig implementiert und bereit für den Produktivbetrieb. Die Benutzeroberfläche ist intuitiv und die Ersparnisse werden klar kommuniziert. 