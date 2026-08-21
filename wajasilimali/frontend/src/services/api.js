import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('wajasilimali_token');
  config.headers = config.headers || {};
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  const branchId = localStorage.getItem('wajasilimali_branch_id');
  if (branchId) {
    config.headers['X-Branch-Id'] = String(branchId);
    config.params = { ...(config.params || {}), branch_id: Number(branchId) };
  }
  return config;
});

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
  listUsers: () => api.get('/api/auth/users'),
  createStaff: (data) => api.post('/api/auth/staff', data),
  toggleUser: (id) => api.patch(`/api/auth/users/${id}/toggle-active`),
  listBusinesses: () => api.get('/api/auth/businesses'),
  listAllUsers: () => api.get('/api/auth/users/all'),
};

export const productsAPI = {
  list: (params) => api.get('/api/products/', { params }),
  get: (id) => api.get(`/api/products/${id}`),
  create: (data) => api.post('/api/products/', data),
  update: (id, data) => api.put(`/api/products/${id}`, data),
  delete: (id) => api.delete(`/api/products/${id}`),
  adjustStock: (id, quantity_change) =>
    api.patch(`/api/products/${id}/adjust-stock`, null, { params: { quantity_change } }),
};

export function fileToBase64(file, maxWidth = 600, quality = 0.7) {
  return new Promise((resolve, reject) => {
    if (!file || !file.type.startsWith('image/')) {
      reject(new Error('Chagua faili la picha'));
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      reject(new Error('Picha max 5MB'));
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let w = img.width;
        let h = img.height;
        if (w > maxWidth) {
          h = Math.round((h * maxWidth) / w);
          w = maxWidth;
        }
        canvas.width = w;
        canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export const getImageUrl = (imagePath) => {
  if (!imagePath) return null;
  if (imagePath.startsWith('http') || imagePath.startsWith('data:')) return imagePath;
  return `${API_BASE}${imagePath}`;
};

export const salesAPI = {
  create: (data) => api.post('/api/sales/', data),
  list: (params) => api.get('/api/sales/', { params }),
  get: (id) => api.get(`/api/sales/${id}`),
  receiptPdf: (id) => api.get(`/api/sales/receipt/${id}/pdf`, { responseType: 'blob' }),
};

export const debtorsAPI = {
  list: (params) => api.get('/api/debtors/', { params }),
  get: (id) => api.get(`/api/debtors/${id}`),
  recordPayment: (id, data) => api.post(`/api/debtors/${id}/payments`, data),
  listCustomers: () => api.get('/api/debtors/customers/'),
  createCustomer: (data) => api.post('/api/debtors/customers/', data),
};

export const dashboardAPI = {
  stats: () => api.get('/api/dashboard/stats'),
};

export const branchesAPI = {
  list: () => api.get('/api/branches/'),
  create: (data) => api.post('/api/branches/', data),
  update: (id, data) => api.put(`/api/branches/${id}`, data),
  delete: (id) => api.delete(`/api/branches/${id}`),
};
