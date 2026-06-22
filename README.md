# Last Seen

> A real-time missing persons alert system that texts the right people — not posts on a feed, not notifies an app — **texts them**, within seconds of a case being approved.

India reported nearly **4.85 lakh new missing persons cases in 2023 alone**. The standard response is to file an FIR and wait. Last Seen does something different: the moment a case is verified, every registered phone number within 3 km of the last-seen location gets a real SMS with a direct link. No app required. No account needed to respond.

---

## Why This Exists

The people most likely to have seen someone go missing — auto drivers, delivery riders, shopkeepers, commuters — are already moving through the right area. They just never get asked. Every existing alert system either requires a pre-installed app (which most people don't have) or relies on social media sharing (which is slow, ungeofenced, and untracked).

Last Seen closes the gap between *a person goes missing* and *the right people start looking* — and measures that gap in minutes, not days.

---

## How It Works (The Five-Screen Flow)

```
Reporter → Verifier → Bystander → Witness → Family Dashboard
```

**1. Reporter** uploads one photo, drops a pin on the map, sets the last-seen time. No account creation. Under 60 seconds. The case is saved as `pending` — nothing goes out yet.

**2. Verifier** (police or NGO partner) reviews the pending report and clicks Approve or Reject. This is the only manual gate. No alert fires without it.

**3. Bystander** receives a real SMS on their phone with a direct link. Tapping it opens a card: the photo, how far away the person was last seen, and two buttons — *I think I saw this person* / *I haven't seen them*.

**4. Witness** taps the first button, drops a pin at their sighting location, and can optionally record a 10-second voice note. No name. No phone number. Deliberately anonymous, because fear of involvement is the single biggest reason bystanders stay silent.

**5. Family** watches a live dashboard: real alert count, tips arriving as map pins the moment they're submitted, and a button to expand the search radius — which re-alerts a wider ring of registered subscribers.

---

## Architecture

```
┌─────────────────────────────────┐        ┌──────────────────────┐
│         Frontend (React)        │◄───────│    OpenStreetMap     │
│  Vite · React Router · Leaflet  │        │   (Map tile tiles)   │
└────────────┬────────────────────┘        └──────────────────────┘
             │                    
     ┌───────┴────────┐          ┌──────────────────────────────────┐
     │                │          │         Supabase (Backend)        │
     ▼                ▼          │  Postgres · Storage · Realtime   │
┌─────────┐    ┌─────────────┐   └──────────────────────────────────┘
│ Backend │    │  Database   │
│(Express)│───►│  (Supabase) │
└────┬────┘    └──────┬──────┘
     │                │
     ▼                ▼
┌──────────┐   ┌────────────────┐
│ Twilio   │──►│ Bystander's    │
│   SMS    │   │    Phone       │
└──────────┘   └────────────────┘
```

The backend is a lightweight Express server. Its only job is: receive an approval trigger → compute Haversine distances → call Twilio for every subscriber within radius. There is no AI/ML anywhere in this system. Every decision is deterministic and traceable.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React (Vite), React Router |
| Maps | Leaflet, React-Leaflet, OpenStreetMap |
| Backend | Express.js |
| Database | Supabase (Postgres) |
| File Storage | Supabase Storage |
| Realtime | Supabase Realtime (Postgres change events) |
| SMS | Twilio Programmable SMS |
| Voice notes | Browser MediaRecorder API |
| Geolocation | Browser Geolocation API |

---

## Project Structure

```
last-seen/
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Report.jsx          # Missing person submission form
│   │   │   ├── AdminApproval.jsx   # Verifier approval interface
│   │   │   ├── AlertCard.jsx       # Bystander-facing SMS landing page
│   │   │   ├── TipSubmission.jsx   # Witness pin drop + voice note
│   │   │   └── Dashboard.jsx       # Live family dashboard
│   │   └── main.jsx
│   └── package.json
├── backend/
│   ├── server.js                   # Express server: SMS dispatch + distance filtering
│   └── package.json
└── README.md
```

---

## Prerequisites

- Node.js v18+
- A [Supabase](https://supabase.com) project (free tier works)
- A [Twilio](https://twilio.com) account with a verified SMS number

---

## Setup

### 1. Clone the repo

```bash
git clone https://github.com/sathwika-dasari/last-seen.git
cd last-seen
```

### 2. Set up Supabase

Create a new Supabase project, then run the following in the SQL editor to create the three tables:

```sql
-- Cases table
create table cases (
  id uuid default gen_random_uuid() primary key,
  photo_url text,
  lat float,
  lng float,
  last_seen_time timestamptz,
  status text default 'pending',
  radius int default 3000,
  alerted_count int default 0,
  created_at timestamptz default now()
);

-- Subscribers table (people who opt in to receive alerts)
create table subscribers (
  id uuid default gen_random_uuid() primary key,
  phone text,
  lat float,
  lng float
);

-- Tips table (anonymous witness sightings)
create table tips (
  id uuid default gen_random_uuid() primary key,
  case_id uuid references cases(id),
  lat float,
  lng float,
  voice_note_url text,
  created_at timestamptz default now()
);
```

Enable Realtime on the `tips` table: go to **Database → Replication** in your Supabase dashboard and toggle on the `tips` table.

Create a Storage bucket named `photos` (public read access).

### 3. Seed test subscribers

For local testing, manually insert your own verified phone numbers into the `subscribers` table:

```sql
insert into subscribers (phone, lat, lng) values
  ('+91XXXXXXXXXX', 17.3850, 78.4867),   -- within 3km of Abids, Hyderabad
  ('+91XXXXXXXXXX', 17.4900, 78.5900);   -- ~15km away, outside default radius
```

### 4. Configure environment variables

**Frontend** — create `frontend/.env`:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_BACKEND_URL=http://localhost:3001
```

**Backend** — create `backend/.env`:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key
TWILIO_ACCOUNT_SID=your-twilio-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_PHONE_NUMBER=+1XXXXXXXXXX
```

> Use the **service role key** (not the anon key) in the backend so it can read the full subscriber list.

### 5. Install dependencies and run

**Backend:**
```bash
cd backend
npm install
node server.js
# Runs on http://localhost:3001
```

**Frontend** (in a new terminal):
```bash
cd frontend
npm install
npm run dev
# Runs on http://localhost:5173
```

---

## Usage Walkthrough

### File a report
Go to `http://localhost:5173/report`, upload a photo, drop a pin on the map where the person was last seen, set the time, and submit. The case is saved with status `pending`.

### Approve the case (Verifier)
Go to `/admin`. You'll see all pending reports. Click **Approve** on a case — this is the only step that fires the SMS alerts.

### What happens on approval
The backend receives the trigger, queries all subscribers, computes the great-circle distance from each subscriber to the case coordinates using the Haversine formula, and sends a Twilio SMS to every subscriber within the 3 km radius. The case status updates to `active` and the real alerted count is stored.

### Receive and respond to an alert
The SMS contains a link like `/alert/:caseId`. Open it on your phone, tap **I think I saw this person**, drop a pin at your sighting location, optionally record a voice note, and submit. The tip is stored with no name or phone number attached.

### Watch the dashboard
The family dashboard at `/dashboard/:caseId` updates the moment a tip comes in — no refresh needed. Supabase Realtime pushes each new tip as a map pin the instant it's inserted into the database. Use **Expand Search Radius** to re-trigger alerts at a wider radius.

---

## The Distance Calculation

All geofencing uses the Haversine formula, run server-side on approval and client-side on the alert card for display:

```
a = sin²(Δlat/2) + cos(lat1) · cos(lat2) · sin²(Δlng/2)
distance = 2 · R · atan2(√a, √(1−a))    where R = 6371 km
```

There is no weighting, no probability scoring, no ML. A subscriber either falls within the radius or they don't. Every decision is a number you can look up in the backend logs.

---

## What's Working vs. What's Still in Progress

**Fully working:**
- Report submission (photo, pin, timestamp → saved as pending)
- Verifier approval/rejection gate with real status transitions
- Haversine-based radius filtering, server-side and client-side
- Real SMS dispatch via Twilio to in-radius subscribers
- Anonymous tip submission with optional 10-second voice note
- Live dashboard updates via Supabase Realtime (no polling)
- Manual radius expansion that re-triggers a wider dispatch

**Known limitations (production TODO):**
- Subscriber registration is manual — there's no in-app opt-in flow yet
- The Admin route has no authentication; it would need a login before real deployment
- Radius expansion re-texts everyone in the new radius, including already-notified subscribers (deduplication not yet implemented)
- "Share with Police" copies tip details for manual forwarding; there's no direct FIR integration yet
- Twilio trial accounts can only SMS pre-verified numbers; a paid account is needed for arbitrary numbers
- The app currently runs as two local processes; no public deployment yet (Vercel + Render would work with no code changes)

---

## Demo Scenarios

**Scenario 1 — End-to-end loop**

Pin dropped near Abids, Hyderabad. One subscriber ~1.2 km away. On approval: subscriber receives a real SMS within seconds, taps the link, drops a pin, submits a tip. Family dashboard map pin and counter update instantly. No page refresh.

**Scenario 2 — Geofencing accuracy**

Two subscribers registered: one ~1.2 km from the pin, one ~15 km away. On approval, only the closer subscriber gets the SMS. Family taps **Expand Search Radius**. The backend re-runs the filter at the wider radius. The previously excluded subscriber receives their first SMS. Both outcomes are explained by a single distance number in the backend logs.

---

## Background

Missing persons statistics from the [National Crime Records Bureau (NCRB), Crime in India 2023](https://ncrb.gov.in), Ministry of Home Affairs. Existing government portal referenced: [trackthemissingchild.gov.in](https://trackthemissingchild.gov.in). Alert system design informed by AMBER Alert / Wireless Emergency Alert (WEA) program documentation.

---

## Contributing

Issues and PRs are welcome. If you're working on subscriber registration, police system integration, or the deduplication logic for radius expansion — those are the highest-priority gaps right now.

---

## License

MIT
