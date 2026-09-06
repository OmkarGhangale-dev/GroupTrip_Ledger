import api from "./api";

export const getItinerary = async (tripId) => {
  const response = await api.get(`/itinerary/trip/${tripId}`);
  return response.data;
};

export const getItineraryItem = async (itemId) => {
  const response = await api.get(`/itinerary/${itemId}`);
  return response.data;
};

export const createItineraryItem = async (itemData) => {
  const response = await api.post("/itinerary/", itemData);
  return response.data;
};

export const updateItineraryItem = async (itemId, itemData) => {
  const response = await api.patch(
    `/itinerary/${itemId}`,
    itemData
  );
  return response.data;
};

export const deleteItineraryItem = async (itemId) => {
  await api.delete(`/itinerary/${itemId}`);
};