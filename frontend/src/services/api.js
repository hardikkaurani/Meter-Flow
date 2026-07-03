// Axios instance for the MeterFlow dashboard API.
// JWT (Phase 1) is attached here once auth lands.
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:4000';

export const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Attach bearer token when present (populated by the auth store in Phase 1).
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('meterflow_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
