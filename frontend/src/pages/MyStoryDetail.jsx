import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import AuthModal from '../components/AuthModal';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { createChapter, getStoryChapters, getStoryDetail } from '../services/storyService';
import { getRedirectPathByRole } from '../utils/authRedirect';
import { resolveBackendUrl } from '../services/apiClient';

function formatDateTimeVi(isoLike) {
  if (!isoLike) return '—';
  const date = new Date(isoLike);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString('vi-VN');
}

function submissionLabel(submissionStatus) {
  const normalized = String(submissionStatus || '').toUpperCase();
  if (normalized === 'APPROVED') return 'Đã duyệt';
  if (normalized === 'SUBMITTED') return 'Chờ duyệt';
  if (normalized === 'REJECTED') return 'Từ chối';
  return 'Không rõ';
}

function normalizeImageUrl(value) {
  const url = String(value || '').trim();
  if (!url) return '';
  return resolveBackendUrl(url);
}

function excerpt(text, maxLen) {
  const raw = String(text || '').trim();
  if (!raw) return '';
  if (raw.length <= maxLen) return raw;
  return `${raw.slice(0, maxLen)}…`;
}

export default function MyStoryDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const justAuthenticatedRef = useRef(false);

  const storyId = useMemo(() => Number(id), [id]);

  const [authState, setAuthState] = useState(() => ({
    token: localStorage.getItem('token'),
    username: localStorage.getItem('username'),
    role: localStorage.getItem('role')
  }));
  const [authMode, setAuthMode] = useState('login');

  const isLoggedIn = Boolean(authState.token);

  const [loading, setLoading] = useState(false);
  const [story, setStory] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [toast, setToast] = useState('');

  const [chapterForm, setChapterForm] = useState({
    chapterNumber: '',
    title: '',
    content: ''
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

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

  async function loadAll(token, resolvedStoryId) {
    if (!token || !resolvedStoryId) return;
    setLoading(true);
    setToast('');

    try {
      const [storyData, chaptersData] = await Promise.all([
        getStoryDetail(resolvedStoryId, token),
        getStoryChapters(resolvedStoryId, token)
      ]);
      setStory(storyData || null);
      setChapters(Array.isArray(chaptersData) ? chaptersData : []);
    } catch (err) {
      setStory(null);
      setChapters([]);
      setToast(err?.response?.data?.message || 'Không tải được dữ liệu truyện.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!authState.token) return;
    loadAll(authState.token, storyId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authState.token, storyId]);

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

  const canCreateChapter = String(story?.submissionStatus || '').toUpperCase() === 'APPROVED';

  const sortedChapters = useMemo(() => {
    return [...(chapters || [])].sort((a, b) => {
      const aNum = Number(a?.chapterNumber || 0);
      const bNum = Number(b?.chapterNumber || 0);
      return aNum - bNum;
    });
  }, [chapters]);

  function validateChapter() {
    const nextErrors = {};

    const chapterNumberValue = Number(chapterForm.chapterNumber);
    if (!Number.isFinite(chapterNumberValue) || chapterNumberValue <= 0) {
      nextErrors.chapterNumber = 'Số chương phải là số nguyên lớn hơn 0';
    }

    if (!String(chapterForm.title || '').trim()) {
      nextErrors.title = 'Tiêu đề chương không được để trống';
    }

    if (!String(chapterForm.content || '').trim()) {
      nextErrors.content = 'Nội dung chương không được để trống';
    }

    return nextErrors;
  }

  async function handleCreateChapter(e) {
    e.preventDefault();
    setToast('');

    if (!canCreateChapter) {
      setToast('Chỉ có thể thêm chương khi truyện đã được duyệt.');
      return;
    }

    const nextErrors = validateChapter();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    setSubmitting(true);
    try {
      const payload = {
        chapterNumber: Number(chapterForm.chapterNumber),
        title: chapterForm.title.trim(),
        content: chapterForm.content.trim()
      };

      await createChapter(storyId, payload, authState.token);
      setChapterForm({ chapterNumber: '', title: '', content: '' });
      setErrors({});
      await loadAll(authState.token, storyId);
    } catch (err) {
      setToast(err?.response?.data?.message || 'Không tạo được chương mới.');
    } finally {
      setSubmitting(false);
    }
  }

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

  const cover = normalizeImageUrl(story?.coverImage);

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
                  <h1 className="text-xl font-extrabold text-slate-800">Chi tiết tác phẩm</h1>
                  <p className="mt-1 text-sm text-slate-600">
                    <span className="font-semibold text-slate-700">Trạng thái:</span> {submissionLabel(story?.submissionStatus)}
                  </p>
                </div>

                <div className="flex gap-2">
                  <Link
                    to="/my-stories"
                    className="h-10 rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Quay lại
                  </Link>
                  <button
                    type="button"
                    onClick={() => loadAll(authState.token, storyId)}
                    className="h-10 rounded-lg bg-pink-500 px-4 text-sm font-semibold text-white hover:bg-pink-600"
                    disabled={loading}
                  >
                    {loading ? 'Đang tải...' : 'Tải lại'}
                  </button>
                </div>
              </div>

              {toast && (
                <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{toast}</div>
              )}

              {!loading && !story ? (
                <div className="mt-5 rounded-xl border border-slate-200 bg-white px-4 py-5 text-sm text-slate-600">Không có dữ liệu truyện.</div>
              ) : null}

              {story ? (
                <div className="mt-5 flex flex-col gap-4 md:flex-row">
                  <div className="h-40 w-32 shrink-0 overflow-hidden rounded-2xl border border-pink-100 bg-pink-50">
                    {cover ? (
                      <img src={cover} alt={story?.title || 'Cover'} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xs font-semibold text-pink-400">No cover</div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <h2 className="text-lg font-bold text-slate-800">{story?.title || '—'}</h2>
                    <div className="mt-2 grid gap-2 text-sm text-slate-700 sm:grid-cols-2">
                      <p>
                        <span className="font-semibold text-slate-600">Loại hình:</span> {story?.type || '—'}
                      </p>
                      <p>
                        <span className="font-semibold text-slate-600">Thể loại:</span> {story?.genres || '—'}
                      </p>
                      <p>
                        <span className="font-semibold text-slate-600">Chủ đề:</span> {story?.topics || '—'}
                      </p>
                      <p>
                        <span className="font-semibold text-slate-600">Cập nhật:</span> {formatDateTimeVi(story?.updatedAt)}
                      </p>
                    </div>

                    <p className="mt-3 text-sm text-slate-700">{story?.description || '—'}</p>

                    {String(story?.submissionStatus || '').toUpperCase() === 'REJECTED' && story?.adminNotes ? (
                      <div className="mt-3 rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                        <span className="font-semibold">Ghi chú admin:</span> {story.adminNotes}
                      </div>
                    ) : null}
                  </div>
                </div>
              ) : null}
            </section>

            <section className="rounded-2xl border border-pink-100 bg-white/80 p-5 shadow-soft backdrop-blur">
              <h3 className="text-base font-bold text-slate-800">Danh sách chương</h3>
              <p className="mt-1 text-sm text-slate-600">Chỉ thêm chương khi truyện đã được duyệt.</p>

              <div className="mt-4 space-y-3">
                {sortedChapters.length === 0 ? (
                  <div className="rounded-xl border border-slate-200 bg-white px-4 py-5 text-sm text-slate-600">Chưa có chương nào.</div>
                ) : (
                  sortedChapters.map((ch) => (
                    <div key={ch?.id} className="rounded-2xl border border-pink-100 bg-white p-4">
                      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-sm font-bold text-slate-800">
                          Chương {ch?.chapterNumber || '—'}: {ch?.title || '—'}
                        </p>
                        <p className="text-xs text-slate-500">Tạo: {formatDateTimeVi(ch?.createdAt)}</p>
                      </div>
                      {ch?.moderationStatus ? (
                        <p className="mt-1 text-xs text-slate-500">Trạng thái chương: {String(ch.moderationStatus).toUpperCase()}</p>
                      ) : null}
                      {ch?.violationNote ? (
                        <div className="mt-2 rounded-xl border border-rose-100 bg-rose-50 px-3 py-2 text-xs text-rose-700">
                          Ghi chú vi phạm: {ch.violationNote}
                        </div>
                      ) : null}
                      {ch?.content ? (
                        <p className="mt-2 text-sm text-slate-700">{excerpt(ch.content, 180)}</p>
                      ) : null}
                    </div>
                  ))
                )}
              </div>
            </section>

            <section className="rounded-2xl border border-pink-100 bg-white/80 p-5 shadow-soft backdrop-blur">
              <h3 className="text-base font-bold text-slate-800">Thêm chương mới</h3>

              {!canCreateChapter ? (
                <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                  Truyện đang ở trạng thái <span className="font-semibold">{submissionLabel(story?.submissionStatus)}</span>. Bạn chỉ có thể thêm chương sau khi truyện được duyệt.
                </div>
              ) : null}

              <form onSubmit={handleCreateChapter} className="mt-4 space-y-4">
                <div className="grid gap-4 sm:grid-cols-3">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700">Số chương</label>
                    <input
                      value={chapterForm.chapterNumber}
                      onChange={(e) => setChapterForm((p) => ({ ...p, chapterNumber: e.target.value }))}
                      className="mt-1 h-11 w-full rounded-xl border border-pink-100 bg-white px-3 text-sm outline-none ring-pink-200 transition focus:ring"
                      placeholder="Ví dụ: 1"
                      inputMode="numeric"
                      disabled={!canCreateChapter || submitting}
                    />
                    {errors.chapterNumber ? <p className="mt-1 text-xs text-rose-600">{errors.chapterNumber}</p> : null}
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-sm font-semibold text-slate-700">Tiêu đề chương</label>
                    <input
                      value={chapterForm.title}
                      onChange={(e) => setChapterForm((p) => ({ ...p, title: e.target.value }))}
                      className="mt-1 h-11 w-full rounded-xl border border-pink-100 bg-white px-3 text-sm outline-none ring-pink-200 transition focus:ring"
                      placeholder="Nhập tiêu đề chương"
                      disabled={!canCreateChapter || submitting}
                    />
                    {errors.title ? <p className="mt-1 text-xs text-rose-600">{errors.title}</p> : null}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700">Nội dung</label>
                  <textarea
                    value={chapterForm.content}
                    onChange={(e) => setChapterForm((p) => ({ ...p, content: e.target.value }))}
                    className="mt-1 min-h-[160px] w-full rounded-xl border border-pink-100 bg-white px-3 py-3 text-sm outline-none ring-pink-200 transition focus:ring"
                    placeholder="Nhập nội dung chương"
                    disabled={!canCreateChapter || submitting}
                  />
                  {errors.content ? <p className="mt-1 text-xs text-rose-600">{errors.content}</p> : null}
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={!canCreateChapter || submitting}
                    className="h-11 rounded-xl bg-pink-500 px-5 text-sm font-semibold text-white hover:bg-pink-600 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {submitting ? 'Đang tạo...' : 'Tạo chương'}
                  </button>
                </div>
              </form>
            </section>
          </main>
        </div>
      </div>
    </div>
  );
}
