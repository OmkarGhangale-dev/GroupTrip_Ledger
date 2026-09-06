import api from "./api";

export const getRefunds = async (bookingId) => {
  const response = await api.get(`/refunds/booking/${bookingId}`);
  return response.data;
};

export const createRefund = async (refundData) => {
  const response = await api.post("/refunds/", refundData);
  return response.data;
};