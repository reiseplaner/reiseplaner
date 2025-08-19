# 🔧 VERCEL ENVIRONMENT VARIABLES SETUP

## KRITISCHE ENVIRONMENT VARIABLES

### 🗄️ DATABASE
```
DATABASE_URL=your_supabase_database_url_here
```

### 🔐 SUPABASE
```
VITE_SUPABASE_URL=https://ycfbegvjeviovbglbrdy.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InljZmJlZ3ZqZXZpb3ZiZ2xicmR5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg0NjUyOTEsImV4cCI6MjA2NDA0MTI5MX0.vpTfW9Z2k6uwZRk-bI7pBD-V-rAA6uwnl53mscDqa7c
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

### 💳 STRIPE (TEST KEYS ZUERST)
```
STRIPE_SECRET_KEY=sk_test_YOUR_TEST_KEY_HERE
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
```

### ✈️ OMIO (OPTIONAL)
```
OMIO_ACCOUNT_SID=IRCxhCYwRgKw5197603nvomBbdxhpp9do1
OMIO_AUTH_TOKEN=VhXWQCe3khJoA_ARJSFkqt-6cDZMhzsj
OMIO_AFFILIATE_ID=5197603
OMIO_API_BASE_URL=https://api.omio.com
```

### ⚙️ APPLICATION
```
NODE_ENV=production
PORT=3000
```

## 📋 SCHRITT-FÜR-SCHRITT ANLEITUNG

1. Vercel Dashboard → Project Settings → Environment Variables
2. Jede Variable einzeln hinzufügen
3. Production, Preview & Development auswählen
4. Save klicken
5. Redeploy auslösen

## ⚠️ REIHENFOLGE WICHTIG:
1. ERST diese Test-Keys setzen
2. DANN Deployment testen
3. DANACH auf Live-Keys umstellen
