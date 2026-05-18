import axios from 'axios';

// Get API URL from runtime config (loaded in index.html)
const API_URL = window.API_CONFIG?.API_URL || 'https://wisp-production-9ac7.up.railway.app';
console.log('[API Client] Using API_URL:', API_URL);

const api = axios.create({ baseURL: API_URL });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('siswisp_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('siswisp_token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export const login = (email, password) => api.post('/api/auth/login', { email, password });
export const register = (name, email, password) => api.post('/api/auth/register', { name, email, password });
export const getMe = () => api.get('/api/auth/me');

export const getClients = (params) => api.get('/api/clients/', { params });
export const getClient = (id) => api.get(`/api/clients/${id}`);
export const createClient = (data) => api.post('/api/clients/', data);
export const updateClient = (id, data) => api.patch(`/api/clients/${id}`, data);
export const deleteClient = (id) => api.delete(`/api/clients/${id}`);
export const suspendClient = (id) => api.post(`/api/clients/${id}/suspend`);
export const reactivateClient = (id) => api.post(`/api/clients/${id}/reactivate`);
export const pingClient = (id) => api.get(`/api/clients/${id}/ping`);
export const exportClientsCSV = () => api.get('/api/clients/export/csv', { responseType: 'blob' });
export const exportClientsPDF = () => api.get('/api/clients/export/pdf', { responseType: 'blob' });
export const importClientsCSV = (file) => {
  const formData = new FormData();
  formData.append('file', file);
  return api.post('/api/clients/import/csv', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
};

export const getPlans = () => api.get('/api/plans/');
export const createPlan = (data) => api.post('/api/plans/', data);

export const getPayments = (params) => api.get('/api/payments/', { params });
export const markPaid = (id) => api.post(`/api/payments/${id}/mark-paid`);
export const createPayment = (data) => api.post('/api/payments/', data);

export const getDashboardStats = () => api.get('/api/dashboard/stats');

export default api;
