import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000";

const client = axios.create({ baseURL: API_BASE });

// Intercept requests to attach Bearer token if available
client.interceptors.request.use((config) => {
  const token = localStorage.getItem("health_auth_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export async function submitAssessment(payload) {
  const { data } = await client.post("/predict", payload);
  return data;
}

export async function fetchHistory(userId) {
  const { data } = await client.get(`/history/${userId}`);
  return data;
}

export async function submitBatch(file) {
  const formData = new FormData();
  formData.append("file", file);
  const { data } = await client.post("/predict/batch", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}

export async function simulateRisk(payload) {
  const { data } = await client.post("/predict/simulate", payload);
  return data;
}

export async function fetchRecommendations(payload) {
  const { data } = await client.post("/predict/recommendations", payload);
  return data;
}

export async function fetchModelRegistry() {
  const { data } = await client.get("/admin/models");
  return data;
}

export async function fetchSystemStats() {
  const { data } = await client.get("/admin/system-stats");
  return data;
}

export async function loginUser(credentials) {
  const { data } = await client.post("/auth/login", credentials);
  if (data.access_token) {
    localStorage.setItem("health_auth_token", data.access_token);
    localStorage.setItem("health_user_info", JSON.stringify(data));
  }
  return data;
}

export async function registerUser(userData) {
  const { data } = await client.post("/auth/register", userData);
  if (data.access_token) {
    localStorage.setItem("health_auth_token", data.access_token);
    localStorage.setItem("health_user_info", JSON.stringify(data));
  }
  return data;
}

export async function fetchCurrentUser() {
  const { data } = await client.get("/auth/me");
  return data;
}

export function logoutUser() {
  localStorage.removeItem("health_auth_token");
  localStorage.removeItem("health_user_info");
}

export function getHistoryExportCsvUrl(userId) {
  return `${API_BASE}/history/${userId}/export/csv`;
}
export function getReportPdfUrl() {
  return `${API_BASE}/admin/download-report-pdf`;
}
