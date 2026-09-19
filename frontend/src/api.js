import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000";

const client = axios.create({ baseURL: API_BASE });

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
