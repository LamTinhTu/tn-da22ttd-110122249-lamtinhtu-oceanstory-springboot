import React from 'react';
import ReactDOM from 'react-dom/client';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './styles.css';

const googleClientId = (import.meta.env.VITE_GOOGLE_CLIENT_ID || '').trim();

if (!googleClientId) {
  console.warn('Thiếu VITE_GOOGLE_CLIENT_ID. Đăng nhập Google sẽ không hoạt động.');
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={googleClientId || 'missing-client-id'}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </GoogleOAuthProvider>
  </React.StrictMode>
);
