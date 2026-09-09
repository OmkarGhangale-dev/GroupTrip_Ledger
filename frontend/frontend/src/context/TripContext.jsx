import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";

import {
  getTrips,
  createTrip,
  updateTrip as apiUpdateTrip,
  deleteTrip as apiDeleteTrip,
} from "../services/tripService";
import {
  getParticipants,
  createParticipant,
  updateParticipant as apiUpdateParticipant,
  deleteParticipant as apiDeleteParticipant,
} from "../services/participantService";
import {
  getExpenses,
  createExpense,
  updateExpense as apiUpdateExpense,
  deleteExpense as apiDeleteExpense,
} from "../services/expenseService";
import {
  getBookings,
  createBooking,
  updateBooking as apiUpdateBooking,
  deleteBooking as apiDeleteBooking,
  markBookingUsed as apiMarkBookingUsed,
} from "../services/bookingService";
import {
  getPayments,
  createPayment,
  updatePayment as apiUpdatePayment,
  deletePayment as apiDeletePayment,
} from "../services/paymentService";
import { getBalances } from "../services/balanceService";
import { getSettlements } from "../services/settlementService";
import {
  getItinerary,
  createItineraryItem,
  updateItineraryItem as apiUpdateItineraryItem,
  deleteItineraryItem as apiDeleteItineraryItem,
} from "../services/itineraryService";
import { createRefund, getRefunds } from "../services/refundService";

const TripContext = createContext(null);

export function TripProvider({ children }) {
  const [trips, setTrips] = useState([]);
  const [trip, setTrip] = useState(null);

  const [participants, setParticipants] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [payments, setPayments] = useState([]);
  const [balances, setBalances] = useState([]);
  const [settlements, setSettlements] = useState([]);
  const [itinerary, setItinerary] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toasts, setToasts] = useState([]);

  // Toast notification helper
  const showToast = useCallback((message, type = "success") => {
    const id = Date.now() + Math.random().toString(36).substr(2, 4);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Load all trips from backend
  const loadTrips = useCallback(
    async (selectTripId = null) => {
      try {
        setLoading(true);
        setError("");

        const data = await getTrips();
        const tripList = Array.isArray(data) ? data : [];
        setTrips(tripList);

        if (tripList.length > 0) {
          if (selectTripId) {
            const found = tripList.find((t) => t.id === selectTripId);
            setTrip(found || tripList[0]);
          } else {
            setTrip((current) => {
              if (current && tripList.some((t) => t.id === current.id)) {
                return tripList.find((t) => t.id === current.id);
              }
              return tripList[0];
            });
          }
        } else {
          setTrip(null);
        }
      } catch (err) {
        console.error("Failed to load trips:", err);
        const msg =
          err?.response?.data?.detail ||
          "Could not connect to the backend server.";
        setError(msg);
        showToast(msg, "error");
      } finally {
        setLoading(false);
      }
    },
    [showToast],
  );

  // Load all data for active trip
  const loadTripData = useCallback(
    async (tripId) => {
      if (!tripId) return;

      try {
        setLoading(true);
        setError("");

        const [
          participantData,
          expenseData,
          bookingData,
          paymentData,
          balanceData,
          settlementData,
          itineraryData,
        ] = await Promise.all([
          getParticipants(tripId).catch((err) => {
            console.error("Participants API failed:", err);
            return [];
          }),

          getExpenses(tripId).catch((err) => {
            console.error("Expenses API failed:", err);
            return [];
          }),

          getBookings(tripId).catch((err) => {
            console.error("Bookings API failed:", err);
            return [];
          }),

          getPayments(tripId).catch((err) => {
            console.error("Payments API failed:", err);
            return [];
          }),

          getBalances(tripId).catch((err) => {
            console.error("Balances API failed:", err);
            return [];
          }),

          getSettlements(tripId).catch((err) => {
            console.error("Settlements API failed:", err);
            return [];
          }),

          getItinerary(tripId).catch((err) => {
            console.error("ITINERARY API FAILED:", err);
            console.error("Response:", err?.response?.data);
            return [];
          }),
        ]);

        setParticipants(Array.isArray(participantData) ? participantData : []);
        setExpenses(Array.isArray(expenseData) ? expenseData : []);
        setBookings(Array.isArray(bookingData) ? bookingData : []);
        setPayments(Array.isArray(paymentData) ? paymentData : []);
        setBalances(Array.isArray(balanceData) ? balanceData : []);
        setSettlements(Array.isArray(settlementData) ? settlementData : []);
        setItinerary(Array.isArray(itineraryData) ? itineraryData : []);
      } catch (err) {
        console.error("Failed to load trip details:", err);
        const msg =
          err?.response?.data?.detail || "Failed to load trip details.";
        setError(msg);
        showToast(msg, "error");
      } finally {
        setLoading(false);
      }
    },
    [showToast],
  );

  // Initial load
  // Initial load
  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      setLoading(false);
      return;
    }

    loadTrips();
  }, [loadTrips]);

  // Load trip-specific data when active trip changes
  useEffect(() => {
    if (trip?.id) {
      loadTripData(trip.id);
    } else {
      setParticipants([]);
      setExpenses([]);
      setBookings([]);
      setPayments([]);
      setBalances([]);
      setSettlements([]);
      setItinerary([]);
    }
  }, [trip?.id, loadTripData]);

  // ==========================================
  // TRIP CRUD
  // ==========================================
  const addTrip = async (tripData) => {
    try {
      const newTrip = await createTrip(tripData);
      showToast(`Trip "${newTrip.name}" created successfully!`);
      await loadTrips(newTrip.id);
      return newTrip;
    } catch (err) {
      console.error("Failed to create trip:", err);
      const msg = err?.response?.data?.detail || "Failed to create trip.";
      showToast(msg, "error");
      throw err;
    }
  };

  const editTrip = async (tripId, tripData) => {
    try {
      const updated = await apiUpdateTrip(tripId, tripData);
      showToast(`Trip "${updated.name}" updated successfully!`);
      setTrips((prev) => prev.map((t) => (t.id === tripId ? updated : t)));
      if (trip?.id === tripId) {
        setTrip(updated);
      }
      return updated;
    } catch (err) {
      console.error("Failed to update trip:", err);
      const msg = err?.response?.data?.detail || "Failed to update trip.";
      showToast(msg, "error");
      throw err;
    }
  };

  const removeTrip = async (tripId) => {
    try {
      await apiDeleteTrip(tripId);
      showToast("Trip deleted successfully.");
      await loadTrips();
    } catch (err) {
      console.error("Failed to delete trip:", err);
      const msg = err?.response?.data?.detail || "Failed to delete trip.";
      showToast(msg, "error");
      throw err;
    }
  };

  // ==========================================
  // PARTICIPANT CRUD
  // ==========================================
  const addParticipant = async (participantData) => {
    if (!trip?.id) return;
    try {
      const newParticipant = await createParticipant({
        ...participantData,
        trip_id: trip.id,
      });
      showToast(`Added ${newParticipant.name} to trip!`);
      await loadTripData(trip.id);
      return newParticipant;
    } catch (err) {
      console.error("Failed to create participant:", err);
      const msg = err?.response?.data?.detail || "Failed to add participant.";
      showToast(msg, "error");
      throw err;
    }
  };

  const editParticipant = async (participantId, participantData) => {
    try {
      const updated = await apiUpdateParticipant(
        participantId,
        participantData,
      );
      showToast(`Updated ${updated.name}!`);
      await loadTripData(trip.id);
      return updated;
    } catch (err) {
      console.error("Failed to update participant:", err);
      const msg =
        err?.response?.data?.detail || "Failed to update participant.";
      showToast(msg, "error");
      throw err;
    }
  };

  const removeParticipant = async (participantId) => {
    try {
      await apiDeleteParticipant(participantId);
      showToast("Participant removed from trip.");
      await loadTripData(trip.id);
    } catch (err) {
      console.error("Failed to remove participant:", err);
      const msg =
        err?.response?.data?.detail || "Failed to remove participant.";
      showToast(msg, "error");
      throw err;
    }
  };

  // ==========================================
  // EXPENSE CRUD
  // ==========================================
  const addExpense = async (expenseData) => {
    if (!trip?.id) return;
    try {
      const newExpense = await createExpense({
        ...expenseData,
        trip_id: trip.id,
      });
      showToast(`Expense "${newExpense.title}" added!`);
      await loadTripData(trip.id);
      return newExpense;
    } catch (err) {
      console.error("Failed to create expense:", err);
      const msg = err?.response?.data?.detail || "Failed to add expense.";
      showToast(msg, "error");
      throw err;
    }
  };

  const editExpense = async (expenseId, expenseData) => {
    try {
      const updated = await apiUpdateExpense(expenseId, expenseData);
      showToast(`Expense "${updated.title}" updated!`);
      await loadTripData(trip.id);
      return updated;
    } catch (err) {
      console.error("Failed to update expense:", err);
      const msg = err?.response?.data?.detail || "Failed to update expense.";
      showToast(msg, "error");
      throw err;
    }
  };

  const removeExpense = async (expenseId) => {
    try {
      await apiDeleteExpense(expenseId);
      showToast("Expense deleted.");
      await loadTripData(trip.id);
    } catch (err) {
      console.error("Failed to delete expense:", err);
      const msg = err?.response?.data?.detail || "Failed to delete expense.";
      showToast(msg, "error");
      throw err;
    }
  };

  // ==========================================
  // BOOKING CRUD & REFUNDS
  // ==========================================
  const addBooking = async (bookingData) => {
    if (!trip?.id) return;
    try {
      const newBooking = await createBooking({
        ...bookingData,
        trip_id: trip.id,
      });
      showToast(`Booking (${newBooking.booking_type}) added!`);
      await loadTripData(trip.id);
      return newBooking;
    } catch (err) {
      console.error("Failed to create booking:", err);
      const msg = err?.response?.data?.detail || "Failed to create booking.";
      showToast(msg, "error");
      throw err;
    }
  };

  const editBooking = async (bookingId, bookingData) => {
    try {
      const updated = await apiUpdateBooking(bookingId, bookingData);
      showToast("Booking updated!");
      await loadTripData(trip.id);
      return updated;
    } catch (err) {
      console.error("Failed to update booking:", err);
      const msg = err?.response?.data?.detail || "Failed to update booking.";
      showToast(msg, "error");
      throw err;
    }
  };

  const removeBooking = async (bookingId) => {
    try {
      await apiDeleteBooking(bookingId);
      showToast("Booking deleted.");
      await loadTripData(trip.id);
    } catch (err) {
      console.error("Failed to delete booking:", err);
      const msg = err?.response?.data?.detail || "Failed to delete booking.";
      showToast(msg, "error");
      throw err;
    }
  };
  const markBookingUsed = async (bookingId, paidById) => {
    try {
      const updatedBooking = await apiMarkBookingUsed(bookingId, paidById);

      showToast("Booking marked as used and added to expenses!");

      await loadTripData(trip.id);

      return updatedBooking;
    } catch (err) {
      console.error("Failed to mark booking as used:", err);

      const msg =
        err?.response?.data?.detail || "Failed to mark booking as used.";

      showToast(msg, "error");

      throw err;
    }
  };

  const addRefund = async (refundData) => {
    try {
      const newRefund = await createRefund(refundData);
      showToast(`Refund recorded for ₹${newRefund.amount}!`);
      await loadTripData(trip.id);
      return newRefund;
    } catch (err) {
      console.error("Failed to record refund:", err);
      const msg = err?.response?.data?.detail || "Failed to record refund.";
      showToast(msg, "error");
      throw err;
    }
  };

  const loadBookingRefunds = async (bookingId) => {
    try {
      return await getRefunds(bookingId);
    } catch (err) {
      console.error("Failed to load refunds:", err);
      return [];
    }
  };

  // ==========================================
  // PAYMENT CRUD
  // ==========================================
  const addPayment = async (paymentData) => {
    if (!trip?.id) return;
    try {
      const newPayment = await createPayment({
        ...paymentData,
        trip_id: trip.id,
      });
      showToast(`Payment of ₹${newPayment.amount} recorded!`);
      await loadTripData(trip.id);
      return newPayment;
    } catch (err) {
      console.error("Failed to record payment:", err);
      const msg = err?.response?.data?.detail || "Failed to record payment.";
      showToast(msg, "error");
      throw err;
    }
  };

  const editPayment = async (paymentId, paymentData) => {
    try {
      const updated = await apiUpdatePayment(paymentId, paymentData);
      showToast("Payment status updated!");
      await loadTripData(trip.id);
      return updated;
    } catch (err) {
      console.error("Failed to update payment:", err);
      const msg = err?.response?.data?.detail || "Failed to update payment.";
      showToast(msg, "error");
      throw err;
    }
  };

  const removePayment = async (paymentId) => {
    try {
      await apiDeletePayment(paymentId);
      showToast("Payment record deleted.");
      await loadTripData(trip.id);
    } catch (err) {
      console.error("Failed to delete payment:", err);
      const msg = err?.response?.data?.detail || "Failed to delete payment.";
      showToast(msg, "error");
      throw err;
    }
  };

  // ==========================================
  // ITINERARY CRUD
  // ==========================================

  const addItineraryItem = async (itemData) => {
    if (!trip?.id) {
      console.error("No active trip ID found:", trip);
      showToast("No active trip selected.", "error");
      throw new Error("No active trip selected.");
    }

    const payload = {
      ...itemData,
      trip_id: trip.id,
    };

    console.log("ITINERARY PAYLOAD:", payload);

    try {
      const newItem = await createItineraryItem(payload);

      showToast(`Itinerary item "${newItem.title}" added!`);

      await loadTripData(trip.id);

      return newItem;
    } catch (err) {
      console.error(
        "Failed to add itinerary item:",
        err?.response?.data || err,
      );

      const msg =
        err?.response?.data?.detail || "Failed to add itinerary item.";

      showToast(msg, "error");
      throw err;
    }
  };

  const editItineraryItem = async (itemId, itemData) => {
    try {
      const updated = await apiUpdateItineraryItem(itemId, itemData);

      showToast(`Itinerary item "${updated.title}" updated!`);

      await loadTripData(trip.id);

      return updated;
    } catch (err) {
      console.error("Failed to update itinerary item:", err);

      const msg =
        err?.response?.data?.detail || "Failed to update itinerary item.";

      showToast(msg, "error");

      throw err;
    }
  };

  const removeItineraryItem = async (itemId) => {
    try {
      await apiDeleteItineraryItem(itemId);

      showToast("Itinerary item deleted.");

      await loadTripData(trip.id);
    } catch (err) {
      console.error("Failed to delete itinerary item:", err);

      const msg =
        err?.response?.data?.detail || "Failed to delete itinerary item.";

      showToast(msg, "error");

      throw err;
    }
  };
  // Total expenses calculation
  const totalExpenses = expenses.reduce(
    (total, exp) => total + Number(exp.amount || 0),
    0,
  );

  // Total bookings calculation
  const totalBookingsAmount = bookings.reduce(
    (total, b) => total + Number(b.amount || 0),
    0,
  );

  // Total payments calculation
  const totalPaymentsAmount = payments.reduce(
    (total, p) =>
      p.status === "completed" ? total + Number(p.amount || 0) : total,
    0,
  );

  const reload = async () => {
    if (trip?.id) {
      await loadTripData(trip.id);
    } else {
      await loadTrips();
    }
  };

  const value = {
    trips,
    trip,
    setTrip,

    participants,
    expenses,
    bookings,
    payments,
    balances,
    settlements,
    itinerary,

    loading,
    error,
    toasts,
    showToast,
    removeToast,

    totalExpenses,
    totalBookingsAmount,
    totalPaymentsAmount,

    loadTrips,
    loadTripData,
    reload,

    // Trips
    addTrip,
    editTrip,
    removeTrip,

    // Participants
    addParticipant,
    editParticipant,
    removeParticipant,

    // Expenses
    addExpense,
    editExpense,
    removeExpense,

    // Bookings & Refunds
    addBooking,
    editBooking,
    removeBooking,
    markBookingUsed,
    addRefund,
    loadBookingRefunds,

    // Payments
    addPayment,
    editPayment,
    removePayment,

    // Itinerary
    addItineraryItem,
    editItineraryItem,
    removeItineraryItem,
  };

  return <TripContext.Provider value={value}>{children}</TripContext.Provider>;
}

export function useTrip() {
  const context = useContext(TripContext);
  if (!context) {
    throw new Error("useTrip must be used within a TripProvider");
  }
  return context;
}
