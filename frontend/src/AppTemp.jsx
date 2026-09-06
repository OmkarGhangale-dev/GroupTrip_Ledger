import { useEffect, useState } from "react";
import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";

const API_URL = "http://127.0.0.1:8000/api/v1";

function App() {
  const [trips, setTrips] = useState([]);
  const [currentTrip, setCurrentTrip] = useState(null);

  const [participants, setParticipants] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [bookings, setBookings] = useState([]);

  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  // --------------------------------------------------
  // LOAD TRIPS
  // --------------------------------------------------

  const loadTrips = async () => {
    try {
      setLoading(true);
      setMessage("");

      const response = await fetch(`${API_URL}/trips/?skip=0&limit=100`);

      if (!response.ok) {
        throw new Error(`Trips API returned ${response.status}`);
      }

      const data = await response.json();

      setTrips(data);

      // Use the first trip returned by backend
      if (data.length > 0) {
        setCurrentTrip(data[0]);
      } else {
        setCurrentTrip(null);
      }
    } catch (error) {
      console.error("Error loading trips:", error);
      setMessage("Could not connect to the backend.");
    } finally {
      setLoading(false);
    }
  };

  // --------------------------------------------------
  // LOAD PARTICIPANTS
  // --------------------------------------------------

  const loadParticipants = async (tripId) => {
    try {
      const response = await fetch(
        `${API_URL}/participants/trip/${tripId}`
      );

      if (!response.ok) {
        console.error(
          "Participants API error:",
          response.status
        );
        setParticipants([]);
        return;
      }

      const data = await response.json();
      setParticipants(data);
    } catch (error) {
      console.error("Participants error:", error);
      setParticipants([]);
    }
  };

  // --------------------------------------------------
  // LOAD EXPENSES
  // --------------------------------------------------

  const loadExpenses = async (tripId) => {
    try {
      const response = await fetch(
        `${API_URL}/expenses/trip/${tripId}`
      );

      if (!response.ok) {
        console.error(
          "Expenses API error:",
          response.status
        );
        setExpenses([]);
        return;
      }

      const data = await response.json();
      setExpenses(data);
    } catch (error) {
      console.error("Expenses error:", error);
      setExpenses([]);
    }
  };

  // --------------------------------------------------
  // LOAD BOOKINGS
  // --------------------------------------------------

  const loadBookings = async (tripId) => {
    try {
      const response = await fetch(
        `${API_URL}/bookings/trip/${tripId}`
      );

      if (!response.ok) {
        console.error(
          "Bookings API error:",
          response.status
        );
        setBookings([]);
        return;
      }

      const data = await response.json();
      setBookings(data);
    } catch (error) {
      console.error("Bookings error:", error);
      setBookings([]);
    }
  };

  // --------------------------------------------------
  // LOAD EVERYTHING
  // --------------------------------------------------

  useEffect(() => {
    loadTrips();
  }, []);

  useEffect(() => {
    if (!currentTrip?.id) {
      setParticipants([]);
      setExpenses([]);
      setBookings([]);
      return;
    }

    loadParticipants(currentTrip.id);
    loadExpenses(currentTrip.id);
    loadBookings(currentTrip.id);
  }, [currentTrip]);

  // --------------------------------------------------
  // CALCULATE TOTAL EXPENSES
  // --------------------------------------------------

  const totalExpenses = expenses.reduce(
    (total, expense) => {
      return total + Number(expense.amount || 0);
    },
    0
  );

  // --------------------------------------------------
  // CREATE TRIP
  // --------------------------------------------------

  const createTrip = async () => {
    const name = window.prompt(
      "Enter trip name:",
      "Goa Trip"
    );

    if (!name) return;

    const destination = window.prompt(
      "Enter destination:",
      "Goa"
    );

    if (!destination) return;

    try {
      const response = await fetch(`${API_URL}/trips/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name,
          destination: destination,
          description: "Hackathon group trip",
          start_date: "2026-09-10",
          end_date: "2026-09-14",
          currency: "INR",
          budget: 50000,
          status: "planning",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error("Create trip error:", data);
        alert("Could not create trip. Check backend.");
        return;
      }

      alert("Trip created successfully!");

      // Reload trips
      await loadTrips();

      // Make newly created trip the active one
      setCurrentTrip(data);
    } catch (error) {
      console.error("Create trip error:", error);
      alert("Backend connection failed.");
    }
  };

  // --------------------------------------------------
  // FORMAT MONEY
  // --------------------------------------------------

  const money = (value) => {
    return `₹${Number(value || 0).toLocaleString("en-IN")}`;
  };

  // --------------------------------------------------
  // UI
  // --------------------------------------------------

  return (
    <div className="app">
      <Sidebar />

      <div className="main-content">
        <Navbar />

        <main className="page-content">

          {/* PAGE HEADER */}

          <div className="page-header">
            <div>
              <p className="page-label">TRIP OVERVIEW</p>

              <h1>Dashboard</h1>

              <p className="page-description">
                Welcome back. Here's what's happening with your trip.
              </p>

              {currentTrip && (
                <div
                  style={{
                    marginTop: "12px",
                    fontSize: "15px",
                    color: "#666",
                  }}
                >
                  <strong>{currentTrip.name}</strong>
                  {" • "}
                  {currentTrip.destination}
                </div>
              )}

              {message && (
                <div
                  style={{
                    marginTop: "12px",
                    padding: "10px 14px",
                    background: "#ffecec",
                    color: "#b00020",
                    borderRadius: "8px",
                  }}
                >
                  {message}
                </div>
              )}
            </div>

            <button
              className="create-trip-button"
              onClick={createTrip}
            >
              + Create Trip
            </button>
          </div>

          {/* LOADING */}

          {loading && (
            <div
              style={{
                padding: "20px",
                textAlign: "center",
              }}
            >
              Loading trip data...
            </div>
          )}

          {/* STATS */}

          {!loading && (
            <section className="stats-grid">

              {/* TOTAL EXPENSES */}

              <div className="stat-card">
                <div className="stat-card-top">
                  <span>Total Expenses</span>

                  <span className="stat-icon">
                    ₹
                  </span>
                </div>

                <h2>{money(totalExpenses)}</h2>

                <p>
                  Across your trip
                </p>
              </div>

              {/* PARTICIPANTS */}

              <div className="stat-card">
                <div className="stat-card-top">
                  <span>Participants</span>

                  <span className="stat-icon">
                    👥
                  </span>
                </div>

                <h2>{participants.length}</h2>

                <p>
                  People in your trip
                </p>
              </div>

              {/* BOOKINGS */}

              <div className="stat-card">
                <div className="stat-card-top">
                  <span>Bookings</span>

                  <span className="stat-icon">
                    📅
                  </span>
                </div>

                <h2>{bookings.length}</h2>

                <p>
                  Trip bookings
                </p>
              </div>

              {/* BUDGET */}

              <div className="stat-card">
                <div className="stat-card-top">
                  <span>Trip Budget</span>

                  <span className="stat-icon">
                    💰
                  </span>
                </div>

                <h2>
                  {money(currentTrip?.budget)}
                </h2>

                <p>
                  Planned trip budget
                </p>
              </div>

            </section>
          )}

          {/* LOWER CARDS */}

          <div
            className="dashboard-grid"
            style={{
              marginTop: "30px",
            }}
          >

            {/* RECENT EXPENSES */}

            <section className="dashboard-card">

              <div className="card-header">
                <div>
                  <h3>Recent Expenses</h3>

                  <p>
                    Your latest trip expenses
                  </p>
                </div>

                <span className="view-all">
                  View all
                </span>
              </div>

              {expenses.length === 0 ? (
                <div className="empty-state">

                  <div className="empty-icon">
                    🧾
                  </div>

                  <h3>
                    No expenses yet
                  </h3>

                  <p>
                    Add your first expense to start
                    tracking your trip spending.
                  </p>

                  <button
                    className="primary-button"
                    onClick={() => {
                      alert(
                        "Expense screen will be connected next."
                      );
                    }}
                  >
                    Add Expense
                  </button>

                </div>
              ) : (
                <div className="expense-list">

                  {expenses.slice(0, 5).map((expense) => (
                    <div
                      key={expense.id}
                      className="expense-row"
                    >
                      <div>
                        <strong>
                          {expense.title ||
                            expense.description ||
                            "Expense"}
                        </strong>

                        <p>
                          {expense.category ||
                            "Trip expense"}
                        </p>
                      </div>

                      <strong>
                        {money(expense.amount)}
                      </strong>
                    </div>
                  ))}

                </div>
              )}

            </section>

            {/* TRIP MEMBERS */}

            <section className="dashboard-card">

              <div className="card-header">
                <div>
                  <h3>Trip Members</h3>

                  <p>
                    People travelling with you
                  </p>
                </div>

                <span className="view-all">
                  View all
                </span>
              </div>

              {participants.length === 0 ? (
                <div className="empty-state">

                  <div className="empty-icon">
                    👥
                  </div>

                  <h3>
                    No participants yet
                  </h3>

                  <p>
                    Add people to your trip to start
                    managing group expenses.
                  </p>

                  <button
                    className="primary-button"
                    onClick={() => {
                      alert(
                        "Participant screen will be connected next."
                      );
                    }}
                  >
                    Add Participant
                  </button>

                </div>
              ) : (
                <div className="participant-list">

                  {participants.slice(0, 5).map(
                    (participant) => (
                      <div
                        key={participant.id}
                        className="participant-row"
                      >
                        <div className="participant-avatar">
                          👤
                        </div>

                        <div>
                          <strong>
                            {participant.name ||
                              participant.full_name ||
                              "Participant"}
                          </strong>

                          <p>
                            {participant.email ||
                              participant.phone ||
                              ""}
                          </p>
                        </div>
                      </div>
                    )
                  )}

                </div>
              )}

            </section>

          </div>

          {/* TRIP INFORMATION */}

          {currentTrip && (
            <section
              className="dashboard-card"
              style={{
                marginTop: "30px",
              }}
            >
              <div className="card-header">
                <div>
                  <h3>Current Trip</h3>

                  <p>
                    Information coming directly from
                    your backend.
                  </p>
                </div>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(auto-fit, minmax(180px, 1fr))",
                  gap: "20px",
                  paddingTop: "15px",
                }}
              >

                <div>
                  <small>Trip Name</small>

                  <strong
                    style={{
                      display: "block",
                      marginTop: "5px",
                    }}
                  >
                    {currentTrip.name}
                  </strong>
                </div>

                <div>
                  <small>Destination</small>

                  <strong
                    style={{
                      display: "block",
                      marginTop: "5px",
                    }}
                  >
                    {currentTrip.destination}
                  </strong>
                </div>

                <div>
                  <small>Currency</small>

                  <strong
                    style={{
                      display: "block",
                      marginTop: "5px",
                    }}
                  >
                    {currentTrip.currency}
                  </strong>
                </div>

                <div>
                  <small>Status</small>

                  <strong
                    style={{
                      display: "block",
                      marginTop: "5px",
                      textTransform: "capitalize",
                    }}
                  >
                    {currentTrip.status}
                  </strong>
                </div>

                <div>
                  <small>Budget</small>

                  <strong
                    style={{
                      display: "block",
                      marginTop: "5px",
                    }}
                  >
                    {money(currentTrip.budget)}
                  </strong>
                </div>

              </div>
            </section>
          )}

        </main>
      </div>
    </div>
  );
}

export default App;