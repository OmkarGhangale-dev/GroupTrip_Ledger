# 🌍 GroupTrip Ledger

> **AI-powered group travel planning, expense management, and smart debt settlement platform.**

GroupTrip Ledger is a full-stack web application that helps friends, families, students, and corporate groups **plan trips, manage itineraries, track bookings, split expenses, calculate balances, and settle debts** from a single platform.

🔗 **GitHub:** https://github.com/OmkarGhangale-dev/GroupTrip_Ledger

---

## 🎯 Problem Statement

Group trips involve multiple people, expenses, bookings, activities, and changing plans.

Different participants may:

* Join different activities
* Share different expenses
* Pay on behalf of others
* Share rooms or transportation
* Join or leave during the trip

Managing all of this using separate apps, spreadsheets, and chat messages creates confusion.

### 💡 Our Solution

GroupTrip Ledger combines **travel planning + AI assistance + maps + itinerary + expenses + settlements + bookings** into one centralized platform.

---

# ✨ Key Features

### 🤖 AI TravelBot

* AI-powered travel recommendations
* Destination and activity suggestions
* Add recommended places directly to itinerary
* Powered by **Groq Cloud API**

### 🗺️ Interactive Map Explorer

* Search destinations and places
* Explore restaurants, hotels and landmarks
* Interactive Leaflet map
* Roadmap, Satellite and Terrain views
* Add places to itinerary

### 🗓️ Itinerary Management

* Day-by-day trip planning
* Add activities, meals, stays and transportation
* Organize the complete trip schedule

### 👥 Participant Management

* Add and manage trip members
* Associate participants with expenses and activities

### 💰 Smart Expense Splitting

Supports:

* Equal split
* Custom amount split
* Percentage split
* Shares-based split

### 🔄 Automatic Debt Settlement

* Calculates individual balances
* Identifies who owes whom
* Generates optimized settlement transactions
* Reduces unnecessary payment transfers

### 🏨 Booking Management

Track:

* Flights
* Hotels
* Activities
* Confirmation details
* Booking status

### 🔐 Authentication

* Google OAuth
* Email/password authentication
* JWT-based authentication
* Secure password hashing

---

# 🏗️ System Architecture

```text
                React Frontend
                     │
                     │ REST API
                     ▼
                FastAPI Backend
                     │
          ┌──────────┼──────────┐
          ▼          ▼          ▼
      PostgreSQL    Groq      Google OAuth
       Database      AI
```

### Complete Workflow

```text
Create Trip
    ↓
Add Participants
    ↓
Explore Destinations
    ↓
Create Itinerary
    ↓
Add Bookings
    ↓
Record Expenses
    ↓
Calculate Balances
    ↓
Generate Settlements
```

---

# 🛠️ Technology Stack

| Category       | Technology              |
| -------------- | ----------------------- |
| Frontend       | React 19                |
| Build Tool     | Vite                    |
| Styling        | Vanilla CSS             |
| HTTP Client    | Axios                   |
| Maps           | Leaflet + React-Leaflet |
| Backend        | Python + FastAPI        |
| ORM            | SQLAlchemy              |
| Database       | PostgreSQL              |
| DB Driver      | asyncpg                 |
| Validation     | Pydantic                |
| Authentication | JWT + Google OAuth      |
| AI             | Groq Cloud              |
| Deployment     | Vercel                  |

---

# 📁 Project Structure

```text
GroupTrip_Ledger/
│
├── api/
│   └── index.py
│
├── app/
│   ├── config.py
│   ├── database.py
│   └── main.py
│
├── database/
│   ├── schema.sql
│   └── migrate_neon.py
│
├── models/
│   ├── user.py
│   ├── trip.py
│   ├── participant.py
│   ├── booking.py
│   ├── expense.py
│   ├── payment.py
│   └── itinerary.py
│
├── routers/
│   ├── auth.py
│   ├── trips.py
│   ├── participants.py
│   ├── bookings.py
│   ├── expenses.py
│   ├── payments.py
│   └── itinerary.py
│
├── schemas/
├── services/
├── utils/
│
├── frontend/
│   └── frontend/
│       ├── src/
│       │   ├── components/
│       │   ├── context/
│       │   ├── views/
│       │   └── services/
│       │       └── api.js
│       ├── package.json
│       └── .env.example
│
├── requirements.txt
├── .env.example
├── vercel.json
└── README.md
```

---

# 🚀 How to Run the Project Locally

## Prerequisites

Install:

* **Python 3.10+**
* **Node.js 18+**
* **npm**
* **PostgreSQL**
* **Git**

---

## 1️⃣ Clone Repository

```bash
git clone https://github.com/OmkarGhangale-dev/GroupTrip_Ledger.git
cd GroupTrip_Ledger
```

---

# 🐍 2️⃣ Backend Setup

Create a virtual environment:

### Windows

```bash
python -m venv venv
venv\Scripts\activate
```

### macOS/Linux

```bash
python3 -m venv venv
source venv/bin/activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

---

# 🗄️ 3️⃣ Configure PostgreSQL

Create a PostgreSQL database:

```bash
createdb -U postgres grouptrip_ledger
```

Or create it manually using pgAdmin.

Apply the database schema:

```bash
psql -U postgres -d grouptrip_ledger -f database/schema.sql
```

---

# 🔑 4️⃣ Configure Backend Environment

Create:

```text
.env
```

in the project root.

Example:

```env
DATABASE_URL=postgresql+asyncpg://postgres:password@localhost:5432/grouptrip_ledger

SECRET_KEY=your_secret_key

GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

GROQ_API_KEY=your_groq_api_key

ALLOWED_ORIGINS=http://localhost:5173
```

Replace the values with your own credentials.

---

# ▶️ 5️⃣ Run Backend

From the **project root**:

```bash
uvicorn app.main:app --reload --port 8000
```

Backend:

```text
http://127.0.0.1:8000
```

Swagger API documentation:

```text
http://127.0.0.1:8000/docs
```

Database health check:

```text
http://127.0.0.1:8000/api/v1/health/db
```

---

# ⚛️ 6️⃣ Frontend Setup

Open a **new terminal**.

Go to the actual frontend directory:

```bash
cd frontend/frontend
```

> ⚠️ **Important:** The frontend is inside `frontend/frontend`, not directly inside `frontend`.

Install dependencies:

```bash
npm install
```

Create:

```text
frontend/frontend/.env
```

Example:

```env
VITE_GOOGLE_CLIENT_ID=your_google_client_id
VITE_GROQ_API_KEY=your_groq_api_key
VITE_API_BASE_URL=
```

---

# ▶️ 7️⃣ Run Frontend

```bash
npm run dev
```

Open:

```text
http://localhost:5173
```

---

# 🖥️ Complete Run Setup

You need **two terminals**.

### Terminal 1 — Backend

```bash
cd GroupTrip_Ledger

venv\Scripts\activate

uvicorn app.main:app --reload --port 8000
```

### Terminal 2 — Frontend

```bash
cd GroupTrip_Ledger/frontend/frontend

npm install

npm run dev
```

Then open:

```text
http://localhost:5173
```

---

# 📡 Main API Modules

The backend provides REST APIs for:

| Module         | Purpose                        |
| -------------- | ------------------------------ |
| Authentication | Login & registration           |
| Trips          | Create/manage trips            |
| Participants   | Manage group members           |
| Itinerary      | Manage daily activities        |
| Expenses       | Record & split expenses        |
| Payments       | Track payments                 |
| Bookings       | Manage travel bookings         |
| Balances       | Calculate member balances      |
| Settlements    | Generate optimized settlements |

---

# 🧮 Expense & Settlement Flow

```text
Expense Added
      ↓
Select Participants
      ↓
Choose Split Method
      ↓
Calculate Individual Shares
      ↓
Calculate Net Balances
      ↓
Identify Debtors & Creditors
      ↓
Generate Optimized Settlements
```

Example:

```text
Rahul → ₹1,500
Aman  → ₹800
Vaibhav → ₹0
```

The system calculates the final balances and determines the required transfers.

---

# 🔐 Security

The project uses:

* JWT authentication
* Google OAuth
* PBKDF2-SHA256 password hashing
* Environment variables for secrets
* PostgreSQL
* Protected API endpoints

> **Never commit `.env` files or API keys to GitHub.**

---

# 🧪 Useful Commands

### Frontend

```bash
npm run dev
```

```bash
npm run build
```

```bash
npm run lint
```

```bash
npm run preview
```

### Backend

```bash
uvicorn app.main:app --reload --port 8000
```

---

# ☁️ Deployment

The project is configured for **Vercel deployment**.

Architecture:

```text
Vercel
 │
 ├── React Frontend
 │
 └── FastAPI Serverless API
          │
          ▼
      PostgreSQL
```

Before deployment, configure all required environment variables in Vercel.

---

# 🔮 Future Enhancements

* 📱 Mobile application
* 💳 Integrated online payments
* 💱 Multi-currency support
* 🔔 Notifications and reminders
* 📊 Advanced expense analytics
* 🧠 AI-generated complete itineraries
* 🚗 Route optimization
* 📄 PDF/CSV expense reports
* 👥 Real-time group collaboration

---

# 👥 Team

**Project:** GroupTrip Ledger
**Type:** Full-Stack AI Travel & Expense Management Platform

### Repository

https://github.com/OmkarGhangale-dev/GroupTrip_Ledger

---

# ⭐ Project Tagline

> **Plan together. Travel together. Spend transparently. Settle effortlessly.**

---

## ❤️ Support

If you find this project useful, consider giving the repository a ⭐ on GitHub.

**GroupTrip Ledger — One trip. One platform. Zero financial confusion.**
