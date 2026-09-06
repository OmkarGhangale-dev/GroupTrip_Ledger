import api from "./api";

export const getBookings = async (tripId) => {
  const response = await api.get(`/bookings/trip/${tripId}`);
  return response.data;
};

export const getBooking = async (bookingId) => {
  const response = await api.get(`/bookings/${bookingId}`);
  return response.data;
};

export const createBooking = async (bookingData) => {
  const response = await api.post("/bookings/", bookingData);
  return response.data;
};

export const updateBooking = async (bookingId, bookingData) => {
  const response = await api.patch(`/bookings/${bookingId}`, bookingData);
  return response.data;
};

export const deleteBooking = async (bookingId) => {
  await api.delete(`/bookings/${bookingId}`);
};
export const markBookingUsed = async (bookingId, paidById) => {
  const response = await api.post(`/bookings/${bookingId}/use`, {
    paid_by_id: paidById,
  });

  return response.data;
};
