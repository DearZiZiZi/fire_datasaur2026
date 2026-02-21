# 🔥 FIRE — Automated Ticket Intelligence & Routing Engine
## AntiGravity Full-Stack Prompt

---

## MISSION

Build **FIRE** — a full-stack web application for Freedom Finance (Freedom Broker). The system ingests customer support tickets from CSV, enriches them via AI (Alibaba Qwen3), applies strict business routing rules, and presents everything in a sleek Bloomberg/Freedom Broker-style admin dashboard — all running locally on `http://localhost:3000`.

---

## DESIGN SYSTEM — Bloomberg Terminal × Freedom Broker

**Color Palette:**
```css
--bg-primary: #0A0E1A        /* deep navy black */
--bg-secondary: #0F1629      /* card background */
--bg-tertiary: #151C35       /* table rows */
--border: #1E2D50            /* subtle borders */
--accent-blue: #2563EB       /* Freedom blue - primary CTA */
--accent-gold: #F59E0B       /* Freedom gold - premium/VIP indicator */
--accent-red: #EF4444        /* negative/urgent */
--accent-green: #10B981      /* positive/resolved */
--accent-orange: #F97316     /* warning/medium priority */
--text-primary: #E2E8F0      /* main text */
--text-secondary: #94A3B8    /* muted text */
--text-muted: #475569         /* very muted */
```

**Typography:**
- Font: `Inter` (headings), `JetBrains Mono` (data/numbers/GUIDs)
- Tables: compact, dense data — Bloomberg style
- Numbers always monospace
- All monetary values in bold

**UI Style Rules:**
- Dark theme ONLY — no light mode
- Thin 1px borders, no shadows — flat terminal aesthetic
- Status badges: pill-shaped, colored borders (not filled backgrounds)
- Subtle hover states: background shifts from --bg-tertiary to --border color
- Animated number counters on dashboard KPIs
- No rounded corners on data tables — sharp edges
- Sidebar: fixed left, 240px wide, dark with icon + label nav
- Header: 48px tall, company logo left, live clock right (update every second)

---

## DATABASE — Supabase PostgreSQL

**Connection:**
```
host: db.cqjkhdwbecpnqazfonud.supabase.co
port: 5432
database: postgres
user: postgres
```
Password is injected via `.env` → `SUPABASE_PASSWORD`

**Full Schema:**

```sql
-- Business Units (offices)
CREATE TABLE IF NOT EXISTS business_units (
  id SERIAL PRIMARY KEY,
  office TEXT UNIQUE NOT NULL,
  address TEXT,
  lat FLOAT,
  lng FLOAT
);

-- Managers
CREATE TABLE IF NOT EXISTS managers (
  id SERIAL PRIMARY KEY,
  full_name TEXT NOT NULL,
  position TEXT NOT NULL CHECK (position IN ('Специалист', 'Ведущий специалист', 'Главный специалист')),
  position_rank INTEGER GENERATED ALWAYS AS (
    CASE position
      WHEN 'Специалист' THEN 1
      WHEN 'Ведущий специалист' THEN 2
      WHEN 'Главный специалист' THEN 3
    END
  ) STORED,
  skills TEXT[] NOT NULL DEFAULT '{}',
  business_unit TEXT REFERENCES business_units(office),
  requests_in_progress INTEGER DEFAULT 0
);

-- Round Robin State (per office)
CREATE TABLE IF NOT EXISTS round_robin_state (
  office TEXT PRIMARY KEY,
  last_manager_id INTEGER REFERENCES managers(id),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tickets
CREATE TABLE IF NOT EXISTS tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_guid TEXT UNIQUE,
  gender TEXT,
  date_of_birth DATE,
  segment TEXT CHECK (segment IN ('Mass', 'VIP', 'Priority')),
  description TEXT,
  attachments TEXT,
  country TEXT,
  region TEXT,
  city TEXT,
  street TEXT,
  house TEXT,

  -- AI Enrichment
  request_type TEXT CHECK (request_type IN (
    'Жалоба', 'Претензия', 'Изменение данных', 'Консультация',
    'Заявка', 'Неисправность приложения', 'Мошенничество', 'Спам'
  )),
  tone TEXT CHECK (tone IN ('Позитивный', 'Нейтральный', 'Негативный')),
  priority_score INTEGER CHECK (priority_score BETWEEN 1 AND 10),
  language TEXT CHECK (language IN ('KZ', 'ENG', 'RU')) DEFAULT 'RU',
  ai_summary TEXT,
  ai_prepared_response TEXT,  -- AI-drafted reply to send to customer
  lat FLOAT,
  lng FLOAT,

  -- Assignment
  assigned_manager_id INTEGER REFERENCES managers(id),
  assigned_office TEXT REFERENCES business_units(office),
  assignment_warning TEXT,  -- if no perfect match was found, explain why

  -- Metadata
  processed_at TIMESTAMP DEFAULT NOW(),
  processing_status TEXT DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processing', 'done', 'error'))
);
```

**Seed the DB on startup** from the real CSVs if tables are empty:
- `business_units.csv` → `business_units` table (geocode each office address via Nominatim)
- `managers.csv` → `managers` table
- `tickets.csv` → `tickets` table (mark as `pending` for processing)

---

## REAL CSV DATA REFERENCE

Use these exact column mappings:

**tickets.csv columns:**
```
GUID клиента → customer_guid
Пол клиента → gender
Дата рождения → date_of_birth
Описание → description
Вложения → attachments
Сегмент клиента → segment
Страна → country
Область → region
Населённый пункт → city
Улица → street
Дом → house
```

**managers.csv columns:**
```
ФИО → full_name
Должность → position
Офис → business_unit
Навыки → skills (parse comma-separated string into array)
Количество обращений в работе → requests_in_progress
```

**business_units.csv columns:**
```
Офис → office
Адрес → address
```

---

## TECH STACK

```
Frontend:  React 18 + Vite + TailwindCSS + Recharts + Leaflet.js
Backend:   FastAPI (Python 3.11)
Database:  PostgreSQL via Supabase (asyncpg + SQLAlchemy async)
AI:        Alibaba Qwen3 (OpenAI-compatible API)
Geocoding: OpenStreetMap Nominatim (free, no key)
Misc:      pandas, httpx, python-dotenv, uvicorn
Server:    localhost:8000 (API), localhost:3000 (UI)
```

---

## BACKEND — FastAPI

### Project structure:
```
backend/
  main.py              ← FastAPI app, startup, CORS
  database.py          ← Supabase connection (asyncpg)
  models.py            ← SQLAlchemy ORM models
  schemas.py           ← Pydantic schemas
  routers/
    tickets.py         ← CRUD + upload endpoint
    managers.py        ← Manager CRUD
    analytics.py       ← Aggregated stats
    assistant.py       ← AI chat (Star Task)
    synthetic.py       ← Synthetic data generator
  services/
    ai_service.py      ← Qwen3 enrichment
    geo_service.py     ← Nominatim geocoding
    distribution.py    ← Business rules engine
    pipeline.py        ← Full processing pipeline
  seed.py              ← CSV → DB seeder
```

### API Endpoints:

```
# Tickets
GET    /api/tickets                → paginated list with filters
GET    /api/tickets/{id}           → ticket detail with full AI data
POST   /api/tickets/upload         → upload CSV, trigger pipeline
POST   /api/tickets/process-all    → re-process all pending tickets
GET    /api/tickets/stream-status  → SSE: live processing updates

# Managers  
GET    /api/managers               → list with current load
GET    /api/managers/{id}/tickets  → tickets assigned to manager

# Analytics
GET    /api/analytics/overview     → KPI cards data
GET    /api/analytics/by-type      → request types distribution
GET    /api/analytics/by-city      → tickets per city
GET    /api/analytics/by-tone      → tone breakdown
GET    /api/analytics/workload     → manager load comparison
GET    /api/analytics/priority     → priority distribution

# AI Assistant (Star Task ⭐)
POST   /api/assistant/query        → NL query → chart data

# Synthetic Data
POST   /api/synthetic/generate     → body: {count: 30}
```

---

## AI SERVICE — Qwen3 Integration

### System Prompt for ticket enrichment:

```python
SYSTEM_PROMPT = """
You are an expert customer support analyst for Freedom Broker (Freedom Finance Kazakhstan) — a premium financial brokerage.

Analyze the customer request and return ONLY a valid JSON object with NO markdown, NO explanation, NO extra text.

CLASSIFICATION RULES:

request_type — choose ONE:
- "Жалоба" → customer expresses dissatisfaction or complains about any issue (no financial claim, just frustration/anger/negative experience)
- "Претензия" → customer demands compensation, refund, or return of money (negative + financial claim)
- "Изменение данных" → customer wants to change personal data (phone, email, ID, password reset initiated by user)
- "Консультация" → customer asks a question, seeks information or advice
- "Заявка" → customer submits a formal request or application (e.g., open account, new feature)
- "Неисправность приложения" → app crash, login error, SMS not received, technical malfunction
- "Мошенничество" → customer reports or suspects fraud, phishing, unauthorized access, fake representatives
- "Спам" → message is unsolicited advertising, mass mailing, promotional content completely unrelated to customer support

IMPORTANT DISTINCTION:
- Жалоба: "Вы не имеете права!" / "Это возмутительно!" — but no money demand
- Претензия: "Верните мои деньги!" / "Я на вас в суд подам!" — financial claim

tone — choose ONE:
- "Позитивный" → polite, grateful, friendly, neutral question
- "Нейтральный" → matter-of-fact, neither positive nor negative
- "Негативный" → frustrated, angry, threatening, demanding, rude

priority_score — integer 1-10:
- 9-10: fraud/mошенничество, legal threats, urgent financial loss (Претензия)
- 7-8: account blocked, cannot access money, VIP/Priority clients
- 5-6: technical issues affecting access (password, SMS), data changes
- 3-4: general consultations, non-urgent questions
- 1-2: spam, promotional content, very low urgency

language — detect the PRIMARY language of the request:
- "KZ" → Kazakh (Cyrillic or Latin)
- "ENG" → English
- "RU" → Russian (default if unclear or mixed)

ai_summary — 2 sentences MAX:
1. What the customer wants/problem
2. Recommended action for the manager

ai_prepared_response — Draft a professional response in the SAME LANGUAGE as the request. It should:
- Be warm and professional (Freedom Broker brand tone)
- Address the specific issue
- Include placeholder [SOLUTION/INFO] where manager should fill in details
- Be 3-5 sentences
- Start with "Уважаемый(-ая) клиент," or "Dear Customer," or "Құрметті клиент," based on language

Return EXACTLY this JSON structure:
{
  "request_type": "...",
  "tone": "...",
  "priority_score": 0,
  "language": "...",
  "ai_summary": "...",
  "ai_prepared_response": "..."
}
"""
```

### Retry logic:
- On JSON parse failure → retry once with `temperature=0`
- On timeout → mark ticket as `error`, continue pipeline

---

## GEO SERVICE

```python
# geo_service.py
# Cache geocoding results in memory dict: {city+street → (lat, lng)}
# Nominatim endpoint: https://nominatim.openstreetmap.org/search
# User-Agent: "FIRE-SmartDesk/1.0 (freedom-broker-hackathon)"
# Rate limit: 1 req/sec max

async def geocode_ticket(country, region, city, street, house) → (lat, lng) | (None, None):
    # Try full address first
    # Fallback: city + region only
    # Fallback: city + country only
    # If all fail: return (None, None)

def haversine_km(lat1, lon1, lat2, lon2) → float:
    # Standard haversine formula

def find_nearest_office(ticket_lat, ticket_lng, offices: list) → office_name:
    # Returns office with minimum haversine distance
```

---

## 🎯 DISTRIBUTION ENGINE — Business Rules (CRITICAL — 40% of grade)

```python
# distribution.py

"""
POSITION HIERARCHY (важно для фильтрации):
Специалист (rank 1) < Ведущий специалист (rank 2) < Главный специалист (rank 3)

DISTRIBUTION CASCADE:
"""

async def assign_ticket(ticket, all_managers, offices) → (manager, office, warning):

    # ══════════════════════════════════════════
    # STEP 1: GEOGRAPHIC FILTER → find target office
    # ══════════════════════════════════════════
    
    if ticket.lat and ticket.lng and ticket.country in ['Казахстан', 'Kazakhstan', 'KZ']:
        # Find nearest office by haversine distance
        target_office = find_nearest_office(ticket.lat, ticket.lng, offices)
    else:
        # Unknown address OR foreign country → 50/50 between Астана and Алматы
        # Use alternating counter stored in DB (round robin between the two)
        target_office = get_foreign_office_rr()  # alternates Астана ↔ Алматы
    
    # ══════════════════════════════════════════
    # STEP 2: COMPETENCE FILTER (Hard Skills — NON-NEGOTIABLE)
    # ══════════════════════════════════════════
    
    # Start with all managers in target office
    eligible = [m for m in all_managers if m.business_unit == target_office]
    
    # Filter 2a: VIP/Priority segment → must have "VIP" skill
    if ticket.segment in ['VIP', 'Priority']:
        eligible = [m for m in eligible if 'VIP' in m.skills]
    
    # Filter 2b: "Изменение данных" → ONLY Главный специалист (rank 3)
    if ticket.request_type == 'Изменение данных':
        eligible = [m for m in eligible if m.position == 'Главный специалист']
    
    # Filter 2c: Language
    if ticket.language == 'KZ':
        eligible = [m for m in eligible if 'KZ' in m.skills]
    elif ticket.language == 'ENG':
        eligible = [m for m in eligible if 'ENG' in m.skills]
    # RU: no filter needed (all managers speak Russian)
    
    # ══════════════════════════════════════════
    # STEP 3: ROUND ROBIN — Two Lowest Load
    # ══════════════════════════════════════════
    
    """
    ALGORITHM:
    1. Sort eligible managers by requests_in_progress ASC
    2. Take top 2 (the two most free managers)
    3. Check round_robin_state for this office → who was assigned LAST
    4. Assign to the OTHER one (the one who was NOT assigned last)
    5. If last_assigned was neither of the top 2 → assign to the one with fewer requests
    6. Update round_robin_state with newly assigned manager
    7. Increment assigned manager's requests_in_progress by 1
    
    EXAMPLE:
    Managers sorted by load: A(1), B(3), C(3), D(5)...
    Top 2: A and B
    last_assigned = B → assign to A
    Next call: re-sort → A(2), B(3), C(3) → top 2: A and B → last=A → assign to B
    After: A(2), B(4) → next top 2: A(2) and C(3) → new pair...
    Load keeps equalizing naturally.
    """
    
    if not eligible:
        # FALLBACK: no eligible manager found
        # Expand search to ANY manager in office (without skill filters)
        fallback = sorted(
            [m for m in all_managers if m.business_unit == target_office],
            key=lambda m: m.requests_in_progress
        )
        if fallback:
            assigned = fallback[0]
            warning = f"Назначен без полного соответствия навыков. Причина: нет менеджера с [{get_required_skills(ticket)}] в офисе {target_office}"
        else:
            # Ultimate fallback: Астана or Алматы, least loaded
            assigned = sorted(all_managers, key=lambda m: m.requests_in_progress)[0]
            warning = f"Офис {target_office} не имеет менеджеров. Назначен в {assigned.business_unit}"
    else:
        eligible.sort(key=lambda m: m.requests_in_progress)
        top_two = eligible[:2]
        assigned = round_robin_pick(top_two, target_office)
        warning = None
    
    # Persist: increment load, update RR state
    await update_manager_load(assigned.id, +1)
    await update_round_robin_state(target_office, assigned.id)
    
    return assigned, target_office, warning
```

---

## PROCESSING PIPELINE

```python
# pipeline.py — process single ticket end-to-end

async def process_ticket(ticket_id: str):
    ticket = await get_ticket(ticket_id)
    await set_status(ticket_id, 'processing')
    
    try:
        # 1. Geocode (with caching)
        lat, lng = await geocode_ticket(ticket.country, ticket.region, ticket.city, ticket.street, ticket.house)
        
        # 2. AI Enrichment (Qwen3) — run in parallel with geocoding when possible
        ai_result = await enrich_with_ai(ticket.description, ticket.segment)
        # Returns: request_type, tone, priority_score, language, ai_summary, ai_prepared_response
        
        # 3. Distribution
        managers = await get_all_managers()
        offices = await get_all_offices()
        assigned_manager, office, warning = await assign_ticket(
            {**ticket, 'lat': lat, 'lng': lng, 'request_type': ai_result.request_type, 
             'language': ai_result.language, 'segment': ticket.segment},
            managers, offices
        )
        
        # 4. Save everything
        await update_ticket(ticket_id, {
            'lat': lat, 'lng': lng,
            **ai_result,
            'assigned_manager_id': assigned_manager.id,
            'assigned_office': office,
            'assignment_warning': warning,
            'processing_status': 'done',
            'processed_at': datetime.utcnow()
        })
        
        # 5. Emit SSE event
        await sse_broadcast({'ticket_id': ticket_id, 'status': 'done', 'manager': assigned_manager.full_name})
        
    except Exception as e:
        await set_status(ticket_id, 'error')
        await sse_broadcast({'ticket_id': ticket_id, 'status': 'error', 'error': str(e)})

# Process ALL pending tickets concurrently in batches of 5
async def process_all_pending(batch_size=5):
    pending = await get_pending_tickets()
    for i in range(0, len(pending), batch_size):
        batch = pending[i:i+batch_size]
        await asyncio.gather(*[process_ticket(t.id) for t in batch])
```

**Target: < 10 seconds per ticket**

---

## FRONTEND — React Dashboard

### App Structure:
```
frontend/src/
  App.jsx               ← Router setup
  components/
    Layout.jsx          ← Sidebar + Header
    Sidebar.jsx
    Header.jsx          ← "FIRE" logo + live clock
  pages/
    Dashboard.jsx       ← KPI overview (landing page)
    Tickets.jsx         ← Full ticket table
    TicketDetail.jsx    ← Ticket modal/drawer
    Managers.jsx        ← Manager cards + workload
    Analytics.jsx       ← Charts page
    Assistant.jsx       ← AI chat (Star Task)
    Synthetic.jsx       ← Synthetic data generator
  hooks/
    useSSE.js           ← Server-Sent Events hook
    useTickets.js
  utils/
    formatters.js       ← date, currency, GUID shortener
```

---

### PAGE 1: Dashboard (`/`) — Admin Overview Panel

**Top KPI Bar** (4 cards, animated number counters):
```
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│ TOTAL TICKETS   │ │  PROCESSED      │ │  AVG PRIORITY   │ │  PENDING        │
│    [count]      │ │   [count] ✓     │ │    [x.x]/10     │ │   [count] ⟳     │
│  [+X today]     │ │  [XX% rate]     │ │  [trend arrow]  │ │  [process all]  │
└─────────────────┘ └─────────────────┘ └─────────────────┘ └─────────────────┘
```

**Middle Row** (3 panels):
- Left: Mini bar chart — Request types breakdown (top 5)
- Center: Office load heatmap — each office with ticket count + manager count
- Right: Top 5 urgent tickets — compact list, red priority badges, click to open

**Bottom Row:**
- Live activity feed: SSE stream — "Ticket #GUID assigned to Менеджер 22 (Астана)" — scrolling log
- Tone gauge: Positive / Neutral / Negative percentage donut

**"🚀 Process All Pending" button** — triggers batch pipeline, shows live progress bar

---

### PAGE 2: Tickets Table (`/tickets`)

**Filters bar** (horizontal, above table):
```
[Search by GUID/description] [Segment: All/Mass/VIP/Priority] [Type] [Tone] [Office] [Priority: 1-10 slider] [Status] [Reset]
```

**Table columns:**
```
# | GUID | Segment | Type | Tone | Priority | Language | Office | Manager | Status | Actions
```

**Column styling:**
- `#` — row number, muted
- `GUID` — monospace font, shortened to first 8 chars, hover shows full
- `Segment` — pill badge: VIP=gold border, Priority=blue border, Mass=gray border
- `Type` — colored text
- `Tone` — colored dot + text: 🟢 Позитивный / 🟡 Нейтральный / 🔴 Негативный
- `Priority` — numeric + color bar (1-3 green, 4-6 yellow, 7-8 orange, 9-10 red)
- `Language` — flag emoji: 🇰🇿 KZ / 🇬🇧 ENG / 🇷🇺 RU
- `Status` — pill: pending=gray, processing=blue pulsing, done=green, error=red
- `Actions` — eye icon → open detail drawer

**Click row** → opens right-side **Ticket Detail Drawer** (full width side panel, not modal)

---

### TICKET DETAIL DRAWER

Layout (top to bottom):

**Header:** GUID (monospace) | Segment badge | Status pill | Processed at timestamp

**Section 1 — Customer Info:**
```
Gender  |  Date of Birth  |  Age (calculated)
Country → Region → City → Street, House
```

**Section 2 — AI Analysis Card** (slightly highlighted border, --accent-blue):
```
┌─ 🤖 AI ANALYSIS ───────────────────────────────────────────┐
│  Type: [badge]    Tone: [colored]    Priority: [X/10 bar]  │
│  Language: [flag] [language name]                           │
│                                                             │
│  📋 SUMMARY                                                 │
│  [ai_summary text]                                          │
│                                                             │
│  ✉️ PREPARED RESPONSE (ready to send)                       │
│  [ai_prepared_response — in styled quote box]               │
│  [Copy to clipboard button]                                 │
└─────────────────────────────────────────────────────────────┘
```

**Section 3 — Assignment Chain** (visual flow):
```
[Customer Card] ──→ [AI Processing Box] ──→ [Office Badge] ──→ [Manager Card]
  City, Segment      type/tone/priority      nearest office     name, position
```
If `assignment_warning` exists → show yellow warning banner below chain

**Section 4 — Map** (Leaflet.js, 250px tall):
- Customer location pin (blue)
- Assigned office pin (gold)
- Line connecting them with distance label
- If no coords → "Address could not be geocoded" placeholder

**Section 5 — Original Message:**
- Full description text in monospace card
- Attachment filename if present

---

### PAGE 3: Managers (`/managers`)

**Layout:** Grid of manager cards (3 per row)

**Each card:**
```
┌─────────────────────────────────────┐
│  Менеджер 22          [Астана] 🏢   │
│  Главный специалист   ⭐⭐⭐          │
│  Skills: [VIP] [ENG] [KZ]           │
│                                     │
│  Workload:  ████████░░  4/10        │
│  [View Tickets]                     │
└─────────────────────────────────────┘
```

Position rank shown as stars: Специалист=⭐, Ведущий=⭐⭐, Главный=⭐⭐⭐

Workload bar color: <30% green, 30-60% yellow, 60-80% orange, >80% red

Click "View Tickets" → filtered table showing that manager's assigned tickets

**Top bar:** Sort by [Name / Load ASC / Load DESC / Office] + Office filter

---

### PAGE 4: Analytics (`/analytics`)

All charts use **Recharts** with the dark color palette.

Charts:
1. **Request Types — Horizontal Bar Chart** (sorted by count)
2. **Tone Distribution — Donut Chart** (green/yellow/red)
3. **Tickets by City — Vertical Bar Chart** (top 10 cities)
4. **Priority Heatmap — Histogram** (1-10 distribution)
5. **Manager Workload — Horizontal Bar Chart** (all managers, sorted)
6. **Language Distribution — Pie Chart**
7. **Segment Breakdown — Stacked Bar** (per office)

Each chart: Bloomberg-style dark background, minimal gridlines, white axis labels

---

### PAGE 5: AI Assistant (`/assistant`) — ⭐ STAR TASK

**Chat interface:**
```
┌─ 🤖 FIRE Intelligence Assistant ────────────────────────────────┐
│                                                                  │
│  [System]: Connected to FIRE database. Ask me anything.         │
│                                                                  │
│  Example queries:                                               │
│  • "Покажи распределение типов обращений по городам"           │
│  • "Какой менеджер имеет больше всего VIP тикетов?"            │
│  • "Динамика приоритетов по офисам"                            │
│  • "Show tone breakdown for Almaty office"                      │
│                                                                 │
│  [User input message...............] [Send]                     │
└─────────────────────────────────────────────────────────────────┘

Response renders BELOW input:
- Chart (Recharts) rendered from AI-returned data
- Insight text (1-2 sentences)
- Collapsible "How I analyzed this" section
```

**Backend AI Assistant Prompt:**
```python
ASSISTANT_SYSTEM = """
You are FIRE Intelligence — an analytics AI for Freedom Broker's ticket system.
You have access to aggregated statistics from the database.

When given a natural language query, return ONLY valid JSON (no markdown):
{
  "chart_type": "bar" | "horizontal_bar" | "pie" | "line" | "donut" | "table",
  "title": "Chart title in the query language",
  "data": [{"name": "...", "value": 0}, ...],
  "x_axis_label": "...",
  "y_axis_label": "...",
  "insight": "1-2 sentence insight in the same language as the query"
}

Available data context:
{stats_json}

If the query cannot be answered from available data, return:
{"error": "explanation of what data is missing"}
"""
```

---

### PAGE 6: Synthetic Data Generator (`/synthetic`)

**UI:**
```
┌─ 🧪 SYNTHETIC DATA GENERATOR ──────────────────────────────────┐
│                                                                  │
│  Generate test tickets to validate the distribution engine      │
│                                                                  │
│  Count: [____30____]   Seed: [random]                          │
│                                                                  │
│  Distribution settings:                                         │
│  Segments:  Mass [60%]  VIP [25%]  Priority [15%]              │
│  Languages: RU [60%]   KZ [25%]   ENG [15%]                   │
│  Cities:    [All 15 KZ cities] + [5% foreign]                  │
│                                                                  │
│  Edge cases to include:                                         │
│  ☑ VIP + KZ language (tests combined filter)                   │
│  ☑ Изменение данных requests (tests Chief Specialist filter)   │
│  ☑ Foreign addresses (tests 50/50 Astana/Almaty fallback)      │
│  ☑ Missing addresses (tests geocoding fallback)                │
│  ☑ Мошенничество (high priority edge case)                     │
│                                                                  │
│  [🚀 Generate & Process]                                        │
│                                                                  │
│  [Results table appears here after generation]                  │
└─────────────────────────────────────────────────────────────────┘
```

**Synthetic data must include realistic Kazakh content:**
- Russian descriptions: "Не могу войти в приложение...", "Верните деньги!"
- Kazakh descriptions: "Менде есептік жазба бұғатталған..."
- English descriptions: "I cannot access my account...", "Please help..."
- Mix of real Kazakhstan cities from business_units.csv
- Some foreign countries: Russia, Ukraine, Azerbaijan (→ triggers foreign fallback)

---

## SIDEBAR NAVIGATION

```
🔥 FIRE                          ← logo/brand

  [📊] Dashboard
  [🎫] Tickets              [count badge]
  [👥] Managers
  [📈] Analytics
  [🤖] AI Assistant
  [🧪] Synthetic Data

  ─────────────────
  [⚙️] Settings
```

---

## HEADER

```
🔥 FIRE — Freedom Broker Ticket Intelligence          [🕐 14:23:07 | Sat 21 Feb]
```
Clock updates every second. Right side shows live processing status if pipeline is running.

---

## STARTUP BEHAVIOR

On first launch (`npm run dev` + `uvicorn main:app --reload`):

1. Backend connects to Supabase
2. Runs schema migration (CREATE TABLE IF NOT EXISTS)
3. Checks if tables are empty → seeds from CSV files
4. Geocodes all business unit offices (15 offices in Kazakhstan)
5. Starts FastAPI server on port 8000
6. Frontend starts on port 3000
7. User lands on Dashboard — sees imported tickets in `pending` status
8. User clicks "🚀 Process All Pending" → pipeline runs, updates in real-time via SSE
9. After processing: all tickets enriched + assigned, analytics populated

---

## .ENV FILE

```env
# Supabase
SUPABASE_HOST=db.cqjkhdwbecpnqazfonud.supabase.co
SUPABASE_PORT=5432
SUPABASE_DB=postgres
SUPABASE_USER=postgres
SUPABASE_PASSWORD=your_password_here

# Qwen3 (Alibaba Cloud)
QWEN_API_KEY=your_qwen_key_here
QWEN_BASE_URL=https://dashscope-intl.aliyuncs.com/compatible-mode/v1
QWEN_MODEL=qwen3-235b-a22b

# App
FRONTEND_URL=http://localhost:3000
BACKEND_URL=http://localhost:8000
```

---

## QUICK START COMMANDS

```bash
# Backend
cd backend
pip install fastapi uvicorn asyncpg sqlalchemy pandas httpx python-dotenv
uvicorn main:app --reload --port 8000

# Frontend  
cd frontend
npm create vite@latest . --template react
npm install tailwindcss recharts leaflet react-leaflet react-router-dom axios
npm run dev
```

---

## CRITICAL BUSINESS RULES CHECKLIST (40% of grade)

When testing, VERIFY these exact scenarios work correctly:

| Scenario | Expected behavior |
|---|---|
| VIP client, any language | Only managers with `VIP` skill |
| Priority client, KZ language | Manager must have both `VIP` AND `KZ` skills |
| "Изменение данных" request | ONLY `Главный специалист` (rank 3) |
| "Изменение данных" + VIP | `Главный специалист` AND `VIP` skill both required |
| ENG request, Mass segment | Any manager with `ENG` skill |
| Foreign client (Ukraine, Russia) | 50/50 alternating between Астана and Алматы |
| Missing address | Same 50/50 fallback |
| Round Robin: A(1), B(3), C(3) | 1st ticket → A (then re-sort → A becomes least free later) |
| No eligible manager found | Assign fallback + show `assignment_warning` |

---

## NOTES & GOTCHAS

- Жалоба ≠ Претензия: Жалоба is emotional frustration. Претензия requires a financial claim / refund demand
- Position hierarchy matters only for "Изменение данных" filter (Главный специалист only)
- Round Robin operates on the TWO lowest-loaded eligible managers, then alternates between them
- After each ticket assignment, re-evaluate the top two (they may change)
- Nominatim: 1 request/second max — use caching aggressively
- Some tickets have empty descriptions but have attachments — classify as "Заявка" by default
- Language detection: `"Men ruyxatdan utolmayapman"` → likely Uzbek/KZ — classify as KZ
- Mixed language messages (RU + KZ) → use the dominant language

---

*FIRE — Built for Freedom Broker Hackathon | Powered by Qwen3 + Supabase*
