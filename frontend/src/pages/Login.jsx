import { useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { Link, useNavigate } from 'react-router-dom';
import { login, loginWithGoogle } from '../services/authService';

export default function Login() {
  const navigate = useNavigate();

  // Quan ly state form dang nhap
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await login(formData);
      const { token, role, username } = response.data;

      // Chi luu token va role, khong luu password
      localStorage.setItem('token', token);
      localStorage.setItem('role', role);
      localStorage.setItem('username', username || formData.username);

      navigate('/upload-story');
    } catch (err) {
      if (!err?.response) {
        setError('Không kết nối được server backend. Hãy kiểm tra backend đang chạy ở cổng 8080.');
      } else {
        setError(err?.response?.data?.message || 'Sai tài khoản hoặc mật khẩu');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setLoading(true);
    setError('');

    // Log de debug luong OAuth2 tu frontend.
    console.log('Google credentialResponse:', credentialResponse);

    try {
      const credential = credentialResponse?.credential;
      if (!credential) {
        throw new Error('Không lấy được credential từ Google');
      }

      const response = await loginWithGoogle(credential);
      const { token, role, username } = response.data;

      localStorage.setItem('token', token);
      localStorage.setItem('role', role);
      localStorage.setItem('username', username || 'google_user');

      navigate('/upload-story');
    } catch (err) {
      console.error('Google login error:', {
        status: err?.response?.status,
        data: err?.response?.data,
        message: err?.message
      });

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
    <div className="auth-shell login-shell">
      <form className="auth-card login-card" onSubmit={handleSubmit}>
        <p className="auth-badge">Ocean Stories</p>
        <h1>Đăng nhập</h1>
        <p className="auth-subtitle">Chào mừng bạn quay lại với Ocean Stories</p>

        <div className="field-group">
          <label htmlFor="username">Tên đăng nhập</label>
          <input
            id="username"
            name="username"
            type="text"
            value={formData.username}
            onChange={handleChange}
            placeholder="Nhập tên đăng nhập"
            required
          />
        </div>

        <div className="field-group">
          <label htmlFor="password">Mật khẩu</label>
          <input
            id="password"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Nhập mật khẩu"
            required
          />
        </div>

        {error && <p className="error-message">{error}</p>}

        <button type="submit" disabled={loading}>
          {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
        </button>

        <div className="google-login-wrapper">
          <GoogleLogin onSuccess={handleGoogleSuccess} onError={handleGoogleError} />
        </div>

        <p className="auth-note">Token sẽ được lưu vào localStorage để gửi Authorization Bearer ở các API sau.</p>

        <p className="auth-link">
          Chưa có tài khoản? <Link to="/register">Đăng ký</Link>
        </p>
      </form>
    </div>
  );
}
