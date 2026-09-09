# 🌍 GroupTrip Ledger

> **The all-in-one AI-powered group travel planner, expense splitter, and interactive Google Maps itinerary ledger.**

GroupTrip Ledger simplifies group travel coordination. From AI-assisted day-by-day itinerary planning and interactive map exploration to automated fair expense splitting, debt settlement, and Google Sign-In, it keeps everyone on the same page.

---

## ✨ Key Features

### 🔐 Google OAuth 2.0 & JWT Authentication
- **One-Tap Google Sign-In:** Sign in instantly using your Google account with token verification via `google-auth`.
- **Email & Password Login:** Standard registration with PBKDF2 SHA-256 salted password hashing.
- **Secure JWT Sessions:** Stateless, secure JSON Web Token authentication for all protected endpoints.

### 🗺️ Interactive Maps Explorer
- **Multi-Layer Map Engine:** Switch seamlessly between **Roadmap** 🗺️, **Satellite** 🛰️, and **Terrain** ⛰️ views.
- **Destination Centering:** Automatically flies to and focuses on your trip's destination (e.g., *Goa*, *Himachal*, *Bali*).
- **Place Search & Autocomplete:** Search for landmarks, restaurants, cafes, and hotels in real time.
- **1-Click Day Scheduling:** Assign discovered locations directly to `Day 1`, `Day 2`, etc., in your itinerary.

### 🤖 TravelBot AI Companion
- **High-Speed LLM Intelligence:** Powered by Groq Cloud API (`llama-3.3-70b-versatile`, `mixtral-8x7b-32768`).
- **Context-Aware Recommendations:** Aware of your trip dates, destination, budget, group size, and current schedule.
- **Interactive Action Cards:** Suggestions feature `➕ Add to Day X` (instantly schedule into itinerary) and `🗺️ Map` (fly to place on map).

### 🗓️ Day-by-Day Itinerary Management
- **Day Filter Tabs:** View `🌟 All Days` or filter by individual days.
- **Categorized Timeline:** Activities (🏛️), Meals (🍽️), Stays (🏨), and Transport (🚌).

### 💰 Smart Expense Splitting & Debt Settlement
- **Flexible Splitting Models:**
  - **Equal** – Split evenly across participants.
  - **Custom** – Exact amounts per person.
  - **Percentage** – Percentage-based distribution (totals 100%).
  - **Shares** – Weighted proportions (couples, families).
- **Minimal Debt Settlement Engine:** Graph-based transaction minimizer computes the lowest number of transfers to settle all group debts.
- **Real-Time Balances:** Live calculation of who owes what and who is owed money.

### 🏨 Bookings & Payments Tracking
- Track flights, hotels, activities, confirmation IDs, and statuses.
- Record settlements, payments, and refunds.

---

## 🛠️ Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 19, Vite 8, Leaflet, React-Leaflet, Axios, Vanilla CSS |
| **Backend** | Python 3.10+, FastAPI, SQLAlchemy 2.0 (Async), Pydantic v2, Uvicorn |
| **Database** | PostgreSQL with `asyncpg` driver (compatible with Neon, Supabase, Vercel Postgres, Local) |
| **Authentication** | Google OAuth 2.0 (`google-auth`), Python-Jose (JWT), PBKDF2 Password Hashing |
| **AI & Maps** | Groq Cloud API, OpenStreetMap / Tile Layer Engine |
| **Deployment** | Vercel (Serverless Python Functions + Static React Bundle) |

---

## 📁 Project Structure

```
GroupTrip_Ledger/
├── api/
│   ├── index.py              # Vercel serverless entrypoint
│   └── requirements.txt      # Python dependencies for Vercel functions
├── app/
│   ├── config.py             # Pydantic Settings & environment variables
│   ├── database.py           # Async SQLAlchemy engine with connection pool & SSL handling
│   └── main.py               # FastAPI application, CORS, & route registration
├── database/
│   ├── schema.sql            # PostgreSQL schema (enums, tables, indices, triggers)
│   └── migrate_neon.py       # Helper script to apply schema to cloud database
├── models/                   # SQLAlchemy ORM models
│   ├── user.py
│   ├── trip.py
│   ├── participant.py
│   ├── booking.py
│   ├── expense.py
│   ├── payment.py
│   └── itinerary.py
├── routers/                  # FastAPI REST API endpoints
│   ├── auth.py               # Google OAuth & email registration/login
│   ├── trips.py
│   ├── participants.py
│   ├── bookings.py
│   ├── expenses.py
│   ├── payments.py
│   └── itinerary.py
├── services/                 # Core business logic
│   ├── auth_service.py       # Google token verification & JWT generation
│   ├── trip_service.py
│   ├── expense_service.py
│   └── payment_service.py
├── frontend/
│   └── frontend/             # Vite + React client
│       ├── src/
│       │   ├── components/   # Navbar, Sidebar, AIChatBot, MapExplorer, Modals
│       │   ├── context/      # TripContext (auth, state, and API client)
│       │   ├── views/        # Dashboard, Itinerary, Expenses, Settlements, Bookings, Login
│       │   └── services/
│       │       └── api.js    # Axios client (auto-detects local dev vs production URL)
│       ├── .env.example      # Frontend env template
│       └── package.json
├── .env.example              # Root environment variable template
├── .gitignore                # Protects secrets (.env) and build artifacts (dist/)
├── requirements.txt          # Python dependencies
├── vercel.json               # Vercel build & serverless rewrite configuration
└── README.md
```

---

## 🔑 Environment Variables & API Keys Setup

GroupTrip Ledger uses two environment files:
1. **Root `.env`** (Backend configuration)
2. **`frontend/frontend/.env`** (Vite frontend configuration)

### 1. PostgreSQL Database (`DATABASE_URL` / `POSTGRES_URL`)

The backend works with any PostgreSQL instance using the `asyncpg` driver:

- **Local PostgreSQL:**
  ```env
  DATABASE_URL=postgresql+asyncpg://postgres:your_password@localhost:5432/grouptrip_ledger
  ```
- **Cloud PostgreSQL (Neon, Supabase, Vercel Postgres):**
  Obtain the connection URI from your cloud console (e.g. Neon.tech or Supabase). Standard `postgres://` or `postgresql://` connection strings are automatically normalized to use `postgresql+asyncpg://`:
  ```env
  DATABASE_URL=postgresql+asyncpg://user:password@ep-xxxx-pooler.region.neon.tech/neondb
  ```

### 2. Google OAuth 2.0 Credentials

To enable Google Sign-In:
1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Create or select a project.
3. Navigate to **APIs & Services** > **Credentials**.
4. Click **Create Credentials** > **OAuth client ID** (Application type: **Web application**).
5. Under **Authorized JavaScript origins**, add:
   - `http://localhost:5173` *(for local Vite dev)*
   - `https://your-vercel-deployment.vercel.app` *(for production)*
6. Copy the **Client ID** and **Client Secret**:
   - Backend `.env`:
     ```env
     GOOGLE_CLIENT_ID=xxxx.apps.googleusercontent.com
     GOOGLE_CLIENT_SECRET=xxxx
     VITE_GOOGLE_CLIENT_ID=xxxx.apps.googleusercontent.com
     ```
   - Frontend `frontend/frontend/.env`:
     ```env
     VITE_GOOGLE_CLIENT_ID=xxxx.apps.googleusercontent.com
     ```

### 3. Groq AI API Key

To power the TravelBot AI assistant:
1. Create a free account at [console.groq.com](https://console.groq.com/).
2. Create an API key under **API Keys**.
3. Add to `.env`:
   ```env
   GROQ_API_KEY=gsk_your_groq_key_here
   VITE_GROQ_API_KEY=gsk_your_groq_key_here
   ```

### 4. JWT Secret Key

Generate a secure random key for signing JWT tokens:
```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```
Set in `.env`:
```env
SECRET_KEY=your_generated_secret_key
```

---

## 🚀 Local Development Setup

### Prerequisites
- **Python 3.10+**
- **Node.js 18+** & `npm`
- **PostgreSQL** (running locally or cloud instance)

---

### Step 1: Clone the Repository

```bash
git clone https://github.com/OmkarGhangale-dev/GroupTrip_Ledger.git
cd GroupTrip_Ledger
```

---

### Step 2: Set Up Database

#### Option A: Local PostgreSQL
```bash
# Create the database
createdb -U postgres grouptrip_ledger

# Run the schema
psql -U postgres -d grouptrip_ledger -f database/schema.sql
```

#### Option B: Cloud PostgreSQL (Neon / Supabase)
Run the migration helper with your cloud database DSN:
```bash
python database/migrate_neon.py "postgresql://user:pass@ep-xxxx.neon.tech/neondb"
```

---

### Step 3: Backend Setup

1. Copy the environment template:
   ```bash
   cp .env.example .env
   ```
2. Open `.env` and set your `DATABASE_URL`, `SECRET_KEY`, and Google OAuth keys.
3. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Start the FastAPI development server:
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```
   - **Backend API:** `http://127.0.0.1:8000`
   - **Interactive API Docs (Swagger):** [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
   - **Database Health Check:** [http://127.0.0.1:8000/api/v1/health/db](http://127.0.0.1:8000/api/v1/health/db)

---

### Step 4: Frontend Setup

1. Open a new terminal and navigate to the frontend folder:
   ```bash
   cd frontend/frontend
   ```
2. Copy the frontend environment template:
   ```bash
   cp .env.example .env
   ```
3. Set your `VITE_GOOGLE_CLIENT_ID` and `VITE_GROQ_API_KEY`.
   *(Leave `VITE_API_BASE_URL` empty to automatically target `http://127.0.0.1:8000` in local dev and relative `/api/v1` in production).*
4. Install packages and start the Vite dev server:
   ```bash
   npm install
   npm run dev
   ```
   - **Frontend App:** [http://localhost:5173](http://localhost:5173)

---

## 🌐 Deploying to Vercel

GroupTrip Ledger is preconfigured for zero-friction Vercel deployment with [vercel.json](file:///c:/Users/Omkar/OneDrive/Desktop/grouptrip_ledger/GroupTrip_Ledger/vercel.json):
- Frontend: Compiled React static assets.
- Backend: Serverless Python functions (`api/index.py`).

### Deployment Steps:

1. Push your code to GitHub.
2. Import your repository into [Vercel](https://vercel.com).
3. In **Project Settings > Environment Variables**, add:
   - `DATABASE_URL` (or `POSTGRES_URL`): Your cloud PostgreSQL URI (e.g. from Neon or Supabase).
   - `SECRET_KEY`: Random 32-character string.
   - `GOOGLE_CLIENT_ID` & `GOOGLE_CLIENT_SECRET`: Your Google OAuth credentials.
   - `VITE_GOOGLE_CLIENT_ID`: Same Google Client ID for the frontend button.
   - `VITE_GROQ_API_KEY`: Your Groq API key.
   - `ALLOWED_ORIGINS`: Your Vercel production URL (e.g., `https://your-app.vercel.app`).
4. Click **Deploy**. Vercel will automatically run `npm run build` and route `/api/*` to the FastAPI backend.

---

## 📡 API Endpoints Overview

| Category | Method | Endpoint | Description |
|---|---|---|---|
| **Auth** | `POST` | `/api/v1/auth/google` | Sign in / register via Google ID token |
| | `POST` | `/api/v1/auth/register` | Register with email & password |
| | `POST` | `/api/v1/auth/login` | Login with email & password |
| | `GET` | `/api/v1/auth/me` | Get currently authenticated user |
| **Trips** | `POST` | `/api/v1/trips/` | Create a new trip |
| | `GET` | `/api/v1/trips/` | List all user trips |
| | `GET` | `/api/v1/trips/{id}` | Get trip details |
| | `PATCH` | `/api/v1/trips/{id}` | Update trip |
| | `DELETE` | `/api/v1/trips/{id}` | Delete trip |
| **Itinerary** | `POST` | `/api/v1/itinerary/` | Add an event to trip itinerary |
| | `GET` | `/api/v1/itinerary/trip/{id}` | Fetch full trip itinerary |
| | `PATCH` | `/api/v1/itinerary/{id}` | Update itinerary event |
| | `DELETE` | `/api/v1/itinerary/{id}` | Remove itinerary event |
| **Expenses** | `POST` | `/api/v1/expenses/` | Record expense with auto-split |
| | `GET` | `/api/v1/expenses/trip/{id}` | List trip expenses |
| | `GET` | `/api/v1/trips/{id}/balances` | Calculate member balances |
| | `GET` | `/api/v1/trips/{id}/settlements`| Optimized debt settlement transactions |
| **Participants**| `POST` | `/api/v1/participants/` | Add member to trip |
| | `GET` | `/api/v1/participants/trip/{id}`| List participants |
| **Bookings** | `POST` | `/api/v1/bookings/` | Record flight/hotel reservation |
| | `GET` | `/api/v1/bookings/trip/{id}` | List bookings for trip |
| **Health** | `GET` | `/api/v1/health` | API service status |
| | `GET` | `/api/v1/health/db` | PostgreSQL connectivity check |

---

## 🔒 Security Best Practices

- **Never commit `.env` files**: All local `.env` and `.env.*` files are excluded by `.gitignore`.
- **Credential Separation**: Public client variables use the `VITE_` prefix, while backend server secrets remain private.
- **Rotate Exposed Secrets**: If any secret was previously committed, regenerate it immediately in Google Cloud Console or your cloud database provider.
- **SSL Enforcement**: Automatic SSL configuration ensures encrypted connections to cloud PostgreSQL instances like Neon or Supabase.

---

## 📄 License
This project is open-source and available under the [MIT License](LICENSE).
