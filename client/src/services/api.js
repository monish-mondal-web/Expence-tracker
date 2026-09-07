const BASE_URL = import.meta.env.VITE_API_URL || '/api';

async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  
  const token = localStorage.getItem('finfood_token');
  const authHeader = token ? { Authorization: `Bearer ${token}` } : {};

  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...authHeader,
      ...options.headers,
    },
    ...options,
  };

  try {
    const res = await fetch(url, config);
    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || `Request failed with status ${res.status}`);
    }

    return data;
  } catch (err) {
    console.error(`API Error on ${endpoint}:`, err.message);
    throw err;
  }
}

export const api = {
  // Authentication
  register: (data) =>
    request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  login: (data) =>
    request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  forgotPassword: (data) =>
    request('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  resetPassword: (data) =>
    request('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getMe: () => request('/auth/me'),
  updateProfile: (data) =>
    request('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  uploadAvatar: (data) =>
    request('/auth/upload-avatar', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Dashboard
  getDashboard: (month, year, today) => {
    const params = new URLSearchParams();
    if (month) params.append('month', month);
    if (year) params.append('year', year);
    if (today) params.append('today', today);
    return request(`/dashboard?${params.toString()}`);
  },

  // Budget
  getBudget: (month, year) => {
    const params = new URLSearchParams();
    if (month) params.append('month', month);
    if (year) params.append('year', year);
    return request(`/monthly-budget?${params.toString()}`);
  },
  setBudget: (data) =>
    request('/monthly-budget', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateBudget: (id, data) =>
    request(`/monthly-budget/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  resetBudget: (id) =>
    request(`/monthly-budget/${id}`, {
      method: 'DELETE',
    }),

  // Expenses
  getExpenses: (filters = {}) => {
    const params = new URLSearchParams();
    Object.keys(filters).forEach((key) => {
      if (filters[key] !== undefined && filters[key] !== null && filters[key] !== '') {
        params.append(key, filters[key]);
      }
    });
    return request(`/expenses?${params.toString()}`);
  },
  createExpense: (data) =>
    request('/expenses', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateExpense: (id, data) =>
    request(`/expenses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteExpense: (id) =>
    request(`/expenses/${id}`, {
      method: 'DELETE',
    }),

  // Analytics
  getAnalytics: (month, year, today) => {
    const params = new URLSearchParams();
    if (month) params.append('month', month);
    if (year) params.append('year', year);
    if (today) params.append('today', today);
    return request(`/analytics?${params.toString()}`);
  },

  // Calendar
  getCalendar: (month, year) => {
    const params = new URLSearchParams();
    if (month) params.append('month', month);
    if (year) params.append('year', year);
    return request(`/calendar?${params.toString()}`);
  },

  // Categories
  getCategories: () => request('/categories'),
  createCategory: (data) =>
    request('/categories', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateCategory: (id, data) =>
    request(`/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteCategory: (id) =>
    request(`/categories/${id}`, {
      method: 'DELETE',
    }),
};
