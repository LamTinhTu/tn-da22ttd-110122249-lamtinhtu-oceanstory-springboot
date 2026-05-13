import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthModal from '../components/AuthModal';
import CreateStory from '../components/CreateStory';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { getMyStories } from '../services/storyService';
import { resolveBackendUrl } from '../services/apiClient';
import { getRedirectPathByRole } from '../utils/authRedirect';

function formatDateTimeVi(isoLike) {
  if (!isoLike) return '—';
  const date = new Date(isoLike);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString('vi-VN');
}

function submissionBadge(submissionStatus) {
  const normalized = String(submissionStatus || '').toUpperCase();
  if (normalized === 'APPROVED') return { label: 'Đã duyệt', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
  if (normalized === 'SUBMITTED') return { label: 'Chờ duyệt', cls: 'bg-amber-50 text-amber-700 border-amber-200' };
  if (normalized === 'REJECTED') return { label: 'Từ chối', cls: 'bg-rose-50 text-rose-700 border-rose-200' };
  return { label: 'Không rõ', cls: 'bg-slate-100 text-slate-700 border-slate-200' };
}

function normalizeImageUrl(value) {
  const url = String(value || '').trim();
  if (!url) return '';
  return resolveBackendUrl(url);
}

function excerpt(text, maxLen) {
  const raw = String(text || '').trim();
  if (!raw) return '—';
  if (raw.length <= maxLen) return raw;
  return `${raw.slice(0, maxLen)}…`;
}

export default function MyStories() {
  const navigate = useNavigate();
  const justAuthenticatedRef = useRef(false);

  const [authState, setAuthState] = useState(() => ({
    token: localStorage.getItem('token'),
    username: localStorage.getItem('username'),
    role: localStorage.getItem('role')
  }));
  const [authMode, setAuthMode] = useState('login');

  const [loading, setLoading] = useState(false);
  const [stories, setStories] = useState([]);
  const [toast, setToast] = useState('');

  const isLoggedIn = Boolean(authState.token);

  useEffect(() => {
    if (!authState.token) return;
    const redirectPath = getRedirectPathByRole(authState.role);
    if (redirectPath !== '/my-stories') {
      navigate(redirectPath, { replace: true });
    }
  }, [authState.token, authState.role, navigate]);

  useEffect(() => {
    const handleStorageChange = () => {
      const newToken = localStorage.getItem('token');
      const newUsername = localStorage.getItem('username');
      const newRole = localStorage.getItem('role');
      setAuthState({ token: newToken, username: newUsername, role: newRole });
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  async function loadStories(token) {
    if (!token) return;
    setLoading(true);
    try {
      const data = await getMyStories(token);
      setStories(Array.isArray(data) ? data : []);
    } catch (err) {
      setStories([]);
      setToast(err?.response?.data?.message || 'Không tải được danh sách tác phẩm.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!authState.token) return;
    loadStories(authState.token);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authState.token]);

  const handleAuthSuccess = ({ token, role, username }) => {
    localStorage.setItem('token', token);
    localStorage.setItem('username', username);
    if (role) {
      localStorage.setItem('role', role);
    }
    setAuthState({ token, username, role });
    justAuthenticatedRef.current = true;

    const redirectPath = getRedirectPathByRole(role);
    if (redirectPath !== '/my-stories') {
      navigate(redirectPath);
    }
  };

  const handleModalClose = () => {
    if (justAuthenticatedRef.current) {
      justAuthenticatedRef.current = false;
      return;
    }
    navigate('/home');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    localStorage.removeItem('role');
    setAuthState({ token: null, username: null, role: null });
    navigate('/home');
  };

  const sortedStories = useMemo(() => {
    return [...(stories || [])].sort((a, b) => {
      const aTime = a?.updatedAt ? new Date(a.updatedAt).getTime() : 0;
      const bTime = b?.updatedAt ? new Date(b.updatedAt).getTime() : 0;
      return bTime - aTime;
    });
  }, [stories]);

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar isLoggedIn={false} onSearch={() => {}} onSelectCategory={() => {}} />
        <div className="flex min-h-[calc(100vh-60px)] items-center justify-center">
          <AuthModal isOpen={true} mode={authMode} onClose={handleModalClose} onAuthSuccess={handleAuthSuccess} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pastel-50 via-pink-50 to-white">
      <Navbar
        isLoggedIn={true}
        username={authState.username}
        onLogout={handleLogout}
        onSearch={() => {}}
        onSelectCategory={() => {}}
      />

      <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6 md:px-6">
        <div className="flex gap-6">
          <Sidebar />

          <main className="min-w-0 flex-1 space-y-6">
            <section className="rounded-2xl border border-pink-100 bg-white/80 p-5 shadow-soft backdrop-blur">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h1 className="text-xl font-extrabold text-slate-800">Tác phẩm của tôi</h1>
                  <p className="mt-1 text-sm text-slate-600">Danh sách tác phẩm bạn đã gửi kiểm duyệt.</p>
                </div>

                <button
                  type="button"
                  onClick={() => loadStories(authState.token)}
                  className="h-10 rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  disabled={loading}
                >
                  {loading ? 'Đang tải...' : 'Tải lại'}
                </button>
              </div>

              {toast && (
                <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{toast}</div>
              )}

              <div className="mt-5 grid gap-4 lg:grid-cols-2">
                {loading ? (
                  <div className="rounded-xl border border-slate-200 bg-white px-4 py-5 text-sm text-slate-600">Đang tải dữ liệu...</div>
                ) : sortedStories.length === 0 ? (
                  <div className="rounded-xl border border-slate-200 bg-white px-4 py-5 text-sm text-slate-600">
                    Chưa có tác phẩm nào. Bạn có thể gửi tác phẩm kiểm duyệt ở phần bên dưới.
                  </div>
                ) : (
                  sortedStories.map((story) => {
                    const badge = submissionBadge(story?.submissionStatus);
                    const cover = normalizeImageUrl(story?.coverImage);

                    return (
                      <article key={story?.id} className="overflow-hidden rounded-2xl border border-pink-100 bg-white">
                        <div className="flex gap-4 p-4">
                          <div className="h-24 w-20 shrink-0 overflow-hidden rounded-xl border border-pink-100 bg-pink-50">
                            {cover ? (
                              <img src={cover} alt={story?.title || 'Cover'} className="h-full w-full object-cover" />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-xs font-semibold text-pink-400">No cover</div>
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <h3 className="truncate text-base font-bold text-slate-800">{story?.title || '—'}</h3>
                                <p className="mt-1 text-xs text-slate-500">Cập nhật: {formatDateTimeVi(story?.updatedAt)}</p>
                              </div>

                              <span className={`shrink-0 rounded-full border px-3 py-1 text-xs font-semibold ${badge.cls}`}>{badge.label}</span>
                            </div>

                            <p className="mt-2 text-sm text-slate-700">{excerpt(story?.description, 140)}</p>

                            {String(story?.submissionStatus || '').toUpperCase() === 'REJECTED' && story?.adminNotes ? (
                              <div className="mt-2 rounded-xl border border-rose-100 bg-rose-50 px-3 py-2 text-xs text-rose-700">
                                Ghi chú admin: {story.adminNotes}
                              </div>
                            ) : null}

                            <div className="mt-3 flex items-center justify-between gap-3">
                              <p className="text-xs text-slate-500">{story?.genres ? `Thể loại: ${story.genres}` : 'Thể loại: —'}</p>
                              <Link
                                to={`/my-stories/${story?.id}`}
                                className="rounded-lg bg-pink-500 px-3 py-2 text-xs font-semibold text-white hover:bg-pink-600"
                              >
                                Quản lý chương
                              </Link>
                            </div>
                          </div>
                        </div>
                      </article>
                    );
                  })
                )}
              </div>
            </section>

            <section>
              <CreateStory
                onCreated={() => {
                  setToast('');
                  loadStories(authState.token);
                }}
              />
            </section>
          </main>
        </div>
      </div>
    </div>
  );
}
