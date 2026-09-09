import axios from "axios";

// In local dev: VITE_API_BASE_URL is not set → uses localhost backend.
// In production (Vercel): VITE_API_BASE_URL="" (empty) → relative URL /api/v1
//   which routes to the Vercel Python serverless function on the same domain.
const _apiBase = import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000";

const api = axios.create({
  baseURL: `${_apiBase}/api/v1`,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
