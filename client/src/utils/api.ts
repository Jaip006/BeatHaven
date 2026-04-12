import axios from "axios";
import { API_BASE_URL } from './apiBaseUrl';

type AuthPayload = Record<string, unknown>;

// Create a pre-configured Axios instance
export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Required for setting/getting secure cookies (Refresh Tokens)
  headers: {
    "Content-Type": "application/json",
  },
});

// Example API calls you can use later
export const beatService = {
  getTrendingBeats: () => api.get("/beats/trending"),
  getBeatById: (id: string) => api.get(`/beats/${id}`),
};

export const authService = {
  login: (data: AuthPayload) => api.post("/auth/login", data),
  register: (data: AuthPayload) => api.post("/auth/register", data),
  verifyEmail: (data: AuthPayload) => api.post("/auth/verify-email", data),
  resendOtp: (data: AuthPayload) => api.post("/auth/resend-otp", data),
  forgotPassword: (data: AuthPayload) => api.post("/auth/forgot-password", data),
  verifyResetOtp: (data: AuthPayload) => api.post("/auth/verify-reset-otp", data),
  resetPassword: (data: AuthPayload) => api.post("/auth/reset-password", data),
  refresh: () => api.post("/auth/refresh"),
  logout: () => api.post("/auth/logout"),
  getProfile: () => api.get("/auth/me"),
};

export default api;
