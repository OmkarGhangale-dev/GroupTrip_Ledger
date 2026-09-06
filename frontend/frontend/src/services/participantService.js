import api from "./api";

export const getParticipants = async (tripId) => {
  const response = await api.get(`/participants/trip/${tripId}`);
  return response.data;
};

export const getParticipant = async (participantId) => {
  const response = await api.get(`/participants/${participantId}`);
  return response.data;
};

export const createParticipant = async (participantData) => {
  const response = await api.post("/participants/", participantData);
  return response.data;
};

export const updateParticipant = async (participantId, participantData) => {
  const response = await api.patch(
    `/participants/${participantId}`,
    participantData
  );
  return response.data;
};

export const deleteParticipant = async (participantId) => {
  await api.delete(`/participants/${participantId}`);
};