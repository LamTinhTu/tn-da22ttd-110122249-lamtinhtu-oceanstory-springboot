import { useEffect, useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { login, register } from '../services/authService';

const initialLoginData = {
  username: '',
  password: ''
};

const initialRegisterData = {
  username: '',
  email: '',
  password: ''
};

export default function AuthModal({ isOpen, mode, onClose, onAuthSuccess }) {
  const [currentMode, setCurrentMode] = useState(mode);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loginData, setLoginData] = useState(initialLoginData);
  const [registerData, setRegisterData] = useState(initialRegisterData);

  useEffect(() => {
    setCurrentMode(mode);
  }, [mode, isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  const resetMessages = () => {
    setError('');
    setSuccess('');
  };

  const handleLoginChange = (e) => {
    setLoginData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleRegisterChange = (e) => {
    setRegisterData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const switchMode = () => {
    resetMessages();
    setCurrentMode((prev) => (prev === 'login' ? 'register' : 'login'));
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    resetMessages();

    try {
      const response = await login(loginData);
      const { token, role, username } = response.data;

      localStorage.setItem('token', token);
      localStorage.setItem('role', role);
      localStorage.setItem('username', username || loginData.username);

      if (onAuthSuccess) {
        onAuthSuccess({ token, role, username: username || loginData.username });
      }

      onClose();
    } catch (err) {
      if (!err?.response) {
        setError('Không kết nối được backend. Hãy kiểm tra server cổng 8080.');
      } else {
        setError(err?.response?.data?.message || 'Sai tài khoản hoặc mật khẩu.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    resetMessages();

    try {
      await register(registerData);
      setSuccess('Đăng ký thành công. Bạn có thể đăng nhập ngay.');
      setRegisterData(initialRegisterData);
      setCurrentMode('login');
    } catch (err) {
      if (!err?.response) {
        setError('Không kết nối được backend. Hãy kiểm tra server cổng 8080.');
      } else {
        setError(err?.response?.data?.message || 'Đăng ký thất bại, vui lòng thử lại.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setLoading(true);
    resetMessages();

    try {
      const credential = credentialResponse?.credential;
      if (!credential) {
        throw new Error('Không lấy được credential từ Google');
      }

      const { loginWithGoogle } = await import('../services/authService');
      const response = await loginWithGoogle(credential);
      const { token, role, username } = response.data;

      localStorage.setItem('token', token);
      localStorage.setItem('role', role);
      localStorage.setItem('username', username || 'google_user');

      if (onAuthSuccess) {
        onAuthSuccess({ token, role, username: username || 'google_user' });
      }

      onClose();
    } catch (err) {
      if (!err?.response) {
        setError('Đăng nhập Google thất bại hoặc không kết nối được backend.');
      } else {
        const backendMessage = err?.response?.data?.message;
        setError(backendMessage || `Đăng nhập Google thất bại (HTTP ${err.response.status})`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleError = () => {
    setError('Google Login bị lỗi, vui lòng thử lại.');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 py-6 backdrop-blur-sm md:items-center"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="my-auto w-full max-w-md rounded-xl bg-white p-6 shadow-lg animate-[modal-fade-in_220ms_ease-out] max-h-[90vh] overflow-y-auto md:p-8"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="mb-5 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">
              {currentMode === 'login' ? 'Đăng nhập' : 'Đăng ký'}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {currentMode === 'login'
                ? 'Đăng nhập để tiếp tục đọc và đăng truyện.'
                : 'Tạo tài khoản mới để bắt đầu ngay.'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-3 py-2 text-lg font-bold text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
            aria-label="Đóng modal"
          >
            X
          </button>
        </div>

        {error && (
          <div className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            {success}
          </div>
        )}

        {currentMode === 'login' ? (
          <form className="space-y-4" onSubmit={handleLoginSubmit}>
            <div>
              <label htmlFor="modal-login-username" className="mb-1 block text-sm font-medium text-slate-700">
                Tên đăng nhập
              </label>
              <input
                id="modal-login-username"
                name="username"
                type="text"
                value={loginData.username}
                onChange={handleLoginChange}
                required
                className="h-11 w-full rounded-lg border border-slate-200 px-3 outline-none transition focus:border-pink-300 focus:ring-2 focus:ring-pink-100"
                placeholder="Nhập tên đăng nhập"
              />
            </div>
            <div>
              <label htmlFor="modal-login-password" className="mb-1 block text-sm font-medium text-slate-700">
                Mật khẩu
              </label>
              <input
                id="modal-login-password"
                name="password"
                type="password"
                value={loginData.password}
                onChange={handleLoginChange}
                required
                className="h-11 w-full rounded-lg border border-slate-200 px-3 outline-none transition focus:border-pink-300 focus:ring-2 focus:ring-pink-100"
                placeholder="Nhập mật khẩu"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="h-11 w-full rounded-lg bg-pink-500 font-semibold text-white transition hover:bg-pink-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
            </button>

            <div className="pt-1">
              <GoogleLogin onSuccess={handleGoogleSuccess} onError={handleGoogleError} />
            </div>
          </form>
        ) : (
          <form className="space-y-4" onSubmit={handleRegisterSubmit}>
            <div>
              <label htmlFor="modal-register-username" className="mb-1 block text-sm font-medium text-slate-700">
                Tên đăng nhập
              </label>
              <input
                id="modal-register-username"
                name="username"
                type="text"
                value={registerData.username}
                onChange={handleRegisterChange}
                required
                className="h-11 w-full rounded-lg border border-slate-200 px-3 outline-none transition focus:border-pink-300 focus:ring-2 focus:ring-pink-100"
                placeholder="Nhập tên đăng nhập"
              />
            </div>
            <div>
              <label htmlFor="modal-register-email" className="mb-1 block text-sm font-medium text-slate-700">
                Email
              </label>
              <input
                id="modal-register-email"
                name="email"
                type="email"
                value={registerData.email}
                onChange={handleRegisterChange}
                required
                className="h-11 w-full rounded-lg border border-slate-200 px-3 outline-none transition focus:border-pink-300 focus:ring-2 focus:ring-pink-100"
                placeholder="Nhập email"
              />
            </div>
            <div>
              <label htmlFor="modal-register-password" className="mb-1 block text-sm font-medium text-slate-700">
                Mật khẩu
              </label>
              <input
                id="modal-register-password"
                name="password"
                type="password"
                value={registerData.password}
                onChange={handleRegisterChange}
                required
                className="h-11 w-full rounded-lg border border-slate-200 px-3 outline-none transition focus:border-pink-300 focus:ring-2 focus:ring-pink-100"
                placeholder="Nhập mật khẩu"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="h-11 w-full rounded-lg bg-pink-500 font-semibold text-white transition hover:bg-pink-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? 'Đang đăng ký...' : 'Đăng ký'}
            </button>

            <div className="pt-1">
              <GoogleLogin onSuccess={handleGoogleSuccess} onError={handleGoogleError} />
            </div>
          </form>
        )}

        <p className="mt-5 text-center text-sm text-slate-500">
          {currentMode === 'login' ? 'Chưa có tài khoản?' : 'Đã có tài khoản?'}{' '}
          <button type="button" onClick={switchMode} className="font-semibold text-pink-500 hover:text-pink-600">
            {currentMode === 'login' ? 'Đăng ký ngay' : 'Đăng nhập ngay'}
          </button>
        </p>
      </div>
    </div>
  );
}
