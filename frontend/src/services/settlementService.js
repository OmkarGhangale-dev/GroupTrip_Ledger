import api from "./api";

export const getSettlements = async (tripId) => {
  const response = await api.get(`/trips/${tripId}/settlements`);
  return response.data;
};