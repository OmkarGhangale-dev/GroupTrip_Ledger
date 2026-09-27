import api from "./api";
 
export const getTwinState = (tripId) =>
  api.get(`/twin/${tripId}/state`).then((r) => r.data);
 
export const runTwinScenario = (tripId, scenario) =>
  api.post(`/twin/${tripId}/simulate`, scenario).then((r) => r.data);
 
export const sendTwinFeedback = (tripId, observed_severity) =>
  api.post(`/twin/${tripId}/feedback`, { observed_severity }).then((r) => r.data);
 
export const getTripWeather = (tripId) =>
  api.get(`/twin/${tripId}/weather`).then((r) => r.data);
 