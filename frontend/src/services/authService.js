import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8080/api/auth',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Goi API dang nhap
export const login = (data) => api.post('/login', data);

// Goi API dang ky
export const register = (data) => api.post('/register', data);

// Goi API dang nhap bang Google
export const loginWithGoogle = (token) => api.post('/google', { token });

// Goi API dang xuat
export const logout = (token) =>
  api.post(
    '/logout',
    {},
    {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  );

// Kiem tra trang thai ket noi backend va database
export const getConnectionStatus = () => api.get('/connection-status');
