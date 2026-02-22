# FIRE (Freedom Intelligent Routing Engine)

**FIRE** is an intelligent AI-driven routing and analytics system designed to process, analyze, and geographically distribute customer support tickets and client requests. It features a high-density, professional "Bloomberg Terminal V1" aesthetic.

## Финальные метрики по тестам

[notbook](freedom-broker-datasaur-2026-code.ipynb)

* Tickets: 186
* Managers: 102
* Business Units: 15

**Охват клиентов менеджерами: 100.00%** (sanity-check, что все клиенты были распределены)

|    | Офис             |   Среднее расстояние, км |
|---:|:-----------------|-------------------------:|
|  0 | актобе           |                722.997   |
|  1 | кызылорда        |                369.211   |
|  2 | актау            |                279.788   |
|  3 | павлодар         |                197.182   |
|  4 | кокшетау         |                160.682   |
|  5 | уральск          |                155.913   |
|  6 | алматы           |                150.951   |
|  7 | петропавловск    |                149.825   |
|  8 | костанай         |                124.41    |
|  9 | караганда        |                105.426   |
| 10 | атырау           |                 85.3087  |
| 11 | шымкент          |                 75.7876  |
| 12 | усть-каменогорск |                 66.2079  |
| 13 | астана           |                  3.21285 |
| 14 | тараз            |                  1.55725 |

| assigned_office   |   min |   max |     mean |   num_managers |
|:------------------|------:|------:|---------:|---------------:|
| астана            |     1 |     2 |  1.42857 |              7 |
| алматы            |     4 |    13 | 10       |              6 |
| шымкент           |     2 |    15 |  6.6     |              5 |
| актобе            |     1 |     3 |  1.66667 |              3 |
| усть-каменогорск  |     2 |    20 |  8       |              3 |
| костанай          |     4 |     8 |  6       |              3 |
| актау             |     3 |     3 |  3       |              3 |
| павлодар          |     8 |     8 |  8       |              3 |
| кокшетау          |     9 |    20 | 14.5     |              2 |
| атырау            |     2 |     7 |  4.5     |              2 |
| караганда         |     9 |    10 |  9.5     |              2 |
| петропавловск     |     1 |     2 |  1.5     |              2 |
| кызылорда         |     1 |     1 |  1       |              1 |
| уральск           |     3 |     3 |  3       |              1 |
| тараз             |     1 |     1 |  1       |              1 |

## 🚀 Tech Stack

### Frontend (User Interface)
The frontend is a data-dense, real-time analytics dashboard built for professional asset managers.
* **Framework:** React 18 + Vite
* **Styling:** Vanilla CSS + Tailwind CSS (configured for a dark, high-contrast terminal aesthetic)
* **Data Visualization:** Recharts (for analytics and KPI metrics)
* **Interactive Maps:** Leaflet & React-Leaflet (for geographical ticket distribution and manager load balancing)
* **Icons:** Lucide React

### Backend (API & Routing Logic)
The backend is a high-performance Python server that handles AI enrichment and database ORM.
* **Framework:** FastAPI (with Uvicorn ASGI server)
* **Database ORM:** SQLAlchemy
* **Data Validation:** Pydantic
* **AI/LLM Engine:** Google Gemini (Gemini 1.5 Pro) for natural language understanding, tone analysis, and priority scoring.

### Database
* **Provider:** Serverless PostgreSQL on **Neon Database**
* **Schema:** Core business data (read-only Cyrillic tables) joined with an AI enrichment layer (`ticket_enrichment` and `office_enrichment`) for non-destructive metadata augmentation.

---

## 🛠️ Getting Started (Local Development)

To run the FIRE application locally, you need to run both the frontend and backend servers simultaneously.

### 1. Database Setup
Ensure you have a Neon Database connection string. Create a `.env` file in the `backend/` directory and add your database URL, 2GIS API key, and Groq API key:

```env
NEON_DATABASE_URL=postgresql://user:password@ep-name.region.aws.neon.tech/dbname?sslmode=require
API_KEY_2GIS = get from: https://dev.2gis.ru/en/api
GROQ_API_KEY = get from: https://console.groq.com/keys
GEMINI_API_KEY = get from: https://aistudio.google.com 
```

### 2. Backend Server
Navigate to the `backend` directory, install the dependencies, and start the FastAPI server:

```bash
cd backend

# Create and activate a virtual environment (recommended)
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start the Uvicorn server
uvicorn main:app --reload
```
The backend API will be running at `http://127.0.0.1:8000`.

### 3. Frontend Server
Open a **new terminal window**, navigate to the `frontend` directory, install the packages, and start the Vite development server:

```bash
cd frontend

# Install dependencies
npm install

# Start the development server
npm run dev
```
The frontend UI will be running at `http://localhost:5173/`.

---

## 📂 Project Structure Overview

* `/backend/main.py`: The entry point for the FastAPI application.
* `/backend/models.py`: SQLAlchemy ORM models matching the Neon database schema.
* `/backend/routers/`: API endpoints for analytics, tickets, managers, and the AI assistant.
* `/backend/services/ai_service.py`: Integration with Google Gemini for text analysis.
* `/frontend/src/index.css`: Core terminal theme CSS variables.
* `/frontend/tailwind.config.js`: Custom color palette definitions (e.g., `bg-primary`, `accent-gold`).
* `/frontend/src/pages/`: React components for Dashboard, Analytics, Tickets, Managers, User Synthetic Data generation, and Assistant UI.
