import axios from "axios";

// Create a pre-configured Axios instance
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1",
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
  login: (data: any) => api.post("/auth/login", data),
  register: (data: any) => api.post("/auth/register", data),
  verifyEmail: (data: any) => api.post("/auth/verify-email", data),
  resendOtp: (data: any) => api.post("/auth/resend-otp", data),
  logout: () => api.post("/auth/logout"),
  getProfile: () => api.get("/auth/me"),
};

export default api;
