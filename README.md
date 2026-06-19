# ⚽ Fußball-Karten Katalog

Eine Next.js App (App Router, TypeScript, Tailwind CSS) mit Supabase Auth und einer persönlichen Karten-Sammlung.

## Features

- **Login / Registrierung** via Supabase Auth (E-Mail + Passwort)
- **Kartenliste** - zeigt alle eigenen Karten (RLS: jede Karte gehört `auth.uid()`)
- **Karte anlegen** - Formular mit Spieler, Team, Jahrgang, Zustand, Notizen und Bild-Upload
- **Karte bearbeiten** - vorbefülltes Formular
- **Karte löschen** - mit Bestätigungs-Dialog
- **Middleware** - schützt `/cards/*`, leitet eingeloggte User von `/login` weg

## Setup

### 1. Umgebungsvariablen
```bash
cp .env.example .env.local
```
Trage in `.env.local` deine Supabase-Werte ein:
```
NEXT_PUBLIC_SUPABASE_URL=https://<dein-projekt>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
```

### 2. Datenbank-Migration
Führe diese Dateien in deinem Supabase SQL Editor aus:

1. `supabase/migrations/20260619_cards.sql`
2. `supabase/migrations/20260619_storage.sql`

### 3. Supabase Storage
Prüfe in Supabase unter **Storage**, dass der Bucket `card-images` existiert.

### 4. Supabase Auth
Stelle sicher, dass **Email Auth** aktiviert ist (Authentication -> Providers -> Email).

### 5. Starten
```bash
npm install
npm run dev
```

Öffne http://localhost:3000

## Projektstruktur
```
app/
  layout.tsx               Root-Layout mit Navbar
  page.tsx                 Redirect -> /cards
  login/page.tsx           Login & Registrierung
  cards/
    page.tsx               Kartenliste (Server Component)
    new/page.tsx           Neue Karte anlegen
    [id]/edit/page.tsx     Karte bearbeiten
components/
  Navbar.tsx               Navigationsleiste
  CardForm.tsx             Formular (Anlegen + Bearbeiten)
  DeleteCardButton.tsx     Löschen-Button (Client Component)
lib/
  supabase/client.ts       Browser-Client
  supabase/server.ts       Server-Client (SSR)
  actions/auth.ts          Server Actions: login, signup, logout
  actions/cards.ts         Server Actions: createCard, updateCard, deleteCard
  types.ts                 TypeScript-Typen
middleware.ts              Routing-Schutz via Supabase SSR
supabase/migrations/       DB-Migration (cards-Tabelle + RLS)
```
