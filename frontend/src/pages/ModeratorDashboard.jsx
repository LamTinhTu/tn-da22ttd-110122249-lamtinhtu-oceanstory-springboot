import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getRedirectPathByRole } from '../utils/authRedirect';
import {
  adminSendSystemNotification,
  adminCreateCategory,
  adminCreateTag,
  adminDeleteCategory,
  adminDeleteComment,
  adminDeleteTag,
  adminHideComment,
  getMyNotificationDetail,
  getMyUnreadNotificationCount,
  adminListCategories,
  adminListComments,
  listMyNotifications,
  adminListTags,
  adminUnhideComment,
  adminUpdateCategory,
  adminUpdateTag,
  updateMyNotificationReadState
} from '../services/adminService';
import ModerationLogsPanel from '../components/ModerationLogsPanel';
import {
  fetchChaptersByStoryId,
  fetchPendingStoriesForModeration,
  fetchStoriesForModeration,
  reviewStoryModeration,
  updateChapterModeration
} from '../services/moderatorService';

const SIDEBAR_ITEMS = [
  { key: 'overview', label: 'Tổng quan' },
  { key: 'stories', label: 'Quản lý truyện' },
  { key: 'chapters', label: 'Quản lý chương theo truyện' },
  { key: 'reports', label: 'Báo cáo vi phạm' },
  { key: 'comments', label: 'Quản lý bình luận' },
  { key: 'tags', label: 'Quản lý tag & thể loại' },
  { key: 'notifications', label: 'Thông báo hệ thống' },
  { key: 'logs', label: 'Nhật ký kiểm duyệt' }
];

const CHAPTER_FILTERS = [
  { key: 'ALL', label: 'Tất cả' },
  { key: 'PENDING', label: 'Chờ duyệt' },
  { key: 'APPROVED', label: 'Đã duyệt' },
  { key: 'REPORTED', label: 'Bị báo cáo' },
  { key: 'HIDDEN', label: 'Bị ẩn' }
];

const NOTIFICATION_TYPE_OPTIONS = [
  { value: '', label: 'Tất cả loại' },
  { value: 'SYSTEM', label: 'Hệ thống' },
  { value: 'STORY_APPROVED', label: 'Truyện đã duyệt' },
  { value: 'STORY_REJECTED', label: 'Truyện bị từ chối' },
  { value: 'CHAPTER_APPROVED', label: 'Chương đã duyệt' },
  { value: 'CHAPTER_REJECTED', label: 'Chương bị từ chối' },
  { value: 'WARNING', label: 'Cảnh báo' },
  { value: 'VIP_RENEWED', label: 'Gia hạn VIP' },
  { value: 'VIP_CANCELED', label: 'Hủy VIP' }
];

const NOTIFICATION_READ_OPTIONS = [
  { value: 'ALL', label: 'Tất cả trạng thái' },
  { value: 'UNREAD', label: 'Chưa đọc' },
  { value: 'READ', label: 'Đã đọc' }
];

function notificationTypeBadge(type) {
  const normalized = String(type || 'SYSTEM').toUpperCase();
  if (normalized === 'SYSTEM') return { label: 'Hệ thống', cls: 'bg-pink-50 text-pink-700 border-pink-200' };
  if (normalized === 'WARNING') return { label: 'Cảnh báo', cls: 'bg-rose-50 text-rose-700 border-rose-200' };
  if (normalized.endsWith('APPROVED')) return { label: 'Đã duyệt', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
  if (normalized.endsWith('REJECTED')) return { label: 'Từ chối', cls: 'bg-rose-50 text-rose-700 border-rose-200' };
  if (normalized.startsWith('VIP_')) return { label: 'VIP', cls: 'bg-amber-50 text-amber-700 border-amber-200' };
  return { label: normalized, cls: 'bg-slate-100 text-slate-700 border-slate-200' };
}

function normalizeText(value) {
  return String(value || '').toLowerCase().trim();
}

function formatDateVi(isoLike) {
  if (!isoLike) return '—';
  const date = new Date(isoLike);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
}

function formatDateTimeVi(isoLike) {
  if (!isoLike) return '—';
  const date = new Date(isoLike);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString('vi-VN');
}

function statusBadge(status) {
  const normalized = String(status || '').toUpperCase();
  if (normalized === 'APPROVED') return { label: 'Đã duyệt', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
  if (normalized === 'PENDING') return { label: 'Chờ duyệt', cls: 'bg-amber-50 text-amber-700 border-amber-200' };
  if (normalized === 'REJECTED') return { label: 'Từ chối', cls: 'bg-rose-50 text-rose-700 border-rose-200' };
  if (normalized === 'HIDDEN') return { label: 'Đã ẩn', cls: 'bg-slate-100 text-slate-700 border-slate-200' };
  return { label: 'Không rõ', cls: 'bg-slate-100 text-slate-700 border-slate-200' };
}

function storyStatusLabel(story) {
  const submissionStatus = String(story?.submissionStatus || '').toUpperCase();
  if (submissionStatus === 'SUBMITTED') return 'Đang chờ duyệt';
  if (submissionStatus === 'APPROVED') return 'Đã duyệt';
  if (submissionStatus === 'REJECTED') return 'Bị từ chối';
  return story?.category ? `Danh mục: ${story.category}` : '—';
}

function commentStatusBadge(comment) {
  const isHidden = Boolean(comment?.isHidden);
  const isLocked = Boolean(comment?.isLocked);
  if (isHidden && isLocked) return { label: 'Đã ẩn/khóa', cls: 'bg-slate-100 text-slate-700 border-slate-200' };
  if (isHidden) return { label: 'Đã ẩn', cls: 'bg-slate-100 text-slate-700 border-slate-200' };
  if (isLocked) return { label: 'Đã khóa', cls: 'bg-amber-50 text-amber-700 border-amber-200' };
  return { label: 'Đang hoạt động', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
}

function taxonomyStatusBadge(item) {
  if (item?.deletedAt) return { label: 'Đã xóa', cls: 'bg-rose-50 text-rose-700 border-rose-200' };
  if (item?.isActive) return { label: 'Đang bật', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
  return { label: 'Tạm tắt', cls: 'bg-amber-50 text-amber-700 border-amber-200' };
}

function Dialog({ open, title, children, primaryLabel, onPrimary, secondaryLabel, onSecondary, danger }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-xl rounded-2xl border border-pink-100 bg-white shadow-soft">
        <div className="flex items-start justify-between gap-3 border-b border-pink-50 px-5 py-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-800">{title}</h3>
          </div>
          <button
            type="button"
            onClick={onSecondary}
            className="rounded-lg px-2 py-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            aria-label="Đóng"
          >
            ✕
          </button>
        </div>

        <div className="px-5 py-4">{children}</div>

        <div className="flex flex-col-reverse gap-2 border-t border-pink-50 px-5 py-4 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onSecondary}
            className="h-10 rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            {secondaryLabel || 'Hủy'}
          </button>
          <button
            type="button"
            onClick={onPrimary}
            className={
              danger
                ? 'h-10 rounded-lg bg-rose-600 px-4 text-sm font-semibold text-white hover:bg-rose-700'
                : 'h-10 rounded-lg bg-pink-500 px-4 text-sm font-semibold text-white hover:bg-pink-600'
            }
          >
            {primaryLabel || 'Xác nhận'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ModeratorDashboard({ initialTab } = {}) {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const role = String(localStorage.getItem('role') || '').toUpperCase().trim();
  const username = localStorage.getItem('username');

  const [activeKey, setActiveKey] = useState(() => {
    const wanted = String(initialTab || '').trim();
    return SIDEBAR_ITEMS.some((i) => i.key === wanted) ? wanted : 'chapters';
  });
  const [globalSearch, setGlobalSearch] = useState('');

  // Stories for chapter moderation (picker).
  const [loadingStories, setLoadingStories] = useState(true);
  const [stories, setStories] = useState([]);
  const [selectedStoryId, setSelectedStoryId] = useState(null);

  // Pending stories (story moderation).
  const [loadingPendingStories, setLoadingPendingStories] = useState(false);
  const [pendingStories, setPendingStories] = useState([]);
  const [storyDialog, setStoryDialog] = useState({ open: false, type: null, storyId: null });
  const [storyDialogNote, setStoryDialogNote] = useState('');

  const [loadingChapters, setLoadingChapters] = useState(false);
  const [chapters, setChapters] = useState([]);

  const [chapterFilter, setChapterFilter] = useState('ALL');
  const [chapterSearch, setChapterSearch] = useState('');

  const [page, setPage] = useState(1);
  const pageSize = 8;

  const [toast, setToast] = useState('');

  const [dialog, setDialog] = useState({ open: false, type: null, chapterId: null });
  const [dialogNote, setDialogNote] = useState('');
  const [dialogStatus, setDialogStatus] = useState('PENDING');
  const [chapterPreview, setChapterPreview] = useState({ open: false, chapter: null });

  // ── Comments tab state ───────────────────────────────────────────────────
  const [commentQ, setCommentQ] = useState('');
  const [commentFilter, setCommentFilter] = useState('ALL'); // ALL | ACTIVE | LOCKED | HIDDEN
  const [commentPage, setCommentPage] = useState(0);
  const commentSize = 10;
  const [commentLoading, setCommentLoading] = useState(false);
  const [commentError, setCommentError] = useState('');
  const [commentData, setCommentData] = useState({ content: [], page: 0, size: commentSize, totalElements: 0, totalPages: 0 });
  const [commentDialog, setCommentDialog] = useState({ open: false, type: null, comment: null });
  const [commentDialogReason, setCommentDialogReason] = useState('');
  const [commentSubmittingId, setCommentSubmittingId] = useState(null);

  // ── Tags/Categories tab state ───────────────────────────────────────────
  const [categoryQ, setCategoryQ] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL'); // ALL | ACTIVE | INACTIVE | DELETED
  const [categoryLoading, setCategoryLoading] = useState(false);
  const [categoryError, setCategoryError] = useState('');
  const [categoryData, setCategoryData] = useState({ content: [], totalElements: 0 });

  const [tagQ, setTagQ] = useState('');
  const [tagFilter, setTagFilter] = useState('ALL'); // ALL | ACTIVE | INACTIVE | DELETED
  const [tagLoading, setTagLoading] = useState(false);
  const [tagError, setTagError] = useState('');
  const [tagData, setTagData] = useState({ content: [], totalElements: 0 });

  const [taxonomyDialog, setTaxonomyDialog] = useState({ open: false, type: null, entity: null, item: null });
  const [taxonomyForm, setTaxonomyForm] = useState({ name: '', slug: '', isActive: true });
  const [taxonomySubmitting, setTaxonomySubmitting] = useState(false);

  // ── Notifications tab state ─────────────────────────────────────────────
  const [notifType, setNotifType] = useState('');
  const [notifReadFilter, setNotifReadFilter] = useState('ALL'); // ALL | UNREAD | READ
  const [notifPage, setNotifPage] = useState(0);
  const notifSize = 10;
  const [notifLoading, setNotifLoading] = useState(false);
  const [notifError, setNotifError] = useState('');
  const [notifUnreadCount, setNotifUnreadCount] = useState(0);
  const [notifData, setNotifData] = useState({ content: [], page: 0, size: notifSize, totalElements: 0, totalPages: 0 });
  const [notifReloadSeq, setNotifReloadSeq] = useState(0);
  const [notifDetail, setNotifDetail] = useState({ open: false, loading: false, error: '', data: null });
  const [notifSendForm, setNotifSendForm] = useState({ type: 'SYSTEM', title: '', message: '', metaText: '' });
  const [notifSending, setNotifSending] = useState(false);

  // Guard: MODERATOR only.
  useEffect(() => {
    if (!token) {
      navigate('/login', { replace: true });
      return;
    }
    if (role !== 'MODERATOR') {
      navigate(getRedirectPathByRole(role), { replace: true });
    }
  }, [token, role, navigate]);

  useEffect(() => {
    if (activeKey !== 'notifications') return;
    setNotifPage(0);
  }, [activeKey, notifType, notifReadFilter]);

  useEffect(() => {
    let alive = true;

    if (activeKey !== 'notifications') {
      return () => {
        alive = false;
      };
    }

    async function loadNotifications() {
      try {
        setNotifLoading(true);
        setNotifError('');

        const isRead = notifReadFilter === 'READ' ? true : notifReadFilter === 'UNREAD' ? false : undefined;
        const [pageRes, countRes] = await Promise.all([
          listMyNotifications({ token, page: notifPage, size: notifSize, type: notifType || undefined, isRead }),
          getMyUnreadNotificationCount({ token })
        ]);
        if (!alive) return;

        setNotifData(
          pageRes || {
            content: [],
            page: notifPage,
            size: notifSize,
            totalElements: 0,
            totalPages: 0
          }
        );
        setNotifUnreadCount(Number(countRes?.unreadCount || 0));
      } catch (err) {
        if (!alive) return;
        setNotifData({ content: [], page: 0, size: notifSize, totalElements: 0, totalPages: 0 });
        setNotifUnreadCount(0);
        setNotifError('Không tải được danh sách thông báo.');
      } finally {
        if (alive) setNotifLoading(false);
      }
    }

    loadNotifications();

    return () => {
      alive = false;
    };
  }, [activeKey, token, notifPage, notifType, notifReadFilter, notifReloadSeq]);

  async function openNotificationDetail(item) {
    const id = item?.id;
    if (!id) return;
    try {
      setNotifDetail({ open: true, loading: true, error: '', data: null });
      const data = await getMyNotificationDetail({ token, id });
      setNotifDetail({ open: true, loading: false, error: '', data });
    } catch (err) {
      setNotifDetail({ open: true, loading: false, error: 'Không tải được chi tiết thông báo.', data: null });
    }
  }

  async function toggleNotificationRead(item, wantedRead) {
    const id = item?.id;
    if (!id) return;
    try {
      await updateMyNotificationReadState({ token, id, isRead: Boolean(wantedRead) });
      setNotifReloadSeq((x) => x + 1);
      setToast(Boolean(wantedRead) ? 'Đã đánh dấu đã đọc.' : 'Đã đánh dấu chưa đọc.');
      setNotifDetail((prev) => {
        if (!prev?.open || !prev?.data || String(prev.data.id) !== String(id)) return prev;
        return { ...prev, data: { ...prev.data, isRead: Boolean(wantedRead) } };
      });
    } catch (err) {
      setToast('Không cập nhật được trạng thái đã đọc.');
    }
  }

  async function submitSystemNotification() {
    if (role !== 'ADMIN') return;
    const title = String(notifSendForm.title || '').trim();
    const message = String(notifSendForm.message || '').trim();
    const type = String(notifSendForm.type || 'SYSTEM').trim().toUpperCase();
    const metaRaw = String(notifSendForm.metaText || '').trim();

    if (!title || !message) {
      setToast('Vui lòng nhập tiêu đề và nội dung.');
      return;
    }

    let meta;
    if (metaRaw) {
      try {
        meta = JSON.parse(metaRaw);
      } catch {
        setToast('Meta phải là JSON hợp lệ (hoặc để trống).');
        return;
      }
    }

    try {
      setNotifSending(true);
      const res = await adminSendSystemNotification({ token, type, title, message, meta });
      const created = Number(res?.createdCount || 0);
      setToast(`Đã gửi thông báo hệ thống (${created.toLocaleString('vi-VN')} người nhận).`);
      setNotifSendForm({ type: 'SYSTEM', title: '', message: '', metaText: '' });
      setNotifReloadSeq((x) => x + 1);
    } catch (err) {
      setToast('Gửi thông báo thất bại.');
    } finally {
      setNotifSending(false);
    }
  }

  useEffect(() => {
    let alive = true;

    if (activeKey !== 'chapters') {
      return () => {
        alive = false;
      };
    }

    async function load() {
      try {
        setLoadingStories(true);
        const keyword = globalSearch.trim() ? globalSearch.trim() : undefined;
        const data = await fetchStoriesForModeration({ token, keyword });
        if (!alive) return;

        const normalized = (Array.isArray(data) ? data : []).map((s) => ({
          ...s,
          authorName: s?.authorName || s?.author
        }));

        setStories(normalized);
        setSelectedStoryId((prev) => {
          if (prev && normalized.some((s) => String(s.id) === String(prev))) {
            return prev;
          }
          return normalized[0]?.id ?? null;
        });
      } catch (err) {
        if (!alive) return;
        setStories([]);
        setSelectedStoryId(null);
        setToast('Không tải được danh sách truyện. Đang hiển thị rỗng.');
      } finally {
        if (alive) setLoadingStories(false);
      }
    }

    load();
    return () => {
      alive = false;
    };
  }, [activeKey, token, globalSearch]);

  useEffect(() => {
    let alive = true;

    if (activeKey !== 'stories') {
      return () => {
        alive = false;
      };
    }

    async function loadPendingStories() {
      try {
        setLoadingPendingStories(true);
        const keyword = globalSearch.trim() ? globalSearch.trim() : undefined;
        const data = await fetchPendingStoriesForModeration({ token, keyword });
        if (!alive) return;
        setPendingStories(Array.isArray(data) ? data : []);
      } catch (err) {
        if (!alive) return;
        setPendingStories([]);
        setToast('Không tải được danh sách truyện chờ duyệt.');
      } finally {
        if (alive) setLoadingPendingStories(false);
      }
    }

    loadPendingStories();

    return () => {
      alive = false;
    };
  }, [activeKey, token, globalSearch]);

  const selectedStory = useMemo(
    () => stories.find((s) => String(s.id) === String(selectedStoryId)) || null,
    [stories, selectedStoryId]
  );

  useEffect(() => {
    let alive = true;
    if (!selectedStoryId) {
      setChapters([]);
      return;
    }

    async function loadChapters() {
      try {
        setLoadingChapters(true);
        const data = await fetchChaptersByStoryId({
          token,
          storyId: selectedStoryId,
          storyTitle: selectedStory?.title
        });
        if (!alive) return;

        // Normalize shape.
        const normalized = (Array.isArray(data) ? data : []).map((c, idx) => ({
          id: c?.id ?? `${selectedStoryId}-${idx + 1}`,
          storyId: selectedStoryId,
          chapterNumber: c?.chapterNumber ?? idx + 1,
          title: c?.title || `Chương ${idx + 1}`,
          createdAt: c?.createdAt || new Date().toISOString(),
          moderationStatus: c?.moderationStatus || c?.status || 'PENDING',
          views: c?.views ?? 0,
          reportCount: c?.reportCount ?? 0,
          content: c?.content || c?.chapterContent || '',
          violationNote: c?.violationNote || ''
        }));

        setChapters(normalized);
        setPage(1);
      } catch (err) {
        if (!alive) return;
        setChapters([]);
        setToast('Không tải được danh sách chương cho truyện đã chọn.');
      } finally {
        if (alive) setLoadingChapters(false);
      }
    }

    loadChapters();

    return () => {
      alive = false;
    };
  }, [token, selectedStoryId, selectedStory?.title]);

  useEffect(() => {
    if (!toast) return undefined;
    const t = setTimeout(() => setToast(''), 2600);
    return () => clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    if (activeKey !== 'comments') return;
    setCommentPage((p) => (p === 0 ? p : 0));
  }, [activeKey, commentFilter, commentQ]);

  useEffect(() => {
    let alive = true;

    if (activeKey !== 'comments') {
      return () => {
        alive = false;
      };
    }

    async function loadComments() {
      try {
        setCommentLoading(true);
        setCommentError('');

        const q = commentQ.trim() ? commentQ.trim() : undefined;
        let hidden;
        let locked;

        if (commentFilter === 'ACTIVE') {
          hidden = false;
          locked = false;
        } else if (commentFilter === 'LOCKED') {
          locked = true;
        } else if (commentFilter === 'HIDDEN') {
          hidden = true;
        }

        const data = await adminListComments({ token, page: commentPage, size: commentSize, q, hidden, locked });
        if (!alive) return;

        const safe = {
          content: Array.isArray(data?.content) ? data.content : [],
          page: Number.isFinite(Number(data?.page)) ? Number(data.page) : 0,
          size: Number.isFinite(Number(data?.size)) ? Number(data.size) : commentSize,
          totalElements: Number.isFinite(Number(data?.totalElements)) ? Number(data.totalElements) : 0,
          totalPages: Number.isFinite(Number(data?.totalPages)) ? Number(data.totalPages) : 0
        };
        setCommentData(safe);
      } catch (err) {
        if (!alive) return;
        setCommentData({ content: [], page: 0, size: commentSize, totalElements: 0, totalPages: 0 });
        const status = err?.response?.status;
        if (status === 403) setCommentError('Bạn không có quyền xem danh sách bình luận.');
        else setCommentError('Không tải được danh sách bình luận.');
      } finally {
        if (alive) setCommentLoading(false);
      }
    }

    loadComments();

    return () => {
      alive = false;
    };
  }, [activeKey, token, commentPage, commentFilter, commentQ]);

  const resolveTaxonomyFilter = (filter) => {
    if (filter === 'ACTIVE') return { active: true, deleted: false };
    if (filter === 'INACTIVE') return { active: false, deleted: false };
    if (filter === 'DELETED') return { active: undefined, deleted: true };
    return { active: undefined, deleted: false };
  };

  const loadCategories = async () => {
    const q = categoryQ.trim() ? categoryQ.trim() : undefined;
    const { active, deleted } = resolveTaxonomyFilter(categoryFilter);
    const data = await adminListCategories({ token, page: 0, size: 50, q, active, deleted });
    return {
      content: Array.isArray(data?.content) ? data.content : [],
      totalElements: Number.isFinite(Number(data?.totalElements)) ? Number(data.totalElements) : (Array.isArray(data?.content) ? data.content.length : 0)
    };
  };

  const loadTags = async () => {
    const q = tagQ.trim() ? tagQ.trim() : undefined;
    const { active, deleted } = resolveTaxonomyFilter(tagFilter);
    const data = await adminListTags({ token, page: 0, size: 50, q, active, deleted });
    return {
      content: Array.isArray(data?.content) ? data.content : [],
      totalElements: Number.isFinite(Number(data?.totalElements)) ? Number(data.totalElements) : (Array.isArray(data?.content) ? data.content.length : 0)
    };
  };

  useEffect(() => {
    let alive = true;

    if (activeKey !== 'tags') {
      return () => {
        alive = false;
      };
    }

    async function load() {
      try {
        setCategoryLoading(true);
        setCategoryError('');
        const data = await loadCategories();
        if (!alive) return;
        setCategoryData(data);
      } catch (err) {
        if (!alive) return;
        setCategoryData({ content: [], totalElements: 0 });
        setCategoryError('Không tải được danh sách thể loại.');
      } finally {
        if (alive) setCategoryLoading(false);
      }
    }

    load();
    return () => {
      alive = false;
    };
  }, [activeKey, token, categoryQ, categoryFilter]);

  useEffect(() => {
    let alive = true;

    if (activeKey !== 'tags') {
      return () => {
        alive = false;
      };
    }

    async function load() {
      try {
        setTagLoading(true);
        setTagError('');
        const data = await loadTags();
        if (!alive) return;
        setTagData(data);
      } catch (err) {
        if (!alive) return;
        setTagData({ content: [], totalElements: 0 });
        setTagError('Không tải được danh sách tag.');
      } finally {
        if (alive) setTagLoading(false);
      }
    }

    load();
    return () => {
      alive = false;
    };
  }, [activeKey, token, tagQ, tagFilter]);

  const openTaxonomyDialog = (entity, type, item) => {
    setTaxonomyDialog({ open: true, entity, type, item: item || null });
    setTaxonomyForm({
      name: item?.name || '',
      slug: item?.slug || '',
      isActive: typeof item?.isActive === 'boolean' ? item.isActive : true
    });
  };

  const closeTaxonomyDialog = () => {
    setTaxonomyDialog({ open: false, entity: null, type: null, item: null });
    setTaxonomyForm({ name: '', slug: '', isActive: true });
    setTaxonomySubmitting(false);
  };

  const confirmTaxonomyDialog = async () => {
    if (!taxonomyDialog.open) return;
    const entity = taxonomyDialog.entity;
    const type = taxonomyDialog.type;
    const item = taxonomyDialog.item;

    try {
      setTaxonomySubmitting(true);

      if (entity === 'category') {
        if (type === 'create') {
          await adminCreateCategory({ token, name: taxonomyForm.name, slug: taxonomyForm.slug, isActive: taxonomyForm.isActive });
          setToast('Đã tạo thể loại.');
        } else if (type === 'edit' && item?.id) {
          await adminUpdateCategory({ token, categoryId: item.id, name: taxonomyForm.name, slug: taxonomyForm.slug, isActive: taxonomyForm.isActive });
          setToast('Đã cập nhật thể loại.');
        } else if (type === 'delete' && item?.id) {
          await adminDeleteCategory({ token, categoryId: item.id });
          setToast('Đã xóa thể loại.');
        }

        const data = await loadCategories();
        setCategoryData(data);
        closeTaxonomyDialog();
        return;
      }

      if (entity === 'tag') {
        if (type === 'create') {
          await adminCreateTag({ token, name: taxonomyForm.name, slug: taxonomyForm.slug, isActive: taxonomyForm.isActive });
          setToast('Đã tạo tag.');
        } else if (type === 'edit' && item?.id) {
          await adminUpdateTag({ token, tagId: item.id, name: taxonomyForm.name, slug: taxonomyForm.slug, isActive: taxonomyForm.isActive });
          setToast('Đã cập nhật tag.');
        } else if (type === 'delete' && item?.id) {
          await adminDeleteTag({ token, tagId: item.id });
          setToast('Đã xóa tag.');
        }

        const data = await loadTags();
        setTagData(data);
        closeTaxonomyDialog();
        return;
      }

      closeTaxonomyDialog();
    } catch (err) {
      const msg = err?.response?.data?.message;
      setToast(msg || 'Không thể thực hiện thao tác tag/thể loại.');
    } finally {
      setTaxonomySubmitting(false);
    }
  };

  const openCommentDialog = (type, comment) => {
    setCommentDialog({ open: true, type, comment });
    setCommentDialogReason(type === 'hide' ? '' : '');
  };

  const closeCommentDialog = () => {
    setCommentDialog({ open: false, type: null, comment: null });
    setCommentDialogReason('');
    setCommentSubmittingId(null);
  };

  const confirmCommentDialog = async () => {
    const comment = commentDialog.comment;
    if (!comment) {
      closeCommentDialog();
      return;
    }

    const id = comment.id;
    const type = commentDialog.type;

    try {
      setCommentSubmittingId(id);

      if (type === 'hide') {
        if (!commentDialogReason.trim()) {
          setToast('Vui lòng nhập lý do ẩn bình luận (bắt buộc).');
          return;
        }
        const updated = await adminHideComment({ token, commentId: id, reason: commentDialogReason.trim() });
        setCommentData((prev) => ({
          ...prev,
          content: (prev.content || []).map((c) => (String(c.id) === String(id) ? updated : c))
        }));
        setToast('Đã ẩn bình luận.');
        closeCommentDialog();
        return;
      }

      if (type === 'unhide') {
        const updated = await adminUnhideComment({ token, commentId: id });
        setCommentData((prev) => ({
          ...prev,
          content: (prev.content || []).map((c) => (String(c.id) === String(id) ? updated : c))
        }));
        setToast('Đã bỏ ẩn bình luận.');
        closeCommentDialog();
        return;
      }

      if (type === 'delete') {
        await adminDeleteComment({ token, commentId: id });
        // Reload current page to keep pagination accurate.
        const q = commentQ.trim() ? commentQ.trim() : undefined;
        let hidden;
        let locked;
        if (commentFilter === 'ACTIVE') {
          hidden = false;
          locked = false;
        } else if (commentFilter === 'LOCKED') {
          locked = true;
        } else if (commentFilter === 'HIDDEN') {
          hidden = true;
        }
        const data = await adminListComments({ token, page: commentPage, size: commentSize, q, hidden, locked });
        setCommentData({
          content: Array.isArray(data?.content) ? data.content : [],
          page: Number.isFinite(Number(data?.page)) ? Number(data.page) : 0,
          size: Number.isFinite(Number(data?.size)) ? Number(data.size) : commentSize,
          totalElements: Number.isFinite(Number(data?.totalElements)) ? Number(data.totalElements) : 0,
          totalPages: Number.isFinite(Number(data?.totalPages)) ? Number(data.totalPages) : 0
        });
        setToast('Đã xóa bình luận.');
        closeCommentDialog();
        return;
      }

      closeCommentDialog();
    } catch (err) {
      const msg = err?.response?.data?.message;
      setToast(msg || 'Không thể thực hiện thao tác bình luận.');
    } finally {
      setCommentSubmittingId(null);
    }
  };

  const filteredStories = useMemo(() => {
    if (!globalSearch.trim()) return stories;

    const q = normalizeText(globalSearch);
    return stories.filter((s) => {
      return normalizeText(s?.title).includes(q) || normalizeText(s?.authorName).includes(q);
    });
  }, [stories, globalSearch]);

  const filteredChapters = useMemo(() => {
    const q = normalizeText(chapterSearch);

    return chapters
      .filter((c) => {
        if (chapterFilter === 'ALL') return true;
        if (chapterFilter === 'REPORTED') return (c.reportCount || 0) > 0;
        return String(c.moderationStatus || '').toUpperCase() === chapterFilter;
      })
      .filter((c) => {
        if (!q) return true;
        return normalizeText(c.title).includes(q);
      })
      .sort((a, b) => (a.chapterNumber || 0) - (b.chapterNumber || 0));
  }, [chapters, chapterFilter, chapterSearch]);

  const totalPages = Math.max(1, Math.ceil(filteredChapters.length / pageSize));
  const pageSafe = Math.min(page, totalPages);

  const pagedChapters = useMemo(() => {
    const start = (pageSafe - 1) * pageSize;
    return filteredChapters.slice(start, start + pageSize);
  }, [filteredChapters, pageSafe]);

  useEffect(() => {
    setPage(1);
  }, [chapterFilter, chapterSearch, selectedStoryId]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    localStorage.removeItem('role');
    navigate('/home');
  };

  const openChapterPreview = (chapter) => {
    setChapterPreview({ open: true, chapter });
  };

  const applyChapterStatus = (chapterId, nextStatus, note) => {
    setChapters((prev) =>
      prev.map((c) =>
        String(c.id) === String(chapterId)
          ? {
              ...c,
              moderationStatus: nextStatus,
              violationNote: typeof note === 'string' ? note : c.violationNote
            }
          : c
      )
    );
  };

  const openActionDialog = (type, chapter) => {
    setDialog({ open: true, type, chapterId: chapter?.id || null });
    setDialogNote(type === 'note' ? chapter?.violationNote || '' : '');
    setDialogStatus(String(chapter?.moderationStatus || 'PENDING').toUpperCase());
  };

  const openStoryDialog = (type, story) => {
    setStoryDialog({ open: true, type, storyId: story?.id || null });
    setStoryDialogNote(type === 'reject' ? '' : story?.adminNotes || '');
  };

  const closeStoryDialog = () => {
    setStoryDialog({ open: false, type: null, storyId: null });
    setStoryDialogNote('');
  };

  const currentStory = useMemo(
    () => pendingStories.find((s) => String(s.id) === String(storyDialog.storyId)) || null,
    [pendingStories, storyDialog.storyId]
  );

  const confirmStoryDialog = async () => {
    const story = currentStory;
    if (!story) {
      closeStoryDialog();
      return;
    }

    const type = storyDialog.type;
    if (type === 'approve') {
      try {
        await reviewStoryModeration({
          token,
          storyId: story.id,
          approvalStatus: 'APPROVED',
          adminNotes: storyDialogNote.trim() || undefined
        });
        setPendingStories((prev) => prev.filter((s) => String(s.id) !== String(story.id)));
        setToast(`Đã duyệt truyện: ${story.title || 'Không tên'}`);
      } catch (err) {
        setToast('Không thể duyệt truyện. Vui lòng thử lại.');
      } finally {
        closeStoryDialog();
      }
      return;
    }

    if (type === 'reject') {
      if (!storyDialogNote.trim()) {
        setToast('Vui lòng nhập ghi chú lý do từ chối (bắt buộc).');
        return;
      }
      try {
        await reviewStoryModeration({
          token,
          storyId: story.id,
          approvalStatus: 'REJECTED',
          adminNotes: storyDialogNote.trim()
        });
        setPendingStories((prev) => prev.filter((s) => String(s.id) !== String(story.id)));
        setToast(`Đã từ chối truyện: ${story.title || 'Không tên'}`);
      } catch (err) {
        setToast('Không thể từ chối truyện. Vui lòng thử lại.');
      } finally {
        closeStoryDialog();
      }
    }
  };

  const closeDialog = () => {
    setDialog({ open: false, type: null, chapterId: null });
    setDialogNote('');
  };

  const currentChapter = useMemo(
    () => chapters.find((c) => String(c.id) === String(dialog.chapterId)) || null,
    [chapters, dialog.chapterId]
  );

  const confirmDialog = async () => {
    const chapter = currentChapter;
    if (!chapter) {
      closeDialog();
      return;
    }

    const type = dialog.type;

    if (type === 'approve') {
      try {
        const updated = await updateChapterModeration({ token, chapterId: chapter.id, status: 'APPROVED' });
        applyChapterStatus(updated.id, updated.moderationStatus || 'APPROVED', updated.violationNote);
        setToast(`Đã duyệt ${chapter.title}`);
      } catch (err) {
        setToast('Không thể duyệt chương. Vui lòng thử lại.');
      } finally {
        closeDialog();
      }
      return;
    }

    if (type === 'reject') {
      if (!dialogNote.trim()) {
        setToast('Vui lòng nhập ghi chú lý do vi phạm trước khi từ chối.');
        return;
      }
      try {
        const updated = await updateChapterModeration({
          token,
          chapterId: chapter.id,
          status: 'REJECTED',
          violationNote: dialogNote.trim()
        });
        applyChapterStatus(updated.id, updated.moderationStatus || 'REJECTED', updated.violationNote);
        setToast(`Đã từ chối ${chapter.title}`);
      } catch (err) {
        setToast('Không thể từ chối chương. Vui lòng thử lại.');
      } finally {
        closeDialog();
      }
      return;
    }

    if (type === 'hide') {
      try {
        const updated = await updateChapterModeration({
          token,
          chapterId: chapter.id,
          status: 'HIDDEN',
          violationNote: dialogNote.trim() || undefined
        });
        applyChapterStatus(updated.id, updated.moderationStatus || 'HIDDEN', updated.violationNote);
        setToast(`Đã ẩn ${chapter.title}`);
      } catch (err) {
        setToast('Không thể ẩn chương. Vui lòng thử lại.');
      } finally {
        closeDialog();
      }
      return;
    }

    if (type === 'warn') {
      if (!dialogNote.trim()) {
        setToast('Vui lòng nhập nội dung cảnh báo.');
        return;
      }
      setToast(`Đã gửi cảnh báo cho tác giả (demo): ${chapter.title}`);
      closeDialog();
      return;
    }

    if (type === 'status') {
      try {
        const updated = await updateChapterModeration({
          token,
          chapterId: chapter.id,
          status: dialogStatus,
          violationNote: chapter.violationNote
        });
        applyChapterStatus(updated.id, updated.moderationStatus || dialogStatus, updated.violationNote);
        setToast(`Đã cập nhật trạng thái: ${chapter.title}`);
      } catch (err) {
        setToast('Không thể cập nhật trạng thái. Vui lòng thử lại.');
      } finally {
        closeDialog();
      }
      return;
    }

    if (type === 'note') {
      try {
        const nextStatus = String(chapter.moderationStatus || 'PENDING').toUpperCase();
        const updated = await updateChapterModeration({
          token,
          chapterId: chapter.id,
          status: nextStatus,
          violationNote: dialogNote
        });
        applyChapterStatus(updated.id, updated.moderationStatus || nextStatus, updated.violationNote);
        setToast(`Đã lưu ghi chú vi phạm: ${chapter.title}`);
      } catch (err) {
        setToast('Không thể lưu ghi chú. Vui lòng thử lại.');
      } finally {
        closeDialog();
      }
      return;
    }

    closeDialog();
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-gradient-to-br from-pastel-50 via-pink-50 to-white">
      <div className="mx-auto w-full max-w-screen-2xl px-4 py-6 md:px-6">
        <div className="grid gap-5 lg:grid-cols-[260px_1fr]">
          {/* Sidebar */}
          <aside className="rounded-2xl border border-pink-100 bg-white/80 p-3 shadow-soft backdrop-blur">
            <div className="px-3 pb-2 pt-3">
              <div className="text-xs font-semibold uppercase tracking-wide text-pink-500">Dashboard kiểm duyệt</div>
              <div className="mt-1 text-sm text-slate-500">Xin chào, {username || 'Kiểm duyệt viên'}</div>
            </div>

            <nav className="mt-3 space-y-1">
              {SIDEBAR_ITEMS.map((item) => {
                const active = item.key === activeKey;
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setActiveKey(item.key)}
                    className={
                      active
                        ? 'w-full rounded-xl bg-pink-50 px-3 py-2 text-left text-sm font-semibold text-pink-700'
                        : 'w-full rounded-xl px-3 py-2 text-left text-sm font-medium text-slate-700 hover:bg-slate-50'
                    }
                  >
                    {item.label}
                  </button>
                );
              })}
            </nav>
          </aside>

          {/* Content */}
          <section className="min-w-0 rounded-2xl border border-pink-100 bg-white/80 shadow-soft backdrop-blur">
            {/* Header */}
            <div className="flex flex-col gap-3 border-b border-pink-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-xl font-bold text-slate-800">{SIDEBAR_ITEMS.find((i) => i.key === activeKey)?.label}</h1>
                <p className="mt-1 text-sm text-slate-500">CMS kiểm duyệt nội dung truyện, chương và bình luận.</p>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <div className="relative">
                  <input
                    value={globalSearch}
                    onChange={(e) => setGlobalSearch(e.target.value)}
                    placeholder="Tìm theo tên truyện / tác giả"
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-pink-300 focus:ring-2 focus:ring-pink-100 sm:w-[320px]"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Đăng xuất
                </button>
              </div>
            </div>

            {toast && (
              <div className="mx-5 mt-4 rounded-xl border border-pink-100 bg-pink-50 px-4 py-3 text-sm font-medium text-pink-700">
                {toast}
              </div>
            )}

            {/* Views */}
            {activeKey === 'stories' ? (
              <div className="p-5">
                <div className="space-y-4">
                  <div className="rounded-2xl border border-slate-200 bg-white p-4">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <div className="text-sm font-semibold text-slate-800">Danh sách truyện chờ duyệt</div>
                        <div className="mt-1 text-xs text-slate-500">Duyệt / từ chối truyện được tác giả gửi kiểm duyệt.</div>
                      </div>
                      <div className="text-xs text-slate-500">
                        {loadingPendingStories ? 'Đang tải...' : `${pendingStories.length} truyện`}
                      </div>
                    </div>
                  </div>

                  <div className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white">
                    <div className="w-full overflow-x-auto">
                      <table className="min-w-[980px] w-full border-collapse">
                        <thead>
                          <tr className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                            <th className="px-4 py-3">Truyện</th>
                            <th className="px-4 py-3">Tác giả</th>
                            <th className="px-4 py-3">Ngày tạo</th>
                            <th className="px-4 py-3">Cập nhật</th>
                            <th className="px-4 py-3">Ghi chú</th>
                            <th className="px-4 py-3">Thao tác</th>
                          </tr>
                        </thead>
                        <tbody>
                          {loadingPendingStories ? (
                            <tr>
                              <td colSpan={6} className="px-4 py-10 text-center text-sm text-slate-500">
                                Đang tải danh sách truyện...
                              </td>
                            </tr>
                          ) : pendingStories.length === 0 ? (
                            <tr>
                              <td colSpan={6} className="px-4 py-10 text-center text-sm text-slate-500">
                                Không có truyện chờ duyệt.
                              </td>
                            </tr>
                          ) : (
                            pendingStories.map((s) => (
                              <tr key={s.id} className="border-t border-slate-100 text-sm">
                                <td className="px-4 py-3">
                                  <div className="max-w-[360px] truncate font-semibold text-slate-800">{s.title || 'Không tên'}</div>
                                  <div className="mt-1 max-w-[360px] truncate text-xs text-slate-500">{s.category ? `Danh mục: ${s.category}` : '—'}</div>
                                </td>
                                <td className="px-4 py-3 text-slate-700">{s.authorName || '—'}</td>
                                <td className="px-4 py-3 text-slate-600">{formatDateTimeVi(s.createdAt)}</td>
                                <td className="px-4 py-3 text-slate-600">{formatDateTimeVi(s.updatedAt)}</td>
                                <td className="px-4 py-3">
                                  <div className="max-w-[260px] truncate text-xs text-slate-600">{s.adminNotes || '—'}</div>
                                </td>
                                <td className="px-4 py-3">
                                  <div className="flex flex-wrap gap-2">
                                    <button
                                      type="button"
                                      onClick={() => openStoryDialog('approve', s)}
                                      className="h-9 rounded-lg bg-emerald-600 px-3 text-xs font-semibold text-white hover:bg-emerald-700"
                                    >
                                      Duyệt
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => openStoryDialog('reject', s)}
                                      className="h-9 rounded-lg bg-rose-600 px-3 text-xs font-semibold text-white hover:bg-rose-700"
                                    >
                                      Từ chối
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <p className="text-xs text-slate-500">Ghi chú: Danh sách truyện chờ duyệt được lấy từ backend + database (submissionStatus = SUBMITTED).</p>
                </div>
              </div>
            ) : activeKey === 'chapters' ? (
              <div className="p-5">
                <div className="min-w-0 space-y-4">
                  {/* Story picker */}
                  <div className="rounded-2xl border border-slate-200 bg-white p-4">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-slate-800">Chọn truyện</div>
                        <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center">
                          <select
                            value={selectedStoryId ? String(selectedStoryId) : ''}
                            onChange={(e) => setSelectedStoryId(e.target.value || null)}
                            disabled={loadingStories || filteredStories.length === 0}
                            className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-pink-300 focus:ring-2 focus:ring-pink-100 disabled:opacity-60 sm:max-w-[520px]"
                          >
                            {loadingStories ? (
                              <option value="">Đang tải danh sách truyện…</option>
                            ) : filteredStories.length === 0 ? (
                              <option value="">Không có truyện phù hợp</option>
                            ) : (
                              filteredStories.map((s) => (
                                <option key={s.id} value={String(s.id)}>
                                  {s.title || 'Không tên'}{s.authorName ? ` — ${s.authorName}` : ''}
                                </option>
                              ))
                            )}
                          </select>

                          <input
                            value={chapterSearch}
                            onChange={(e) => setChapterSearch(e.target.value)}
                            placeholder="Tìm theo tên chương"
                            className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-pink-300 focus:ring-2 focus:ring-pink-100 sm:w-[320px]"
                          />
                        </div>

                        {/* Selected story title (under dropdown) */}
                        <div className="mt-3">
                          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Truyện đang chọn</div>
                          <div className="mt-1 truncate text-lg font-bold text-slate-800">{selectedStory?.title || '—'}</div>
                        </div>
                      </div>

                      {selectedStory ? (
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-600">
                            Tác giả: {selectedStory.authorName || '—'}
                          </span>
                          <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-600">
                            {storyStatusLabel(selectedStory)}
                          </span>
                          <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-600">
                            Cập nhật: {formatDateVi(selectedStory.updatedAt)}
                          </span>
                        </div>
                      ) : null}
                    </div>
                  </div>

                  {/* Filters */}
                  <div className="flex flex-wrap items-center gap-2">
                    {CHAPTER_FILTERS.map((f) => {
                      const active = f.key === chapterFilter;
                      return (
                        <button
                          key={f.key}
                          type="button"
                          onClick={() => setChapterFilter(f.key)}
                          className={
                            active
                              ? 'h-9 rounded-full bg-pink-500 px-4 text-sm font-semibold text-white'
                              : 'h-9 rounded-full border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50'
                          }
                        >
                          {f.label}
                        </button>
                      );
                    })}
                  </div>

                  {/* Table */}
                  <div className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white">
                    <div className="flex flex-col gap-2 border-b border-slate-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="text-sm font-semibold text-slate-800">Danh sách chương</div>
                      <div className="text-xs text-slate-500">
                        {loadingChapters ? 'Đang tải...' : `${filteredChapters.length} chương`}
                      </div>
                    </div>

                    <div className="w-full overflow-x-auto">
                      <table className="min-w-[980px] w-full border-collapse">
                          <thead>
                            <tr className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                              <th className="px-4 py-3">Số</th>
                              <th className="px-4 py-3">Tên chương</th>
                              <th className="px-4 py-3">Ngày đăng</th>
                              <th className="px-4 py-3">Trạng thái duyệt</th>
                              <th className="px-4 py-3">Lượt xem</th>
                              <th className="px-4 py-3">Báo cáo</th>
                              <th className="px-4 py-3">Thao tác</th>
                            </tr>
                          </thead>
                          <tbody>
                            {loadingChapters ? (
                              <tr>
                                <td colSpan={7} className="px-4 py-8 text-center text-sm text-slate-500">
                                  Đang tải danh sách chương...
                                </td>
                              </tr>
                            ) : pagedChapters.length === 0 ? (
                              <tr>
                                <td colSpan={7} className="px-4 py-10 text-center text-sm text-slate-500">
                                  Không có chương phù hợp.
                                </td>
                              </tr>
                            ) : (
                              pagedChapters.map((c) => {
                                const badge = statusBadge(c.moderationStatus);
                                return (
                                  <tr key={c.id} className="border-t border-slate-100 text-sm">
                                    <td className="px-4 py-3 font-semibold text-slate-700">{c.chapterNumber}</td>
                                    <td className="px-4 py-3">
                                      <div className="max-w-[340px] truncate font-semibold text-slate-800">{c.title}</div>
                                      {c.violationNote ? (
                                        <div className="mt-1 max-w-[340px] truncate text-xs text-rose-600">
                                          Ghi chú: {c.violationNote}
                                        </div>
                                      ) : null}
                                    </td>
                                    <td className="px-4 py-3 text-slate-600">{formatDateTimeVi(c.createdAt)}</td>
                                    <td className="px-4 py-3">
                                      <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${badge.cls}`}>
                                        {badge.label}
                                      </span>
                                    </td>
                                    <td className="px-4 py-3 text-slate-600">{(c.views || 0).toLocaleString('vi-VN')}</td>
                                    <td className="px-4 py-3">
                                      <span
                                        className={
                                          (c.reportCount || 0) > 0
                                            ? 'inline-flex rounded-full bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700'
                                            : 'inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600'
                                        }
                                      >
                                        {(c.reportCount || 0) > 0 ? `${c.reportCount} báo cáo` : '0'}
                                      </span>
                                    </td>
                                    <td className="px-4 py-3">
                                      <div className="flex flex-wrap gap-2">
                                        <button
                                          type="button"
                                          onClick={() => openChapterPreview(c)}
                                          className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                                        >
                                          Xem
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => openActionDialog('approve', c)}
                                          className="h-9 rounded-lg bg-emerald-600 px-3 text-xs font-semibold text-white hover:bg-emerald-700"
                                        >
                                          Duyệt
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => openActionDialog('reject', c)}
                                          className="h-9 rounded-lg bg-rose-600 px-3 text-xs font-semibold text-white hover:bg-rose-700"
                                        >
                                          Từ chối
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => openActionDialog('hide', c)}
                                          className="h-9 rounded-lg border border-slate-200 bg-slate-900 px-3 text-xs font-semibold text-white hover:bg-slate-800"
                                        >
                                          Ẩn
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => openActionDialog('warn', c)}
                                          className="h-9 rounded-lg border border-pink-200 bg-pink-50 px-3 text-xs font-semibold text-pink-700 hover:bg-pink-100"
                                        >
                                          Cảnh báo
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => openActionDialog('status', c)}
                                          className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                                        >
                                          Sửa trạng thái
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => openActionDialog('note', c)}
                                          className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                                        >
                                          Ghi chú
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })
                            )}
                          </tbody>
                        </table>
                      </div>

                    {/* Pagination */}
                    <div className="flex flex-col gap-2 border-t border-slate-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="text-xs text-slate-500">
                        Trang {pageSafe} / {totalPages}
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setPage(1)}
                          disabled={pageSafe === 1}
                          className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 disabled:opacity-50"
                        >
                          « Đầu
                        </button>
                        <button
                          type="button"
                          onClick={() => setPage((p) => Math.max(1, p - 1))}
                          disabled={pageSafe === 1}
                          className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 disabled:opacity-50"
                        >
                          ‹ Trước
                        </button>
                        <button
                          type="button"
                          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                          disabled={pageSafe === totalPages}
                          className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 disabled:opacity-50"
                        >
                          Sau ›
                        </button>
                        <button
                          type="button"
                          onClick={() => setPage(totalPages)}
                          disabled={pageSafe === totalPages}
                          className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 disabled:opacity-50"
                        >
                          Cuối »
                        </button>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-slate-500">Ghi chú: Dữ liệu truyện/chương và trạng thái duyệt được lấy từ backend + database.</p>
                </div>
              </div>
            ) : activeKey === 'comments' ? (
              <div className="p-5">
                <div className="min-w-0 space-y-4">
                  <div className="rounded-2xl border border-slate-200 bg-white p-4">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                      <div>
                        <div className="text-sm font-semibold text-slate-800">Danh sách bình luận</div>
                        <div className="mt-1 text-xs text-slate-500">Tìm kiếm, lọc, ẩn/hiện, xóa bình luận (dữ liệu từ database thật).</div>
                      </div>

                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                        <input
                          value={commentQ}
                          onChange={(e) => setCommentQ(e.target.value)}
                          placeholder="Tìm theo nội dung / user / truyện / chương"
                          className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-pink-300 focus:ring-2 focus:ring-pink-100 sm:w-[360px]"
                        />
                        <select
                          value={commentFilter}
                          onChange={(e) => setCommentFilter(e.target.value)}
                          className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-pink-300 focus:ring-2 focus:ring-pink-100 sm:w-[220px]"
                        >
                          <option value="ALL">Tất cả trạng thái</option>
                          <option value="ACTIVE">Đang hoạt động</option>
                          <option value="LOCKED">Bị khóa</option>
                          <option value="HIDDEN">Bị ẩn</option>
                        </select>
                      </div>
                    </div>

                    {commentError ? (
                      <div className="mt-3 rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
                        {commentError}
                      </div>
                    ) : null}
                  </div>

                  <div className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white">
                    <div className="flex flex-col gap-2 border-b border-slate-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="text-sm font-semibold text-slate-800">Bình luận</div>
                      <div className="text-xs text-slate-500">
                        {commentLoading ? 'Đang tải...' : `${(commentData.totalElements || 0).toLocaleString('vi-VN')} bình luận`}
                      </div>
                    </div>

                    <div className="w-full overflow-x-auto">
                      <table className="min-w-[1100px] w-full border-collapse">
                        <thead>
                          <tr className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                            <th className="px-4 py-3">ID</th>
                            <th className="px-4 py-3">Nội dung</th>
                            <th className="px-4 py-3">Người dùng</th>
                            <th className="px-4 py-3">Truyện / Chương</th>
                            <th className="px-4 py-3">Trạng thái</th>
                            <th className="px-4 py-3">Ngày tạo</th>
                            <th className="px-4 py-3">Thao tác</th>
                          </tr>
                        </thead>
                        <tbody>
                          {commentLoading ? (
                            <tr>
                              <td colSpan={7} className="px-4 py-10 text-center text-sm text-slate-500">
                                Đang tải danh sách bình luận...
                              </td>
                            </tr>
                          ) : (commentData.content || []).length === 0 ? (
                            <tr>
                              <td colSpan={7} className="px-4 py-10 text-center text-sm text-slate-500">
                                Không có bình luận phù hợp.
                              </td>
                            </tr>
                          ) : (
                            (commentData.content || []).map((c) => {
                              const badge = commentStatusBadge(c);
                              const canSubmit = String(commentSubmittingId || '') !== String(c.id);

                              const storyTitle = c?.story?.title || '—';
                              const chapterTitle = c?.chapter?.title;
                              const chapterNumber = c?.chapter?.chapterNumber;
                              const relation = chapterTitle
                                ? `${storyTitle} • Ch.${chapterNumber || '—'}: ${chapterTitle}`
                                : storyTitle;

                              return (
                                <tr key={c.id} className="border-t border-slate-100 text-sm">
                                  <td className="px-4 py-3 font-semibold text-slate-700">{c.id}</td>
                                  <td className="px-4 py-3">
                                    <div className="max-w-[420px] truncate font-medium text-slate-800">{c.content || '—'}</div>
                                    {c.lockReason ? <div className="mt-1 max-w-[420px] truncate text-xs text-rose-600">Lý do: {c.lockReason}</div> : null}
                                  </td>
                                  <td className="px-4 py-3">
                                    <div className="font-semibold text-slate-800">{c?.user?.username || '—'}</div>
                                    <div className="mt-1 text-xs text-slate-500">{c?.user?.email || '—'}</div>
                                  </td>
                                  <td className="px-4 py-3">
                                    <div className="max-w-[380px] truncate text-slate-700">{relation}</div>
                                    <div className="mt-1 text-xs text-slate-500">
                                      Story ID: {c?.story?.id ?? '—'} • Chapter ID: {c?.chapter?.id ?? '—'}
                                    </div>
                                  </td>
                                  <td className="px-4 py-3">
                                    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${badge.cls}`}>{badge.label}</span>
                                  </td>
                                  <td className="px-4 py-3 text-slate-600">{formatDateTimeVi(c.createdAt)}</td>
                                  <td className="px-4 py-3">
                                    <div className="flex flex-wrap gap-2">
                                      {!c?.isHidden ? (
                                        <button
                                          type="button"
                                          onClick={() => openCommentDialog('hide', c)}
                                          disabled={!canSubmit}
                                          className="h-9 rounded-lg border border-slate-200 bg-slate-900 px-3 text-xs font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
                                        >
                                          Ẩn
                                        </button>
                                      ) : (
                                        <button
                                          type="button"
                                          onClick={() => openCommentDialog('unhide', c)}
                                          disabled={!canSubmit}
                                          className="h-9 rounded-lg bg-emerald-600 px-3 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                                        >
                                          Bỏ ẩn
                                        </button>
                                      )}

                                      <button
                                        type="button"
                                        onClick={() => openCommentDialog('delete', c)}
                                        disabled={!canSubmit}
                                        className="h-9 rounded-lg bg-rose-600 px-3 text-xs font-semibold text-white hover:bg-rose-700 disabled:opacity-60"
                                      >
                                        Xóa
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>

                    {/* Pagination */}
                    <div className="flex flex-col gap-2 border-t border-slate-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="text-xs text-slate-500">
                        Trang {Number(commentData.page || 0) + 1} / {Math.max(1, Number(commentData.totalPages || 0))}
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setCommentPage(0)}
                          disabled={Number(commentData.page || 0) === 0}
                          className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 disabled:opacity-50"
                        >
                          « Đầu
                        </button>
                        <button
                          type="button"
                          onClick={() => setCommentPage((p) => Math.max(0, p - 1))}
                          disabled={Number(commentData.page || 0) === 0}
                          className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 disabled:opacity-50"
                        >
                          ‹ Trước
                        </button>
                        <button
                          type="button"
                          onClick={() => setCommentPage((p) => Math.min(Math.max(0, Number(commentData.totalPages || 1) - 1), p + 1))}
                          disabled={Number(commentData.page || 0) >= Math.max(0, Number(commentData.totalPages || 1) - 1)}
                          className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 disabled:opacity-50"
                        >
                          Sau ›
                        </button>
                        <button
                          type="button"
                          onClick={() => setCommentPage(Math.max(0, Number(commentData.totalPages || 1) - 1))}
                          disabled={Number(commentData.page || 0) >= Math.max(0, Number(commentData.totalPages || 1) - 1)}
                          className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 disabled:opacity-50"
                        >
                          Cuối »
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : activeKey === 'notifications' ? (
              <div className="p-5">
                <div className="min-w-0 space-y-4">
                  <div className="rounded-2xl border border-slate-200 bg-white p-4">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                      <div>
                        <div className="text-sm font-semibold text-slate-800">Thông báo</div>
                        <div className="mt-1 text-xs text-slate-500">
                          Chưa đọc: {(notifUnreadCount || 0).toLocaleString('vi-VN')} • Dữ liệu từ bảng notifications (PostgreSQL)
                        </div>
                      </div>

                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                        <select
                          value={notifType}
                          onChange={(e) => setNotifType(e.target.value)}
                          className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-pink-300 focus:ring-2 focus:ring-pink-100 sm:w-[220px]"
                        >
                          {NOTIFICATION_TYPE_OPTIONS.map((o) => (
                            <option key={o.value || 'ALL'} value={o.value}>
                              {o.label}
                            </option>
                          ))}
                        </select>
                        <select
                          value={notifReadFilter}
                          onChange={(e) => setNotifReadFilter(e.target.value)}
                          className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-pink-300 focus:ring-2 focus:ring-pink-100 sm:w-[220px]"
                        >
                          {NOTIFICATION_READ_OPTIONS.map((o) => (
                            <option key={o.value} value={o.value}>
                              {o.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {notifError ? (
                      <div className="mt-3 rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
                        {notifError}
                      </div>
                    ) : null}
                  </div>

                  {role === 'ADMIN' ? (
                    <div className="rounded-2xl border border-slate-200 bg-white p-4">
                      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <div className="text-sm font-semibold text-slate-800">Gửi thông báo hệ thống</div>
                          <div className="mt-1 text-xs text-slate-500">Gửi broadcast tới tất cả người dùng đang active (ghi trực tiếp vào bảng notifications).</div>
                        </div>
                      </div>

                      <div className="mt-4 grid gap-3">
                        <div className="grid gap-2 sm:grid-cols-2">
                          <div>
                            <div className="mb-1 text-xs font-semibold text-slate-600">Loại</div>
                            <select
                              value={notifSendForm.type}
                              onChange={(e) => setNotifSendForm((p) => ({ ...p, type: e.target.value }))}
                              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-pink-300 focus:ring-2 focus:ring-pink-100"
                            >
                              {NOTIFICATION_TYPE_OPTIONS.filter((o) => o.value).map((o) => (
                                <option key={o.value} value={o.value}>
                                  {o.label}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <div className="mb-1 text-xs font-semibold text-slate-600">Tiêu đề</div>
                            <input
                              value={notifSendForm.title}
                              onChange={(e) => setNotifSendForm((p) => ({ ...p, title: e.target.value }))}
                              placeholder="Ví dụ: Bảo trì hệ thống"
                              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-pink-300 focus:ring-2 focus:ring-pink-100"
                            />
                          </div>
                        </div>

                        <div>
                          <div className="mb-1 text-xs font-semibold text-slate-600">Nội dung</div>
                          <textarea
                            value={notifSendForm.message}
                            onChange={(e) => setNotifSendForm((p) => ({ ...p, message: e.target.value }))}
                            rows={4}
                            placeholder="Nhập nội dung thông báo..."
                            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-pink-300 focus:ring-2 focus:ring-pink-100"
                          />
                        </div>

                        <div>
                          <div className="mb-1 text-xs font-semibold text-slate-600">Meta (JSON, tùy chọn)</div>
                          <textarea
                            value={notifSendForm.metaText}
                            onChange={(e) => setNotifSendForm((p) => ({ ...p, metaText: e.target.value }))}
                            rows={3}
                            placeholder='Ví dụ: {"url":"/home","severity":"info"}'
                            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 font-mono text-xs outline-none transition focus:border-pink-300 focus:ring-2 focus:ring-pink-100"
                          />
                        </div>

                        <div className="flex justify-end">
                          <button
                            type="button"
                            onClick={submitSystemNotification}
                            disabled={notifSending}
                            className="h-11 rounded-xl bg-pink-500 px-5 text-sm font-semibold text-white hover:bg-pink-600 disabled:opacity-60"
                          >
                            {notifSending ? 'Đang gửi...' : 'Gửi thông báo'}
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : null}

                  <div className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white">
                    <div className="flex flex-col gap-2 border-b border-slate-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="text-sm font-semibold text-slate-800">Danh sách thông báo</div>
                      <div className="text-xs text-slate-500">
                        {notifLoading ? 'Đang tải...' : `${(notifData.totalElements || 0).toLocaleString('vi-VN')} thông báo`}
                      </div>
                    </div>

                    <div className="w-full overflow-x-auto">
                      <table className="min-w-[980px] w-full border-collapse">
                        <thead>
                          <tr className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                            <th className="px-4 py-3">ID</th>
                            <th className="px-4 py-3">Loại</th>
                            <th className="px-4 py-3">Tiêu đề</th>
                            <th className="px-4 py-3">Trạng thái</th>
                            <th className="px-4 py-3">Tạo lúc</th>
                            <th className="px-4 py-3">Thao tác</th>
                          </tr>
                        </thead>
                        <tbody>
                          {notifLoading ? (
                            <tr>
                              <td colSpan={6} className="px-4 py-10 text-center text-sm text-slate-500">
                                Đang tải danh sách thông báo...
                              </td>
                            </tr>
                          ) : (notifData.content || []).length === 0 ? (
                            <tr>
                              <td colSpan={6} className="px-4 py-10 text-center text-sm text-slate-500">
                                Không có thông báo phù hợp.
                              </td>
                            </tr>
                          ) : (
                            (notifData.content || []).map((n) => {
                              const badge = notificationTypeBadge(n.type);
                              const read = Boolean(n.isRead);
                              return (
                                <tr key={n.id} className="border-t border-slate-100 text-sm">
                                  <td className="px-4 py-3 font-semibold text-slate-700">{n.id}</td>
                                  <td className="px-4 py-3">
                                    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${badge.cls}`}>{badge.label}</span>
                                  </td>
                                  <td className="px-4 py-3">
                                    <div className={read ? 'max-w-[420px] truncate text-slate-800' : 'max-w-[420px] truncate font-semibold text-slate-900'}>
                                      {n.title || '—'}
                                    </div>
                                    {n.message ? (
                                      <div className="mt-1 max-w-[420px] truncate text-xs text-slate-500">{n.message}</div>
                                    ) : null}
                                  </td>
                                  <td className="px-4 py-3">
                                    <span
                                      className={
                                        read
                                          ? 'inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600'
                                          : 'inline-flex rounded-full bg-pink-50 px-2.5 py-1 text-xs font-semibold text-pink-700'
                                      }
                                    >
                                      {read ? 'Đã đọc' : 'Chưa đọc'}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3 text-slate-600">{formatDateTimeVi(n.createdAt)}</td>
                                  <td className="px-4 py-3">
                                    <div className="flex flex-wrap gap-2">
                                      <button
                                        type="button"
                                        onClick={() => openNotificationDetail(n)}
                                        className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                                      >
                                        Xem
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => toggleNotificationRead(n, !read)}
                                        className={
                                          read
                                            ? 'h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50'
                                            : 'h-9 rounded-lg bg-pink-500 px-3 text-xs font-semibold text-white hover:bg-pink-600'
                                        }
                                      >
                                        {read ? 'Đánh dấu chưa đọc' : 'Đánh dấu đã đọc'}
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>

                    {/* Pagination */}
                    <div className="flex flex-col gap-2 border-t border-slate-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="text-xs text-slate-500">
                        Trang {Number(notifData.page || 0) + 1} / {Math.max(1, Number(notifData.totalPages || 0))}
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setNotifPage(0)}
                          disabled={Number(notifData.page || 0) === 0}
                          className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 disabled:opacity-50"
                        >
                          « Đầu
                        </button>
                        <button
                          type="button"
                          onClick={() => setNotifPage((p) => Math.max(0, p - 1))}
                          disabled={Number(notifData.page || 0) === 0}
                          className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 disabled:opacity-50"
                        >
                          ‹ Trước
                        </button>
                        <button
                          type="button"
                          onClick={() => setNotifPage((p) => Math.min(Math.max(0, Number(notifData.totalPages || 1) - 1), p + 1))}
                          disabled={Number(notifData.page || 0) >= Math.max(0, Number(notifData.totalPages || 1) - 1)}
                          className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 disabled:opacity-50"
                        >
                          Sau ›
                        </button>
                        <button
                          type="button"
                          onClick={() => setNotifPage(Math.max(0, Number(notifData.totalPages || 1) - 1))}
                          disabled={Number(notifData.page || 0) >= Math.max(0, Number(notifData.totalPages || 1) - 1)}
                          className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 disabled:opacity-50"
                        >
                          Cuối »
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <Dialog
                  open={notifDetail.open}
                  title={notifDetail.data?.title || 'Chi tiết thông báo'}
                  secondaryLabel="Đóng"
                  onSecondary={() => setNotifDetail({ open: false, loading: false, error: '', data: null })}
                  primaryLabel={
                    notifDetail.loading
                      ? 'Đang tải...'
                      : notifDetail.data
                        ? Boolean(notifDetail.data.isRead)
                          ? 'Đánh dấu chưa đọc'
                          : 'Đánh dấu đã đọc'
                        : 'Đóng'
                  }
                  onPrimary={() => {
                    if (notifDetail.loading || !notifDetail.data) {
                      setNotifDetail({ open: false, loading: false, error: '', data: null });
                      return;
                    }
                    toggleNotificationRead(notifDetail.data, !Boolean(notifDetail.data.isRead));
                  }}
                >
                  {notifDetail.loading ? (
                    <div className="text-sm text-slate-600">Đang tải chi tiết...</div>
                  ) : notifDetail.error ? (
                    <div className="rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
                      {notifDetail.error}
                    </div>
                  ) : notifDetail.data ? (
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        {(() => {
                          const badge = notificationTypeBadge(notifDetail.data.type);
                          return (
                            <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${badge.cls}`}>{badge.label}</span>
                          );
                        })()}
                        <span className="text-xs font-semibold text-slate-500">Tạo lúc: {formatDateTimeVi(notifDetail.data.createdAt)}</span>
                        <span className="text-xs font-semibold text-slate-500">
                          Trạng thái: {Boolean(notifDetail.data.isRead) ? 'Đã đọc' : 'Chưa đọc'}
                        </span>
                      </div>

                      <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 whitespace-pre-wrap">
                        {notifDetail.data.message || '—'}
                      </div>

                      {notifDetail.data.meta ? (
                        <div>
                          <div className="mb-1 text-xs font-semibold text-slate-600">Meta</div>
                          <pre className="overflow-auto rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs text-slate-700">
                            {String(notifDetail.data.meta)}
                          </pre>
                        </div>
                      ) : null}
                    </div>
                  ) : (
                    <div className="text-sm text-slate-600">Không có dữ liệu.</div>
                  )}
                </Dialog>
              </div>
            ) : activeKey === 'logs' ? (
              <div className="p-5">
                <ModerationLogsPanel token={token} />
              </div>
            ) : activeKey === 'tags' ? (
              <div className="p-5">
                <div className="min-w-0 space-y-5">
                  <div className="rounded-2xl border border-slate-200 bg-white p-4">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                      <div>
                        <div className="text-sm font-semibold text-slate-800">Thể loại</div>
                        <div className="mt-1 text-xs text-slate-500">Tạo/sửa/xóa, tìm kiếm & lọc thể loại (dữ liệu từ database thật).</div>
                      </div>

                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                        <input
                          value={categoryQ}
                          onChange={(e) => setCategoryQ(e.target.value)}
                          placeholder="Tìm theo tên / slug"
                          className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-pink-300 focus:ring-2 focus:ring-pink-100 sm:w-[320px]"
                        />
                        <select
                          value={categoryFilter}
                          onChange={(e) => setCategoryFilter(e.target.value)}
                          className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-pink-300 focus:ring-2 focus:ring-pink-100 sm:w-[220px]"
                        >
                          <option value="ALL">Tất cả (chưa xóa)</option>
                          <option value="ACTIVE">Đang bật</option>
                          <option value="INACTIVE">Tạm tắt</option>
                          <option value="DELETED">Đã xóa</option>
                        </select>
                        <button
                          type="button"
                          onClick={() => openTaxonomyDialog('category', 'create', null)}
                          className="h-11 rounded-xl bg-pink-500 px-4 text-sm font-semibold text-white hover:bg-pink-600"
                        >
                          + Tạo thể loại
                        </button>
                      </div>
                    </div>

                    {categoryError ? (
                      <div className="mt-3 rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">{categoryError}</div>
                    ) : null}
                  </div>

                  <div className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white">
                    <div className="flex flex-col gap-2 border-b border-slate-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="text-sm font-semibold text-slate-800">Danh sách thể loại</div>
                      <div className="text-xs text-slate-500">
                        {categoryLoading ? 'Đang tải...' : `${(categoryData.totalElements || 0).toLocaleString('vi-VN')} thể loại`}
                      </div>
                    </div>

                    <div className="w-full overflow-x-auto">
                      <table className="min-w-[900px] w-full border-collapse">
                        <thead>
                          <tr className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                            <th className="px-4 py-3">ID</th>
                            <th className="px-4 py-3">Tên</th>
                            <th className="px-4 py-3">Slug</th>
                            <th className="px-4 py-3">Trạng thái</th>
                            <th className="px-4 py-3">Cập nhật</th>
                            <th className="px-4 py-3">Thao tác</th>
                          </tr>
                        </thead>
                        <tbody>
                          {categoryLoading ? (
                            <tr>
                              <td colSpan={6} className="px-4 py-10 text-center text-sm text-slate-500">
                                Đang tải danh sách thể loại...
                              </td>
                            </tr>
                          ) : (categoryData.content || []).length === 0 ? (
                            <tr>
                              <td colSpan={6} className="px-4 py-10 text-center text-sm text-slate-500">
                                Không có thể loại phù hợp.
                              </td>
                            </tr>
                          ) : (
                            (categoryData.content || []).map((c) => {
                              const badge = taxonomyStatusBadge(c);
                              const disabled = Boolean(c?.deletedAt);
                              return (
                                <tr key={c.id} className="border-t border-slate-100 text-sm">
                                  <td className="px-4 py-3 font-semibold text-slate-700">{c.id}</td>
                                  <td className="px-4 py-3">
                                    <div className="font-semibold text-slate-800">{c.name || '—'}</div>
                                  </td>
                                  <td className="px-4 py-3 text-slate-700">{c.slug || '—'}</td>
                                  <td className="px-4 py-3">
                                    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${badge.cls}`}>{badge.label}</span>
                                  </td>
                                  <td className="px-4 py-3 text-slate-600">{formatDateTimeVi(c.updatedAt)}</td>
                                  <td className="px-4 py-3">
                                    <div className="flex flex-wrap gap-2">
                                      <button
                                        type="button"
                                        onClick={() => openTaxonomyDialog('category', 'edit', c)}
                                        disabled={disabled}
                                        className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                                      >
                                        Sửa
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => openTaxonomyDialog('category', 'delete', c)}
                                        disabled={disabled}
                                        className="h-9 rounded-lg bg-rose-600 px-3 text-xs font-semibold text-white hover:bg-rose-700 disabled:opacity-60"
                                      >
                                        Xóa
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white p-4">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                      <div>
                        <div className="text-sm font-semibold text-slate-800">Tag</div>
                        <div className="mt-1 text-xs text-slate-500">Tạo/sửa/xóa, tìm kiếm & lọc tag (dữ liệu từ database thật).</div>
                      </div>

                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                        <input
                          value={tagQ}
                          onChange={(e) => setTagQ(e.target.value)}
                          placeholder="Tìm theo tên / slug"
                          className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-pink-300 focus:ring-2 focus:ring-pink-100 sm:w-[320px]"
                        />
                        <select
                          value={tagFilter}
                          onChange={(e) => setTagFilter(e.target.value)}
                          className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-pink-300 focus:ring-2 focus:ring-pink-100 sm:w-[220px]"
                        >
                          <option value="ALL">Tất cả (chưa xóa)</option>
                          <option value="ACTIVE">Đang bật</option>
                          <option value="INACTIVE">Tạm tắt</option>
                          <option value="DELETED">Đã xóa</option>
                        </select>
                        <button
                          type="button"
                          onClick={() => openTaxonomyDialog('tag', 'create', null)}
                          className="h-11 rounded-xl bg-pink-500 px-4 text-sm font-semibold text-white hover:bg-pink-600"
                        >
                          + Tạo tag
                        </button>
                      </div>
                    </div>

                    {tagError ? (
                      <div className="mt-3 rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">{tagError}</div>
                    ) : null}
                  </div>

                  <div className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white">
                    <div className="flex flex-col gap-2 border-b border-slate-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="text-sm font-semibold text-slate-800">Danh sách tag</div>
                      <div className="text-xs text-slate-500">
                        {tagLoading ? 'Đang tải...' : `${(tagData.totalElements || 0).toLocaleString('vi-VN')} tag`}
                      </div>
                    </div>

                    <div className="w-full overflow-x-auto">
                      <table className="min-w-[900px] w-full border-collapse">
                        <thead>
                          <tr className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                            <th className="px-4 py-3">ID</th>
                            <th className="px-4 py-3">Tên</th>
                            <th className="px-4 py-3">Slug</th>
                            <th className="px-4 py-3">Trạng thái</th>
                            <th className="px-4 py-3">Cập nhật</th>
                            <th className="px-4 py-3">Thao tác</th>
                          </tr>
                        </thead>
                        <tbody>
                          {tagLoading ? (
                            <tr>
                              <td colSpan={6} className="px-4 py-10 text-center text-sm text-slate-500">
                                Đang tải danh sách tag...
                              </td>
                            </tr>
                          ) : (tagData.content || []).length === 0 ? (
                            <tr>
                              <td colSpan={6} className="px-4 py-10 text-center text-sm text-slate-500">
                                Không có tag phù hợp.
                              </td>
                            </tr>
                          ) : (
                            (tagData.content || []).map((t) => {
                              const badge = taxonomyStatusBadge(t);
                              const disabled = Boolean(t?.deletedAt);
                              return (
                                <tr key={t.id} className="border-t border-slate-100 text-sm">
                                  <td className="px-4 py-3 font-semibold text-slate-700">{t.id}</td>
                                  <td className="px-4 py-3">
                                    <div className="font-semibold text-slate-800">{t.name || '—'}</div>
                                  </td>
                                  <td className="px-4 py-3 text-slate-700">{t.slug || '—'}</td>
                                  <td className="px-4 py-3">
                                    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${badge.cls}`}>{badge.label}</span>
                                  </td>
                                  <td className="px-4 py-3 text-slate-600">{formatDateTimeVi(t.updatedAt)}</td>
                                  <td className="px-4 py-3">
                                    <div className="flex flex-wrap gap-2">
                                      <button
                                        type="button"
                                        onClick={() => openTaxonomyDialog('tag', 'edit', t)}
                                        disabled={disabled}
                                        className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                                      >
                                        Sửa
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => openTaxonomyDialog('tag', 'delete', t)}
                                        disabled={disabled}
                                        className="h-9 rounded-lg bg-rose-600 px-3 text-xs font-semibold text-white hover:bg-rose-700 disabled:opacity-60"
                                      >
                                        Xóa
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="px-5 py-10">
                <div className="rounded-2xl border border-slate-200 bg-white px-5 py-6">
                  <p className="text-sm text-slate-600">Tính năng này chưa được triển khai trong phiên bản hiện tại.</p>
                </div>
              </div>
            )}
          </section>
        </div>
      </div>

      {/* Chapter preview */}
      <Dialog
        open={chapterPreview.open}
        title={chapterPreview.chapter ? `Xem nội dung: ${chapterPreview.chapter.title}` : 'Xem nội dung chương'}
        primaryLabel="Đóng"
        secondaryLabel=""
        onSecondary={() => setChapterPreview({ open: false, chapter: null })}
        onPrimary={() => setChapterPreview({ open: false, chapter: null })}
      >
        {chapterPreview.chapter ? (
          <div className="space-y-3">
            <div className="text-sm text-slate-600">
              <span className="font-semibold text-slate-800">Ngày đăng:</span> {formatDateTimeVi(chapterPreview.chapter.createdAt)}
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700">
              {chapterPreview.chapter.content || 'Nội dung chương (demo) — backend chưa trả về content cho chương này.'}
            </div>
          </div>
        ) : null}
      </Dialog>

      {/* Story moderation dialog */}
      <Dialog
        open={storyDialog.open}
        title={storyDialog.type === 'approve' ? 'Xác nhận duyệt truyện' : storyDialog.type === 'reject' ? 'Từ chối truyện' : 'Xác nhận'}
        primaryLabel={storyDialog.type === 'approve' ? 'Duyệt' : storyDialog.type === 'reject' ? 'Từ chối' : 'Xác nhận'}
        secondaryLabel="Hủy"
        onSecondary={closeStoryDialog}
        onPrimary={confirmStoryDialog}
        danger={storyDialog.type === 'reject'}
      >
        {currentStory ? (
          <div className="space-y-4">
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <div className="text-sm font-semibold text-slate-800">{currentStory.title || 'Không tên'}</div>
              <div className="mt-1 text-xs text-slate-500">
                Tác giả: {currentStory.authorName || '—'} • Ngày tạo: {formatDateTimeVi(currentStory.createdAt)}
              </div>
            </div>

            {storyDialog.type === 'approve' ? (
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Ghi chú (tuỳ chọn)</label>
                <textarea
                  value={storyDialogNote}
                  onChange={(e) => setStoryDialogNote(e.target.value)}
                  rows={4}
                  className="w-full rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-700 outline-none transition focus:border-pink-300 focus:ring-2 focus:ring-pink-100"
                  placeholder="Nhập ghi chú cho tác giả (nếu có)..."
                />
              </div>
            ) : null}

            {storyDialog.type === 'reject' ? (
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Ghi chú lý do từ chối (bắt buộc)</label>
                <textarea
                  value={storyDialogNote}
                  onChange={(e) => setStoryDialogNote(e.target.value)}
                  rows={4}
                  className="w-full rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-700 outline-none transition focus:border-pink-300 focus:ring-2 focus:ring-pink-100"
                  placeholder="Ví dụ: Thiếu thông tin mô tả, nội dung vi phạm quy định..."
                />
              </div>
            ) : null}
          </div>
        ) : (
          <p className="text-sm text-slate-500">Không tìm thấy truyện.</p>
        )}
      </Dialog>

      {/* Action dialog */}
      <Dialog
        open={dialog.open}
        title={
          dialog.type === 'approve'
            ? 'Xác nhận duyệt chương'
            : dialog.type === 'reject'
              ? 'Từ chối chương'
              : dialog.type === 'hide'
                ? 'Ẩn chương'
                : dialog.type === 'warn'
                  ? 'Gửi cảnh báo cho tác giả'
                  : dialog.type === 'status'
                    ? 'Chỉnh sửa trạng thái chương'
                    : dialog.type === 'note'
                      ? 'Ghi chú lý do vi phạm'
                      : 'Xác nhận thao tác'
        }
        primaryLabel={dialog.type === 'approve' ? 'Duyệt' : dialog.type === 'reject' ? 'Từ chối' : 'Xác nhận'}
        secondaryLabel="Hủy"
        onSecondary={closeDialog}
        onPrimary={confirmDialog}
        danger={dialog.type === 'reject'}
      >
        {currentChapter ? (
          <div className="space-y-4">
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <div className="text-sm font-semibold text-slate-800">{currentChapter.title}</div>
              <div className="mt-1 text-xs text-slate-500">Ngày đăng: {formatDateTimeVi(currentChapter.createdAt)}</div>
            </div>

            {dialog.type === 'approve' ? (
              <p className="text-sm text-slate-600">Bạn có chắc muốn duyệt chương này không?</p>
            ) : null}

            {dialog.type === 'reject' || dialog.type === 'hide' || dialog.type === 'warn' || dialog.type === 'note' ? (
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  {dialog.type === 'warn'
                    ? 'Nội dung cảnh báo'
                    : dialog.type === 'reject'
                      ? 'Ghi chú lý do vi phạm (bắt buộc)'
                      : 'Ghi chú lý do vi phạm (tuỳ chọn)'}
                </label>
                <textarea
                  value={dialogNote}
                  onChange={(e) => setDialogNote(e.target.value)}
                  rows={4}
                  className="w-full rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-700 outline-none transition focus:border-pink-300 focus:ring-2 focus:ring-pink-100"
                  placeholder={
                    dialog.type === 'warn'
                      ? 'Ví dụ: Chương có nội dung nhạy cảm, vui lòng chỉnh sửa theo quy định...'
                      : 'Nhập lý do/ghi chú...'
                  }
                />
              </div>
            ) : null}

            {dialog.type === 'status' ? (
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Trạng thái duyệt</label>
                <select
                  value={dialogStatus}
                  onChange={(e) => setDialogStatus(e.target.value)}
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none focus:border-pink-300 focus:ring-2 focus:ring-pink-100"
                >
                  <option value="PENDING">Chờ duyệt</option>
                  <option value="APPROVED">Đã duyệt</option>
                  <option value="REJECTED">Từ chối</option>
                  <option value="HIDDEN">Đã ẩn</option>
                </select>
              </div>
            ) : null}
          </div>
        ) : (
          <p className="text-sm text-slate-500">Không tìm thấy chương.</p>
        )}
      </Dialog>

      {/* Comment actions dialog */}
      <Dialog
        open={commentDialog.open}
        title={
          commentDialog.type === 'hide'
            ? 'Ẩn bình luận'
            : commentDialog.type === 'unhide'
              ? 'Bỏ ẩn bình luận'
              : commentDialog.type === 'delete'
                ? 'Xóa bình luận'
                : 'Xác nhận'
        }
        primaryLabel={commentDialog.type === 'hide' ? 'Ẩn' : commentDialog.type === 'unhide' ? 'Bỏ ẩn' : commentDialog.type === 'delete' ? 'Xóa' : 'Xác nhận'}
        secondaryLabel="Hủy"
        onSecondary={closeCommentDialog}
        onPrimary={confirmCommentDialog}
        danger={commentDialog.type === 'delete'}
      >
        {commentDialog.comment ? (
          <div className="space-y-4">
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <div className="text-sm font-semibold text-slate-800">Bình luận #{commentDialog.comment.id}</div>
              <div className="mt-1 max-w-[520px] truncate text-xs text-slate-600">{commentDialog.comment.content || '—'}</div>
            </div>

            {commentDialog.type === 'hide' ? (
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Lý do ẩn (bắt buộc)</label>
                <textarea
                  value={commentDialogReason}
                  onChange={(e) => setCommentDialogReason(e.target.value)}
                  rows={4}
                  className="w-full rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-700 outline-none transition focus:border-pink-300 focus:ring-2 focus:ring-pink-100"
                  placeholder="Ví dụ: Bình luận có ngôn từ không phù hợp..."
                />
              </div>
            ) : null}

            {commentDialog.type === 'delete' ? <p className="text-sm text-slate-600">Bạn có chắc muốn xóa bình luận này không?</p> : null}
            {commentDialog.type === 'unhide' ? <p className="text-sm text-slate-600">Bình luận sẽ được hiển thị lại.</p> : null}
          </div>
        ) : (
          <p className="text-sm text-slate-500">Không tìm thấy bình luận.</p>
        )}
      </Dialog>

      {/* Category/Tag dialog */}
      <Dialog
        open={taxonomyDialog.open}
        title={
          taxonomyDialog.entity === 'category'
            ? taxonomyDialog.type === 'create'
              ? 'Tạo thể loại'
              : taxonomyDialog.type === 'edit'
                ? 'Sửa thể loại'
                : 'Xóa thể loại'
            : taxonomyDialog.entity === 'tag'
              ? taxonomyDialog.type === 'create'
                ? 'Tạo tag'
                : taxonomyDialog.type === 'edit'
                  ? 'Sửa tag'
                  : 'Xóa tag'
              : 'Xác nhận'
        }
        primaryLabel={taxonomyDialog.type === 'delete' ? 'Xóa' : taxonomyDialog.type === 'edit' ? 'Lưu' : 'Tạo'}
        secondaryLabel="Hủy"
        onSecondary={closeTaxonomyDialog}
        onPrimary={confirmTaxonomyDialog}
        danger={taxonomyDialog.type === 'delete'}
      >
        {taxonomyDialog.type === 'delete' ? (
          <div className="space-y-2">
            <p className="text-sm text-slate-600">Bạn có chắc muốn xóa mục này không? (Soft delete)</p>
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <div className="text-sm font-semibold text-slate-800">{taxonomyDialog.item?.name || '—'}</div>
              <div className="mt-1 text-xs text-slate-500">Slug: {taxonomyDialog.item?.slug || '—'}</div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">Tên (bắt buộc)</label>
              <input
                value={taxonomyForm.name}
                onChange={(e) => setTaxonomyForm((p) => ({ ...p, name: e.target.value }))}
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-700 outline-none transition focus:border-pink-300 focus:ring-2 focus:ring-pink-100"
                placeholder={taxonomyDialog.entity === 'tag' ? 'Ví dụ: romance' : 'Ví dụ: Ngôn tình'}
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">Slug (tuỳ chọn)</label>
              <input
                value={taxonomyForm.slug}
                onChange={(e) => setTaxonomyForm((p) => ({ ...p, slug: e.target.value }))}
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-700 outline-none transition focus:border-pink-300 focus:ring-2 focus:ring-pink-100"
                placeholder="Nếu bỏ trống sẽ tự tạo từ tên"
              />
            </div>
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={Boolean(taxonomyForm.isActive)}
                onChange={(e) => setTaxonomyForm((p) => ({ ...p, isActive: e.target.checked }))}
              />
              Đang bật
            </label>
            {taxonomySubmitting ? <div className="text-xs text-slate-500">Đang xử lý...</div> : null}
          </div>
        )}
      </Dialog>
    </div>
  );
}
