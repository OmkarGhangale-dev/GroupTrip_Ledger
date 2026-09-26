import api from "./api";

export const createInvite = async (tripId, email = null) => {
  const response = await api.post(`/invites/trip/${tripId}`, { email });
  return response.data;
};

export const getInvites = async (tripId) => {
  const response = await api.get(`/invites/trip/${tripId}`);
  return response.data;
};

export const revokeInvite = async (inviteId) => {
  await api.delete(`/invites/${inviteId}`);
};

export const getInvitePreview = async (token) => {
  const response = await api.get(`/invites/preview/${token}`);
  return response.data;
};

export const acceptInvite = async (token) => {
  const response = await api.post(`/invites/accept/${token}`);
  return response.data;
};