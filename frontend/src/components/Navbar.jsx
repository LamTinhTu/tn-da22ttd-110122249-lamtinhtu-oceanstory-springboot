import { useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import AuthModal from './AuthModal';
import { getRedirectPathByRole } from '../utils/authRedirect';

const categories = ['Ngôn tình', 'Kiếm hiệp', 'Fantasy', 'Học đường'];

export default function Navbar({ isLoggedIn, username, onLogout, onSearch, onSelectCategory, onAuthSuccess }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [keyword, setKeyword] = useState('');
  const [openCategory, setOpenCategory] = useState(false);
  const [openUserMenu, setOpenUserMenu] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState('login');
  const [pendingAction, setPendingAction] = useState(null); // 'write' | null

  const isHomePage = location.pathname === '/' || location.pathname === '/home';
  const isWritePage = location.pathname === '/upload-story' || location.pathname.startsWith('/my-stories');

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    onSearch(keyword.trim());
  };

  const handleWriteClick = () => {
    if (!isLoggedIn) {
      setMode('login');
      setPendingAction('write'); // Đánh dấu intent
      setIsOpen(true);
      return;
    }
    const storedRole = localStorage.getItem('role');
    navigate(getRedirectPathByRole(storedRole));
  };

  const handleAuthSuccess = (data) => {
    if (onAuthSuccess) {
      onAuthSuccess(data);
    }

    const redirectPath = getRedirectPathByRole(data?.role);
    // Nếu đang chờ action write:
    // - USER/VIP/... => /upload-story
    // - MODERATOR/ADMIN => dashboard tương ứng
    if (pendingAction === 'write') {
      setPendingAction(null);
      navigate(redirectPath);
      return;
    }

    // Nếu login từ Navbar nhưng không có pending action,
    // vẫn ưu tiên đưa MODERATOR/ADMIN về đúng dashboard.
    if (redirectPath !== '/upload-story') {
      navigate(redirectPath);
    }
  };

  const openLoginModal = () => {
    setMode('login');
    setIsOpen(true);
  };

  const openRegisterModal = () => {
    setMode('register');
    setIsOpen(true);
  };

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-pink-100 bg-white/85 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-7xl items-center gap-4 px-4 py-3 md:px-6">
        <Link to="/home" className="shrink-0 text-xl font-extrabold text-pink-500">
          Ocean Stories
        </Link>

        <nav className="hidden items-center gap-5 text-sm font-medium text-slate-700 md:flex">
          <NavLink
            to="/home"
            className={`transition-colors ${isHomePage ? 'text-pink-500' : 'text-slate-700 hover:text-pink-500'}`}
          >
            Trang chủ
          </NavLink>

          <div className="relative">
            <button
              type="button"
              className="hover:text-pink-500"
              onClick={() => setOpenCategory((prev) => !prev)}
            >
              Danh sách
            </button>
            {openCategory && (
              <div className="absolute left-0 mt-2 w-40 rounded-xl border border-pink-100 bg-white p-2 shadow-soft">
                {categories.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => {
                      onSelectCategory(item);
                      setOpenCategory(false);
                    }}
                    className="w-full rounded-lg px-3 py-2 text-left text-sm text-slate-700 hover:bg-pink-50"
                  >
                    {item}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={handleWriteClick}
            className={`transition-colors ${isWritePage ? 'text-pink-500' : 'hover:text-pink-500'}`}
          >
            Viết
          </button>
          <button type="button" className="hover:text-pink-500">Nạp ngọc</button>
        </nav>

        <form onSubmit={handleSearchSubmit} className="ml-auto hidden w-full max-w-md items-center md:flex">
          <input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="Tìm theo tên truyện hoặc tác giả"
            className="w-full rounded-xl border border-pink-100 bg-pink-50/60 px-4 py-2 text-sm outline-none ring-pink-200 transition focus:ring"
          />
        </form>

        <div className="relative ml-2">
          {!isLoggedIn ? (
            <div className="flex items-center gap-2 text-sm">
              <button
                type="button"
                className="rounded-lg px-3 py-2 text-slate-700 transition hover:bg-pink-50"
                onClick={openLoginModal}
              >
                Đăng nhập
              </button>
              <button
                type="button"
                className="rounded-lg bg-pink-400 px-3 py-2 font-semibold text-white transition hover:bg-pink-500"
                onClick={openRegisterModal}
              >
                Đăng ký
              </button>
            </div>
          ) : (
            <>
              <button
                type="button"
                className="rounded-full bg-pink-100 px-3 py-2 text-sm font-semibold text-pink-600"
                onClick={() => setOpenUserMenu((prev) => !prev)}
              >
                {username?.slice(0, 1)?.toUpperCase() || 'U'}
              </button>
              {openUserMenu && (
                <div className="absolute right-0 mt-2 w-40 rounded-xl border border-pink-100 bg-white p-2 shadow-soft">
                  <p className="px-3 py-2 text-xs text-slate-500">{username || 'Tài khoản'}</p>
                  <button
                    type="button"
                    onClick={onLogout}
                    className="w-full rounded-lg px-3 py-2 text-left text-sm text-red-500 hover:bg-red-50"
                  >
                    Logout
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

        <form onSubmit={handleSearchSubmit} className="mx-auto block w-full max-w-7xl px-4 pb-3 md:hidden">
          <input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="Tìm truyện hoặc tác giả"
            className="w-full rounded-xl border border-pink-100 bg-pink-50/60 px-4 py-2 text-sm outline-none ring-pink-200 transition focus:ring"
          />
        </form>
      </header>

      <AuthModal
        isOpen={isOpen}
        mode={mode}
        onClose={() => setIsOpen(false)}
        onAuthSuccess={handleAuthSuccess}
      />
    </>
  );
}
