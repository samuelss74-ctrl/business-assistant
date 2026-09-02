# business-assistant — Personlig AI-assistent (Fas 1-pilot)

En enkel chatt-sajt (text + mikrofon) med tre flikar — **Att göra**, **Idag**, **Historik** — där all tung logik körs bakom kulisserna i n8n + Gemini + Gmail/Google Calendar. Se `../ai-scout-finlandia` för syskonprojektet; det här är en helt separat kodbas och databas.

Arkitektur och bakgrund finns i planen: se konversationen där detta byggdes, eller läsningen nedan.

## Vad som redan är klart

- Next.js-app (App Router, TypeScript) med chatt, Att göra, Idag, Historik och inloggning.
- Supabase-projekt (region eu-north-1, internt fortfarande döpt "ai-assistant" i Supabase-dashboarden — bara en kosmetisk etikett, byt gärna under Project Settings → General om du vill) med tabellerna `messages`, `pending_actions`, `activity_log`, `action_tiers` + RLS + Realtime.
- `.env.local` ifylld med Supabase URL + anon-nyckel.
- n8n-workflow-JSON i `n8n/`-mappen, redo att importeras.
- `n8n/docker-compose.yml` + `n8n/.env.n8n` för att köra n8n lokalt via Docker, med slumpad `N8N_ENCRYPTION_KEY`/`N8N_SHARED_SECRET` redan ifyllda och synkade med `.env.local`.

## Det du behöver göra för att få allt att fungera

### 1. Supabase service-role-nyckel
1. Gå till [Supabase Dashboard](https://supabase.com/dashboard/project/tohlwjameqpsqicwfhzy/settings/api).
2. Kopiera **service_role**-nyckeln (hemlig, visa aldrig i klientkod).
3. Klistra in i `.env.local` som `SUPABASE_SERVICE_ROLE_KEY=...`.

### 2. Skapa ditt eget inloggningskonto
1. Samma dashboard → **Authentication → Users → Add user**.
2. Fyll i din e-post och ett lösenord, kryssa i **Auto Confirm User**.
3. Kopiera det genererade **User UID** — det behövs som `PILOT_USER_ID` i n8n (steg 5).

### 3. Gemini API-nyckel
1. Gå till [Google AI Studio](https://aistudio.google.com/app/apikey) och skapa en API-nyckel.
2. Sparas som `GEMINI_API_KEY` i n8n (inte i `.env.local` — bara n8n pratar med Gemini).

### 4. Google Cloud-projekt för Gmail + Calendar
1. Skapa ett projekt i [Google Cloud Console](https://console.cloud.google.com/).
2. Aktivera **Gmail API** och **Google Calendar API** (API:er och tjänster → Aktivera API:er).
3. Skapa OAuth-samtyckesskärm (External, lägg till din egen e-post som testanvändare).
4. Skapa **OAuth-klient-ID** (typ: Web application), redirect-URI: `http://localhost:5678/rest/oauth2-credential/callback` (n8n:s standard-callback när det körs lokalt på port 5678).

### 5. n8n lokalt via Docker

Vi kör n8n som en Docker-container på din egen dator (inte n8n Cloud) — bra för utveckling, men tänk på att assistenten bara svarar när din dator och Docker Desktop är igång.

1. **Docker Desktop måste vara igång** (startas av Claude eller manuellt).
2. Fyll i `n8n/.env.n8n` (redan skapad, med `N8N_ENCRYPTION_KEY` och `N8N_SHARED_SECRET` slumpade och `SUPABASE_URL` ifylld) med:
   - `SUPABASE_SERVICE_ROLE_KEY` (från steg 1)
   - `GEMINI_API_KEY` (från steg 3)
   - `PILOT_USER_ID` — ditt User UID från steg 2.
3. Starta containern:
   ```bash
   cd n8n
   docker compose --env-file .env.n8n up -d
   ```
4. Öppna http://localhost:5678 och skapa ditt n8n-admin-konto (första gången du öppnar en färsk instans).
5. Skapa två Google-credentials i n8n (**Credentials → New**): "Gmail account" (Gmail OAuth2 API) och "Google Calendar account" (Google Calendar OAuth2 API), använd klient-ID/secret från steg 4.
6. I varje importerad workflow: byt ut `[SUPABASE_URL]` (text-placeholder i HTTP Request-noderna) mot `https://tohlwjameqpsqicwfhzy.supabase.co`.
7. Importera de fyra workflow-filerna (Workflows → Import from File):
   - `chat-router.json`
   - `gmail-poller.json`
   - `execute-action.json`
   - `today.json`
8. Koppla "Gmail account"/"Google Calendar account"-credentialsen till respektive Gmail-/Calendar-nod i varje workflow (de pekar på en platshållar-credential som inte finns efter import).
9. Aktivera samtliga fyra workflows.

`.env.local` pekar redan mot `N8N_BASE_URL=http://localhost:5678` med samma delade hemlighet som `n8n/.env.n8n` — inget mer att fylla i där.

**Vill du hellre köra n8n Cloud (hostat, alltid uppe) istället?** Skapa konto på [n8n.io](https://n8n.io/cloud/), sätt samma variabler under Instance settings → Variables, och byt `N8N_BASE_URL` i `.env.local` till din molninstans-URL.

## Köra lokalt

```bash
npm run dev
```

Öppna http://localhost:3000, logga in med kontot från steg 2.

## Verifiering (matchar pilotens walking skeleton)

1. Skicka ett textmeddelande i chatten, t.ex. "Vad händer idag?" — ska svara via Gemini.
2. Testa mikrofonknappen i Chrome/Edge.
3. Skicka ett testmejl till dig själv som liknar en träningskallelse (så att `gmail-poller`-sökfrasen i noden **Gmail: Search Team Mail** matchar — byt sökfrasen där till din faktiska lagmejladress). Vänta max 5 minuter, eller kör workflowen manuellt i n8n.
4. Kortet ska dyka upp under **Att göra** (Realtime, ingen omladdning behövs).
5. Klicka **Acceptera** — ett svarsmejl ska skickas och en rad ska dyka upp under **Historik**.
6. Öppna **Idag** och verifiera att dagens kalender visas.

## Nästa faser (inte byggda än)

Familjekalender/Meitner, företagsflöde, AI-scout-integration, PWA/hemskärm, native app.
