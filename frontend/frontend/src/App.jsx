import React, { useState, useEffect } from "react";
import { useTrip } from "./context/TripContext";
import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";
import AIChatBot from "./components/AIChatBot";
import ParallaxScrollWorld from "./components/landing/ParallaxScrollWorld";

// Views
import DashboardView from "./views/DashboardView";
import ParticipantsView from "./views/ParticipantsView";
import ExpensesView from "./views/ExpensesView";
import BookingsView from "./views/BookingsView";
import PaymentsView from "./views/PaymentsView";
import SettlementsView from "./views/SettlementsView";
import ItineraryView from "./views/ItineraryView";
import SettingsView from "./views/SettingsView";
import LoginView from "./views/LoginView";
import InviteAcceptView from "./views/InviteAcceptView";

// Modals
import TripModal from "./components/modals/TripModal";
import ParticipantModal from "./components/modals/ParticipantModal";
import ExpenseModal from "./components/modals/ExpenseModal";
import BookingModal from "./components/modals/BookingModal";
import PaymentModal from "./components/modals/PaymentModal";
import RefundModal from "./components/modals/RefundModal";
import ItineraryModal from "./components/modals/ItineraryModal";
import ToastContainer from "./components/modals/Toast";

export default function App() {
  const { loading, error, trip, itinerary, addItineraryItem } = useTrip();
  const [activeTab, setActiveTab] = useState(() => {
    return localStorage.getItem("token") ? "dashboard" : "landing";
  });
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.remove("light");
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
      document.documentElement.classList.add("light");
    }
  }, [isDark]);

  const toggleTheme = () => {
    setIsDark((prev) => !prev);
  };

  // Modal states
  const [tripModal, setTripModal] = useState({ isOpen: false, data: null });
  const [participantModal, setParticipantModal] = useState({
    isOpen: false,
    data: null,
  });
  const [expenseModal, setExpenseModal] = useState({
    isOpen: false,
    data: null,
  });
  const [bookingModal, setBookingModal] = useState({
    isOpen: false,
    data: null,
  });
  const [paymentModal, setPaymentModal] = useState({
    isOpen: false,
    data: null,
  });
  const [refundModal, setRefundModal] = useState({
    isOpen: false,
    booking: null,
  });
  const [itineraryModal, setItineraryModal] = useState({
    isOpen: false,
    data: null,
  });

  const [targetPlaceQuery, setTargetPlaceQuery] = useState("");

  const handleAIChatNavigateToMap = (placeName) => {
    setTargetPlaceQuery(placeName);
    setActiveTab("itinerary");
  };
  const inviteToken = new URLSearchParams(window.location.search).get("invite");
  if (inviteToken) {
    return (
      <div className="app-layout view-login">
        <ToastContainer />
        <InviteAcceptView token={inviteToken} />
      </div>
    );
  }

  if (activeTab === "landing") {
    return (
      <div className="min-h-screen bg-background text-on-surface">
        <ToastContainer />
        <ParallaxScrollWorld
          onOpenLogin={() => setActiveTab("login")}
          onOpenRegister={() => setActiveTab("login")}
          isDark={isDark}
          toggleTheme={toggleTheme}
        />
      </div>
    );
  }

  if (activeTab === "login") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-surface-container-lowest via-surface-dim to-background">
        <ToastContainer />
        <LoginView
          onLoginSuccess={() => {
            setActiveTab("dashboard");
            window.location.reload();
          }}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-surface-container-lowest via-surface-dim to-background text-on-surface selection:bg-primary-container selection:text-on-primary-container">
      {/* GLOBAL TOAST ALERTS */}
      <ToastContainer />

      {/* SIDEBAR NAVIGATION */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      <div className="pl-64 min-h-screen">
        {/* NAVBAR */}
        <Navbar
          onOpenNewTripModal={() => setTripModal({ isOpen: true, data: null })}
          onOpenLogin={() => setActiveTab("login")}
          onLogout={() => setActiveTab("landing")}
          isDark={isDark}
          toggleTheme={toggleTheme}
        />

        {/* MAIN ROUTED VIEW WITH SMOOTH PAGE TRANSITIONS */}
        <main className="w-full pt-16">
          {error && (
            <div className="mx-6 mt-4 p-4 rounded-xl bg-error-container text-on-error-container">
              <span>{error}</span>
            </div>
          )}

          <div key={activeTab} className="page-transition w-full">
            {activeTab === "dashboard" && (
              <DashboardView
                onOpenExpenseModal={(data = null) =>
                  setExpenseModal({ isOpen: true, data })
                }
                onOpenParticipantModal={(data = null) =>
                  setParticipantModal({ isOpen: true, data })
                }
                onOpenBookingModal={(data = null) =>
                  setBookingModal({ isOpen: true, data })
                }
                onOpenPaymentModal={(data = null) =>
                  setPaymentModal({ isOpen: true, data })
                }
                onOpenItineraryModal={(data = null) =>
                  setItineraryModal({ isOpen: true, data })
                }
                onOpenTripModal={(data = null) =>
                  setTripModal({ isOpen: true, data })
                }
                setActiveTab={setActiveTab}
              />
            )}

            {activeTab === "participants" && (
              <ParticipantsView
                onOpenParticipantModal={(data = null) =>
                  setParticipantModal({ isOpen: true, data })
                }
              />
            )}

            {activeTab === "expenses" && (
              <ExpensesView
                onOpenExpenseModal={(data = null) =>
                  setExpenseModal({ isOpen: true, data })
                }
              />
            )}

            {activeTab === "bookings" && (
              <BookingsView
                onOpenBookingModal={(data = null) =>
                  setBookingModal({ isOpen: true, data })
                }
                onOpenRefundModal={(booking) =>
                  setRefundModal({ isOpen: true, booking })
                }
              />
            )}

            {activeTab === "payments" && (
              <PaymentsView
                onOpenPaymentModal={(data = null) =>
                  setPaymentModal({ isOpen: true, data })
                }
              />
            )}

            {activeTab === "settlements" && (
              <SettlementsView
                onOpenPaymentModal={(data = null) =>
                  setPaymentModal({ isOpen: true, data })
                }
              />
            )}

            {activeTab === "itinerary" && (
              <ItineraryView
                onOpenItineraryModal={(data = null) =>
                  setItineraryModal({ isOpen: true, data })
                }
                targetPlaceQuery={targetPlaceQuery}
                initialTab={targetPlaceQuery ? "map" : "timeline"}
              />
            )}

            {activeTab === "settings" && (
              <SettingsView
                onOpenTripModal={(data = null) =>
                  setTripModal({ isOpen: true, data })
                }
              />
            )}
          </div>
        </main>
      </div>

      {/* AI TRAVEL CHATBOT - Global Floating Widget */}
      <AIChatBot
        trip={trip}
        itinerary={itinerary}
        onAddToItinerary={addItineraryItem}
        onNavigateToMap={handleAIChatNavigateToMap}
      />

      {/* MODAL DIALOGS */}
      <TripModal
        isOpen={tripModal.isOpen}
        initialData={tripModal.data}
        onClose={() => setTripModal({ isOpen: false, data: null })}
      />

      <ParticipantModal
        isOpen={participantModal.isOpen}
        initialData={participantModal.data}
        onClose={() => setParticipantModal({ isOpen: false, data: null })}
      />

      <ExpenseModal
        isOpen={expenseModal.isOpen}
        initialData={expenseModal.data}
        onClose={() => setExpenseModal({ isOpen: false, data: null })}
      />

      <BookingModal
        isOpen={bookingModal.isOpen}
        initialData={bookingModal.data}
        onClose={() => setBookingModal({ isOpen: false, data: null })}
      />

      <PaymentModal
        isOpen={paymentModal.isOpen}
        initialData={paymentModal.data}
        onClose={() => setPaymentModal({ isOpen: false, data: null })}
      />

      <RefundModal
        isOpen={refundModal.isOpen}
        booking={refundModal.booking}
        onClose={() => setRefundModal({ isOpen: false, booking: null })}
      />

      <ItineraryModal
        isOpen={itineraryModal.isOpen}
        initialData={itineraryModal.data}
        onClose={() => setItineraryModal({ isOpen: false, data: null })}
      />
    </div>
  );
}
