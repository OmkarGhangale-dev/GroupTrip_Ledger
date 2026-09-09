# 🌍 GroupTrip Ledger

> **The all-in-one AI-powered group travel planner, expense splitter, and interactive Google Maps itinerary ledger.**

GroupTrip Ledger simplifies group travel coordination. From AI-assisted day-by-day itinerary planning and real-time Google Maps exploration to automated fair expense splitting and debt settlement, it keeps everyone on the same page.

---

## ✨ Features

### 🗺️ Interactive Google Maps Explorer
- **Google Maps Integration:** Switch seamlessly between **Google Roadmap** 🗺️, **Satellite Hybrid** 🛰️, and **Terrain** ⛰️ views.
- **Trip Destination Focus:** Automatically centers and flies to your trip's destination (e.g. *Uttarakhand*, *Goa*, *Himachal*, etc.).
- **Smart Place Search & Autocomplete:** Search for landmarks, restaurants, cafes, and hotels with live autocomplete.
- **Curated & Nearby Recommendations:** Discover top attractions, viewpoints, local food hotspots, and adventure activities around any selected location.
- **1-Click Day Assignment:** Pick the exact trip day (`Day 1`, `Day 2`, etc.) and time slot directly from the map.

### 🤖 TravelBot AI Travel Companion
- **High-Intelligence AI:** Powered by Groq's high-speed LLM models (`openai/gpt-oss-120b`, `qwen/qwen3.8-27b`).
- **Context-Aware Travel Guide:** Knows your trip dates, destination, budget, group size, and already-planned activities.
- **Interactive Place Recommendation Cards:** Suggests places formatted with direct action buttons:
  - **`➕ Add to Day X`**: Instantly schedules the place in your itinerary without leaving the chat.
  - **`🗺️ Map`**: Automatically navigates to the map tab and centers on the place.
- **Pre-Built Quick Prompts:** Single-click prompts for top tourist spots, food trails, hotel suggestions, and full day-by-day plans.

### 🗓️ Day-by-Day Itinerary Management
- **Day Filter Tabs:** Switch between viewing `🌟 All Days` or focusing on individual days (`Day 1`, `Day 2`, etc.).
- **Timeline Cards:** Chronological scheduling with category emojis (🏛️ Activity, 🍽️ Meal, 🏨 Stay, 🚌 Transport).
- **Manual Event Modal:** Includes quick day-picker pills and 1-click destination recommendations.

### 💰 Smart Expense Splitting & Debt Settlement
- **Flexible Split Methods:**
  - **Equal** – Split evenly across all group members.
  - **Custom** – Exact currency amounts per participant.
  - **Percentage** – Percentage-based distribution (must total 100%).
  - **Shares** – Proportional weighted shares (e.g., couples, kids).
- **Minimal Debt Settlement Engine:** Graph-based settlement algorithm calculates the minimum number of transactions needed to settle all debts.
- **Real-Time Balances:** Instant overview of who is owed money and who needs to pay.

### 🏨 Bookings & Reservations
- Track flights, hotels, activities, and transport with booking references and confirmation statuses.
- Full support for refunds and payment tracking.

---

## 🛠️ Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, Vite, React-Leaflet, Vanilla CSS, Groq AI SDK |
| **Backend** | Python 3.10+, FastAPI, SQLAlchemy 2.0 (Async), Pydantic v2, Uvicorn |
| **Database** | PostgreSQL with `pgcrypto` & `asyncpg` driver |
| **AI / Maps** | Groq Cloud API, Google Maps Tile Engine, OpenStreetMap Nominatim API |

---

## 📁 Project Structure

```
GroupTrip_Ledger/
├── app/
│   ├── config.py             # Pydantic environment configuration
│   ├── database.py           # Async SQLAlchemy engine & session factory
│   └── main.py               # FastAPI application & lifespan setup
├── database/
│   └── schema.sql            # PostgreSQL schema (enums, tables, triggers)
├── models/                   # SQLAlchemy declarative ORM models
│   ├── trip.py
│   ├── participant.py
│   ├── booking.py
│   ├── expense.py            # Expense & ExpenseSplit models
│   ├── payment.py            # Payment, Settlement & Refund models
│   └── itinerary.py          # Itinerary schedule items
├── routers/                  # FastAPI REST API route handlers
│   ├── auth.py
│   ├── trips.py
│   ├── participants.py
│   ├── bookings.py
│   ├── expenses.py
│   ├── payments.py
│   └── itinerary.py
├── services/                 # Core business logic & calculation engines
│   ├── auth_service.py
│   ├── trip_service.py
│   ├── expense_service.py    # Auto-splitting algorithms
│   └── payment_service.py    # Debt simplification & settlements
├── frontend/
│   └── frontend/             # Vite + React client
│       ├── src/
│       │   ├── components/
│       │   │   ├── AIChatBot.jsx     # AI travel guide widget
│       │   │   ├── MapExplorer.jsx   # Google Maps Explorer
│       │   │   ├── Navbar.jsx
│       │   │   ├── Sidebar.jsx
│       │   │   └── modals/           # Creation & edit dialogs
│       │   ├── views/                # Full-page views
│       │   │   ├── DashboardView.jsx
│       │   │   ├── ItineraryView.jsx
│       │   │   ├── ExpensesView.jsx
│       │   │   ├── SettlementsView.jsx
│       │   │   └── BookingsView.jsx
│       │   ├── context/TripContext.jsx # Global app state & API client
│       │   ├── index.css
│       │   └── App.jsx
│       ├── .env.example
│       └── package.json
├── .env                      # Backend environment variables
├── requirements.txt          # Python dependencies
└── README.md
```

---

## 🚀 Quick Start Guide

### Prerequisites
- **Python 3.10+**
- **Node.js 18+** & `npm`
- **PostgreSQL 15+** installed and running

---

### Step 1: Clone the Repository

```bash
git clone https://github.com/OmkarGhangale-dev/GroupTrip_Ledger.git
cd GroupTrip_Ledger
```

---

### Step 2: Database Setup (PostgreSQL)

1. Ensure your PostgreSQL service is running.
2. Open terminal/PowerShell and create the database:
   ```bash
   createdb -U postgres grouptrip_ledger
   ```
3. Apply the database schema:
   ```bash
   psql -U postgres -d grouptrip_ledger -f database/schema.sql
   ```

---

### Step 3: Backend Configuration & Startup

1. Create your `.env` file in the root directory:
   ```env
   # PostgreSQL Connection URL
   DATABASE_URL=postgresql+asyncpg://postgres:YOUR_PASSWORD@localhost:5432/grouptrip_ledger

   # App Settings
   APP_NAME=GroupTrip Ledger
   APP_VERSION=1.0.0
   DEBUG=False

   # Optional API Keys
   GEMINI_API_KEY=
   GOOGLE_MAPS_API_KEY=
   EMAIL_API_KEY=
   ```
   *(Replace `YOUR_PASSWORD` with your PostgreSQL password).*

2. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Start the FastAPI backend server:
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```
   - **Backend API:** `http://127.0.0.1:8000`
   - **Interactive API Docs (Swagger):** [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)

---

### Step 4: Frontend Configuration & Startup

1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd frontend/frontend
   ```

2. Create `.env.local` for Vite:
   ```env
   VITE_GROQ_API_KEY=your_groq_api_key_here
   ```

3. Install npm packages:
   ```bash
   npm install
   ```

4. Run the Vite development server:
   ```bash
   npm run dev
   ```
   - **Web App:** [http://localhost:5173/](http://localhost:5173/)

---

## 📡 API Endpoints Overview

| Category | Method | Endpoint | Description |
|---|---|---|---|
| **Trips** | `POST` | `/api/v1/trips/` | Create a new trip |
| | `GET` | `/api/v1/trips/` | List all user trips |
| | `GET` | `/api/v1/trips/{id}` | Get detailed trip overview |
| | `PATCH` | `/api/v1/trips/{id}` | Update trip metadata |
| | `DELETE` | `/api/v1/trips/{id}` | Delete trip |
| **Itinerary** | `POST` | `/api/v1/itinerary/` | Add an event to itinerary |
| | `GET` | `/api/v1/itinerary/trip/{id}` | Get complete trip schedule |
| | `PATCH` | `/api/v1/itinerary/{id}` | Update event details/day |
| | `DELETE` | `/api/v1/itinerary/{id}` | Remove event |
| **Expenses** | `POST` | `/api/v1/expenses/` | Record expense with auto-split |
| | `GET` | `/api/v1/expenses/trip/{id}` | List trip expenses |
| | `GET` | `/api/v1/trips/{id}/balances` | Calculate net balances per person |
| | `GET` | `/api/v1/trips/{id}/settlements`| Get optimized debt settlement plan |
| **Participants**| `POST` | `/api/v1/participants/` | Add member to trip |
| | `GET` | `/api/v1/participants/trip/{id}`| List participants |
| **Bookings** | `POST` | `/api/v1/bookings/` | Log reservation (flight/hotel) |
| | `GET` | `/api/v1/bookings/trip/{id}` | List trip bookings |

---

## 🔒 Security Best Practices
- Keep your PostgreSQL credentials in `.env` (never commit `.env`).
- Client-side AI keys reside in `.env.local` which is strictly `.gitignore`'d.
- Password hashing using `bcrypt` and token authentication via JWT.

---

## 📄 License
This project is open-source and available under the [MIT License](LICENSE).
