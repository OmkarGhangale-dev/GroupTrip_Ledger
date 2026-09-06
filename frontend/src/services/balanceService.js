import api from "./api";

export const getBalances = async (tripId) => {
  const response = await api.get(`/trips/${tripId}/balances`);
  return response.data;
};