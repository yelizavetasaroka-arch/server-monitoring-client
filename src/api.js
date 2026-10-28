import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000",
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

export const fetchMetrics = (search = "") =>
  api.get("/metrics", { params: { search } });
export const addMetric = (metric) => api.post("/metrics", metric);
export const updateMetric = (id, updated) => api.put(`/metrics/${id}`, updated);
export const deleteMetric = (id) => api.delete(`/metrics/${id}`);

export default api;
