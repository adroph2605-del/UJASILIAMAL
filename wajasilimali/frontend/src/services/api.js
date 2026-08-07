import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('wajasilimali_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('wajasilimali_token');
      localStorage.removeItem('wajasilimali_user');
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;

// Auth
export const authAPI = {
  login: (email, password) => {
    const form = new URLSearchParams();
    form.append('username', email);
    form.append('password', password);
    return api.post('/api/auth/login', form, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
  },
  register: (data) => api.post('/api/auth/register', data),
  me: () => api.get('/api/auth/me'),
};

// Products
export const productsAPI = {
  list: (params) => api.get('/api/products/', { params }),
  get: (id) => api.get(`/api/products/${id}`),
  create: (data) => api.post('/api/products/', data),
  update: (id, data) => api.put(`/api/products/${id}`, data),
  delete: (id) => api.delete(`/api/products/${id}`),
  adjustStock: (id, quantity_change) =>
    api.patch(`/api/products/${id}/adjust-stock`, null, { params: { quantity_change } }),
};

// Sales
export const salesAPI = {
  create: (data) => api.post('/api/sales/', data),
  list: (params) => api.get('/api/sales/', { params }),
  get: (id) => api.get(`/api/sales/${id}`),
  receiptPdf: (id) =>
    api.get(`/api/sales/receipt/${id}/pdf`, { responseType: 'blob' }),
};

// Debtors
export const debtorsAPI = {
  list: (params) => api.get('/api/debtors/', { params }),
  get: (id) => api.get(`/api/debtors/${id}`),
  recordPayment: (id, data) => api.post(`/api/debtors/${id}/payments`, data),
  listCustomers: () => api.get('/api/debtors/customers/'),
  createCustomer: (data) => api.post('/api/debtors/customers/', data),
};

// Dashboard
export const dashboardAPI = {
  stats: () => api.get('/api/dashboard/stats'),
};
