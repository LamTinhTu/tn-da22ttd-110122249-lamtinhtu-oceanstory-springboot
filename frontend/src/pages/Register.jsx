import { useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { Link, useNavigate } from 'react-router-dom';
import { loginWithGoogle, register } from '../services/authService';

export default function Register() {
  const navigate = useNavigate();

  // Quan ly state form dang ky
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

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
    setSuccess('');

    try {
      await register(formData);
      setSuccess('Đăng ký thành công');

      // Delay nho de user nhin thay thong bao thanh cong
      setTimeout(() => {
        navigate('/login');
      }, 800);
    } catch (err) {
      if (!err?.response) {
        setError('Không kết nối được server backend. Hãy kiểm tra backend đang chạy ở cổng 8080.');
      } else {
        setError(err?.response?.data?.message || 'Đăng ký thất bại, vui lòng thử lại');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setLoading(true);
    setError('');

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
      if (!err?.response) {
        setError('Đăng ký bằng Google thất bại hoặc không kết nối được backend.');
      } else {
        const backendMessage = err?.response?.data?.message;
        setError(backendMessage || `Đăng ký bằng Google thất bại (HTTP ${err.response.status})`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleError = () => {
    setError('Google Login bị lỗi, vui lòng thử lại.');
  };

  return (
    <div className="auth-shell register-shell">
      <form className="auth-card register-card" onSubmit={handleSubmit}>
        <p className="auth-badge">Ocean Stories</p>
        <h1>Đăng ký</h1>
        <p className="auth-subtitle">Tạo tài khoản để bắt đầu đọc truyện</p>

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
          <label htmlFor="email">Email</label>
          <input
            id="email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Nhập email"
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
        {success && <p className="success-message">{success}</p>}

        <button type="submit" disabled={loading}>
          {loading ? 'Đang đăng ký...' : 'Đăng ký'}
        </button>

        <div className="google-login-wrapper">
          <GoogleLogin onSuccess={handleGoogleSuccess} onError={handleGoogleError} />
        </div>

        <p className="auth-note">Thông tin đăng ký được gửi qua REST API, mật khẩu không lưu ở frontend.</p>

        <p className="auth-link">
          Đã có tài khoản? <Link to="/login">Đăng nhập</Link>
        </p>
      </form>
    </div>
  );
}
