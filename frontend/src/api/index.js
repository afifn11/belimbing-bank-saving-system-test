import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || '/api/v1',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const msg = err.response?.data?.message || 'Something went wrong';
    return Promise.reject(new Error(msg));
  }
);

// ── Customers ──────────────────────────────────────
export const getCustomers = () => api.get('/customers');
export const getCustomer = (id) => api.get(`/customers/${id}`);
export const createCustomer = (data) => api.post('/customers', data);
export const updateCustomer = (id, data) => api.put(`/customers/${id}`, data);
export const deleteCustomer = (id) => api.delete(`/customers/${id}`);

// ── Deposito Types ─────────────────────────────────
export const getDepositoTypes = () => api.get('/deposito-types');
export const getDepositoType = (id) => api.get(`/deposito-types/${id}`);
export const createDepositoType = (data) => api.post('/deposito-types', data);
export const updateDepositoType = (id, data) => api.put(`/deposito-types/${id}`, data);
export const deleteDepositoType = (id) => api.delete(`/deposito-types/${id}`);

// ── Accounts ───────────────────────────────────────
export const getAccounts = () => api.get('/accounts');
export const getAccount = (id) => api.get(`/accounts/${id}`);
export const getAccountsByCustomer = (customerId) => api.get(`/accounts/customer/${customerId}`);
export const createAccount = (data) => api.post('/accounts', data);
export const updateAccount = (id, data) => api.put(`/accounts/${id}`, data);
export const deleteAccount = (id) => api.delete(`/accounts/${id}`);

// ── Transactions ───────────────────────────────────
export const getTransactionHistory = (accountId) => api.get(`/transactions/account/${accountId}`);
export const deposit = (data) => api.post('/transactions/deposit', data);
export const withdraw = (data) => api.post('/transactions/withdraw', data);

export default api;
