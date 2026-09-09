import axios from "axios";

// In local dev (import.meta.env.DEV): use VITE_API_BASE_URL or fallback to localhost backend.
// In production (Vercel): use relative path /api/v1 so requests hit same-origin serverless function.
const _apiBase = import.meta.env.DEV
  ? (import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000")
  : (import.meta.env.VITE_API_BASE_URL ?? "");

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
