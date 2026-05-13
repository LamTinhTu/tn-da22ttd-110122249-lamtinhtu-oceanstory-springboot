import { api, withAuth } from './apiClient';

// Goi API dang nhap
export const login = (data) => api.post('/auth/login', data);

// Goi API dang ky
export const register = (data) => api.post('/auth/register', data);

// Goi API dang nhap bang Google
export const loginWithGoogle = (token) => api.post('/auth/google', { token });

// Goi API dang xuat
export const logout = (token) => api.post('/auth/logout', {}, withAuth(token));

// Kiem tra trang thai ket noi backend va database
export const getConnectionStatus = () => api.get('/auth/connection-status');
