import React, { useState } from "react";
import { useTrip } from "./context/TripContext";
import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";
import AIChatBot from "./components/AIChatBot";

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
    return localStorage.getItem("token") ? "dashboard" : "login";
  });

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

  if (activeTab === "login") {
    return (
      <div className="app-layout view-login">
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
    <div className={`app-layout view-${activeTab}`}>
      {/* GLOBAL TOAST ALERTS */}
      <ToastContainer />

      {/* SIDEBAR NAVIGATION */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      <div className="main-wrapper">
        {/* NAVBAR */}
        <Navbar
          onOpenNewTripModal={() => setTripModal({ isOpen: true, data: null })}
          onOpenLogin={() => setActiveTab("login")}
        />

        {/* MAIN ROUTED VIEW */}
        <main className="main-content-area">
          {error && (
            <div className="global-error-banner">
              <span>{error}</span>
            </div>
          )}

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
