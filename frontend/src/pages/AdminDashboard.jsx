import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getRedirectPathByRole } from '../utils/authRedirect';

import {
  adminListStories,
  adminHideStory,
  adminUnhideStory,
  adminListUsers,
  adminLockUser,
  adminSetUserRole,
  adminUnlockUser,
  adminCancelVip,
  fetchAdminChaptersByStoryId,
  fetchAdminDashboardSummary,
  fetchAdminPendingStories,
  fetchAdminStoriesForModeration,
  adminListVipUsers,
  reviewAdminStory,
  adminUpgradeVip,
  adminListReports,
  adminHandleReport,
  adminSendSystemNotification,
  getMyNotificationDetail,
  getMyUnreadNotificationCount,
  listMyNotifications,
  updateAdminChapterModeration,
  updateMyNotificationReadState
} from '../services/adminService';
import ModerationLogsPanel from '../components/ModerationLogsPanel';

const SIDEBAR_ITEMS = [
  { key: 'overview', label: 'Tổng quan' },
  { key: 'stories', label: 'Quản lý truyện', to: '/admin/stories' },
  { key: 'chapters', label: 'Quản lý chương theo truyện', to: '/admin/chapters' },
  { key: 'reports', label: 'Báo cáo vi phạm' },
  { key: 'comments', label: 'Quản lý bình luận', to: '/admin/comments' },
  { key: 'tags', label: 'Quản lý tag & thể loại', to: '/admin/tags' },
  { key: 'notifications', label: 'Thông báo hệ thống' },
  { key: 'logs', label: 'Nhật ký kiểm duyệt' },
  { key: 'vip', label: 'Quản lý VIP', to: '/admin/vip' },
  { key: 'users', label: 'Người dùng' }
];

const REPORT_STATUS_OPTIONS = [
  { value: '', label: 'Tất cả trạng thái' },
  { value: 'PENDING', label: 'Chờ xử lý' },
  { value: 'RESOLVED', label: 'Đã giải quyết' },
  { value: 'REJECTED', label: 'Đã từ chối' }
];

const REPORT_TARGET_OPTIONS = [
  { value: '', label: 'Tất cả loại' },
  { value: 'STORY', label: 'Truyện' },
  { value: 'CHAPTER', label: 'Chương' },
  { value: 'COMMENT', label: 'Bình luận' }
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

const STORY_MANAGEMENT_TABS = [
  { key: 'all', label: 'Tất cả truyện' },
  { key: 'pending', label: 'Chờ duyệt' }
];

const UI = {
  card: 'rounded-xl border border-slate-800 bg-slate-950/40',
  tableWrap: 'min-w-0 overflow-hidden rounded-xl border border-slate-800 bg-slate-950/40',
  tableHead: 'bg-slate-900/60 text-left text-xs font-semibold uppercase tracking-wide text-slate-300',
  row: 'border-t border-slate-800 text-sm hover:bg-slate-900/30',
  input:
    'rounded-lg border border-slate-700 bg-slate-950 text-sm text-slate-100 outline-none transition focus:border-slate-500 disabled:opacity-60',
  buttonPrimary:
    'rounded-lg border border-slate-600 bg-slate-800 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-60',
  buttonSecondary:
    'rounded-lg border border-slate-700 bg-slate-950 text-sm font-semibold text-slate-200 hover:bg-slate-900 disabled:opacity-60',
  badge: 'rounded-full border border-slate-700 bg-slate-950 px-2.5 py-1 text-xs font-semibold text-slate-200'
};

function reportStatusBadge(status) {
  if (status === 'RESOLVED') return { label: 'Đã giải quyết', cls: 'bg-slate-800 text-slate-200 border-slate-700' };
  if (status === 'REJECTED') return { label: 'Từ chối', cls: 'bg-slate-800 text-slate-300 border-slate-700' };
  return { label: 'Chờ xử lý', cls: 'bg-slate-950 text-white border-slate-600' };
}

function targetTypeLabel(t) {
  if (t === 'STORY') return 'Truyện';
  if (t === 'CHAPTER') return 'Chương';
  if (t === 'COMMENT') return 'Bình luận';
  return t || '—';
}

function notificationTypeBadge(type) {
  const normalized = String(type || 'SYSTEM').toUpperCase();
  if (normalized === 'SYSTEM') return { label: 'Hệ thống', cls: 'bg-slate-950 text-white border-slate-600' };
  if (normalized === 'WARNING') return { label: 'Cảnh báo', cls: 'bg-slate-800 text-slate-100 border-slate-700' };
  if (normalized.endsWith('APPROVED')) return { label: 'Đã duyệt', cls: 'bg-slate-800 text-slate-100 border-slate-700' };
  if (normalized.endsWith('REJECTED')) return { label: 'Từ chối', cls: 'bg-slate-800 text-slate-100 border-slate-700' };
  if (normalized.startsWith('VIP_')) return { label: 'VIP', cls: 'bg-slate-800 text-slate-100 border-slate-700' };
  return { label: normalized, cls: 'bg-slate-800 text-slate-300 border-slate-700' };
}

const ROLE_OPTIONS = ['GUEST', 'USER', 'AUTHOR', 'MODERATOR', 'ADMIN', 'VIP'];
const CHAPTER_FILTERS = [
  { key: 'ALL', label: 'Tất cả' },
  { key: 'PENDING', label: 'Chờ duyệt' },
  { key: 'APPROVED', label: 'Đã duyệt' },
  { key: 'REJECTED', label: 'Từ chối' },
  { key: 'HIDDEN', label: 'Đã ẩn' }
];

function formatNumber(value) {
  const n = typeof value === 'number' ? value : Number(value);
  const safe = Number.isFinite(n) ? n : 0;
  return new Intl.NumberFormat('vi-VN').format(safe);
}

function formatDateTimeVi(isoLike) {
  if (!isoLike) return '—';
  const date = new Date(isoLike);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString('vi-VN');
}

function isVipActive(vipExpiryDate) {
  if (!vipExpiryDate) return false;
  const d = new Date(vipExpiryDate);
  if (Number.isNaN(d.getTime())) return false;
  return d.getTime() > Date.now();
}

function isAllZero(summary) {
  if (!summary) return false;
  const fields = ['totalUsers', 'totalStories', 'totalChapters', 'pendingStories', 'vipUsers'];
  return fields.every((k) => Number(summary?.[k] || 0) === 0);
}

function storyStatusLabel(story) {
  const submission = String(story?.submissionStatus || '').trim();
  const status = String(story?.status || '').trim();
  const storyStatus = String(story?.storyStatus || '').trim();
  return submission || status || storyStatus || '—';
}

function chapterStatusLabel(status) {
  const normalized = String(status || '').toUpperCase();
  if (normalized === 'APPROVED') return 'Đã duyệt';
  if (normalized === 'REJECTED') return 'Từ chối';
  if (normalized === 'HIDDEN') return 'Đã ẩn';
  return 'Chờ duyệt';
}

function Dialog({ open, title, children, primaryLabel, onPrimary, secondaryLabel, onSecondary, danger, primaryDisabled }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-xl rounded-xl border border-slate-800 bg-slate-950 shadow-soft">
        <div className="flex items-start justify-between gap-3 border-b border-slate-800 px-5 py-4">
          <div>
            <h3 className="text-lg font-semibold text-white">{title}</h3>
          </div>
          <button
            type="button"
            onClick={onSecondary}
            className="rounded-md px-2 py-1 text-slate-400 hover:bg-slate-900 hover:text-slate-200"
            aria-label="Đóng"
          >
            ✕
          </button>
        </div>

        <div className="px-5 py-4">{children}</div>

        <div className="flex flex-col-reverse gap-2 border-t border-slate-800 px-5 py-4 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onSecondary}
            className={`h-10 px-4 ${UI.buttonSecondary}`}
          >
            {secondaryLabel || 'Hủy'}
          </button>
          <button
            type="button"
            onClick={onPrimary}
            disabled={primaryDisabled}
            className={
              danger
                ? `h-10 px-4 ${UI.buttonSecondary} text-white`
                : `h-10 px-4 ${UI.buttonPrimary}`
            }
          >
            {primaryLabel || 'Xác nhận'}
          </button>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, hint }) {
  return (
    <div
      className={`group p-4 shadow-soft transition will-change-transform hover:-translate-y-0.5 hover:border-slate-600 hover:bg-slate-900/40 ${UI.card}`}
      role="status"
    >
      <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</div>
      <div className="mt-2 text-3xl font-extrabold text-white transition group-hover:text-slate-50">{formatNumber(value)}</div>
      {hint ? <div className="mt-1 text-xs text-slate-500">{hint}</div> : null}
    </div>
  );
}

export default function AdminDashboard({ initialTab } = {}) {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const role = String(localStorage.getItem('role') || '').toUpperCase().trim();
  const username = localStorage.getItem('username');

  const [activeKey, setActiveKey] = useState(() => {
    const wanted = String(initialTab || '').trim();
    if (wanted === 'pending') return 'stories';
    return SIDEBAR_ITEMS.some((i) => i.key === wanted) ? wanted : 'overview';
  });

  const [toast, setToast] = useState('');

  const [summary, setSummary] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState('');

  const [pendingStories, setPendingStories] = useState([]);
  const [pendingLoading, setPendingLoading] = useState(false);
  const [pendingError, setPendingError] = useState('');

  const [storiesLoading, setStoriesLoading] = useState(false);
  const [storiesError, setStoriesError] = useState('');
  const [storyTitleQ, setStoryTitleQ] = useState('');
  const [storyAuthorQ, setStoryAuthorQ] = useState('');
  const [storyStatus, setStoryStatus] = useState('');
  const [storyListMode, setStoryListMode] = useState('all');
  const [storyPage, setStoryPage] = useState(0);
  const storySize = 10;
  const [storiesData, setStoriesData] = useState(() => ({ content: [], page: 0, size: storySize, totalElements: 0, totalPages: 0 }));
  const [chapterStoriesLoading, setChapterStoriesLoading] = useState(false);
  const [chapterStories, setChapterStories] = useState([]);
  const [selectedChapterStoryId, setSelectedChapterStoryId] = useState('');
  const [chaptersLoading, setChaptersLoading] = useState(false);
  const [chaptersError, setChaptersError] = useState('');
  const [chapterSearch, setChapterSearch] = useState('');
  const [chapterFilter, setChapterFilter] = useState('ALL');
  const [chapterPage, setChapterPage] = useState(1);
  const chapterSize = 8;
  const [chaptersData, setChaptersData] = useState([]);
  const [chapterSubmittingId, setChapterSubmittingId] = useState(null);

  const [userQ, setUserQ] = useState('');
  const [userRole, setUserRole] = useState('');
  const [userPage, setUserPage] = useState(0);
  const userSize = 10;
  const [userLoading, setUserLoading] = useState(false);
  const [userError, setUserError] = useState('');
  const [userData, setUserData] = useState(() => ({ content: [], page: 0, size: userSize, totalElements: 0, totalPages: 0 }));

  const [userDialog, setUserDialog] = useState({ open: false, type: null, user: null, nextRole: '' });
  const [userDialogReason, setUserDialogReason] = useState('');
  const [userSubmitting, setUserSubmitting] = useState(false);

  const [vipQ, setVipQ] = useState('');
  const [vipStatusFilter, setVipStatusFilter] = useState('ACTIVE');
  const [vipPage, setVipPage] = useState(0);
  const vipSize = 10;
  const [vipLoading, setVipLoading] = useState(false);
  const [vipError, setVipError] = useState('');
  const [vipData, setVipData] = useState(() => ({ content: [], page: 0, size: vipSize, totalElements: 0, totalPages: 0 }));
  const [vipDialog, setVipDialog] = useState({ open: false, type: null, user: null, days: 30 });
  const [vipSubmittingId, setVipSubmittingId] = useState(null);

  const [storyDialog, setStoryDialog] = useState({ open: false, type: null, story: null });
  const [storyDialogNote, setStoryDialogNote] = useState('');
  const [storyConfirm, setStoryConfirm] = useState({ open: false });
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [hideSubmittingId, setHideSubmittingId] = useState(null);
  const [unhideSubmittingId, setUnhideSubmittingId] = useState(null);

  // ── Reports tab state ────────────────────────────────────────────────────
  const [reportStatus, setReportStatus] = useState('');
  const [reportTargetType, setReportTargetType] = useState('');
  const [reportQ, setReportQ] = useState('');
  const [reportPage, setReportPage] = useState(0);
  const reportSize = 10;
  const [reportLoading, setReportLoading] = useState(false);
  const [reportError, setReportError] = useState('');
  const [reportData, setReportData] = useState({ content: [], page: 0, size: reportSize, totalElements: 0, totalPages: 0 });
  const [reportDetailModal, setReportDetailModal] = useState({ open: false, report: null });
  const [handleModal, setHandleModal] = useState({ open: false, report: null, resolution: 'RESOLVED', note: '' });
  const [handleSubmitting, setHandleSubmitting] = useState(false);

  const [notifType, setNotifType] = useState('');
  const [notifReadFilter, setNotifReadFilter] = useState('ALL');
  const [notifPage, setNotifPage] = useState(0);
  const notifSize = 10;
  const [notifLoading, setNotifLoading] = useState(false);
  const [notifError, setNotifError] = useState('');
  const [notifUnreadCount, setNotifUnreadCount] = useState(0);
  const [notifData, setNotifData] = useState({ content: [], page: 0, size: notifSize, totalElements: 0, totalPages: 0 });
  const [notifDetail, setNotifDetail] = useState({ open: false, loading: false, error: '', data: null });
  const [notifMarkingId, setNotifMarkingId] = useState(null);
  const [notifSendForm, setNotifSendForm] = useState({ type: 'SYSTEM', title: '', message: '' });
  const [notifSending, setNotifSending] = useState(false);

  useEffect(() => {
    if (!token) {
      navigate('/login', { replace: true });
      return;
    }
    if (role && role !== 'ADMIN') {
      navigate(getRedirectPathByRole(role), { replace: true });
    }
  }, [token, role, navigate]);

  const pageTitle = useMemo(() => SIDEBAR_ITEMS.find((i) => i.key === activeKey)?.label || 'Admin', [activeKey]);

  const cards = useMemo(() => {
    const s = summary || {};
    return [
      { key: 'totalUsers', label: 'Tổng người dùng', value: Number(s.totalUsers || 0) },
      { key: 'totalStories', label: 'Tổng truyện', value: Number(s.totalStories || 0) },
      { key: 'totalChapters', label: 'Tổng chương', value: Number(s.totalChapters || 0) },
      { key: 'pendingStories', label: 'Truyện chờ duyệt', value: Number(s.pendingStories || 0) },
      { key: 'vipUsers', label: 'Người dùng VIP', value: Number(s.vipUsers || 0) }
    ];
  }, [summary]);

  const loadSummary = async () => {
    if (!token) return;
    setSummaryError('');
    setSummaryLoading(true);
    try {
      const data = await fetchAdminDashboardSummary({ token });
      setSummary(data || null);
    } catch (err) {
      setSummary(null);
      setSummaryError(err?.response?.data?.message || 'Không lấy được số liệu tổng quan.');
    } finally {
      setSummaryLoading(false);
    }
  };

  const loadPendingStories = async () => {
    if (!token) return;
    setPendingError('');
    setPendingLoading(true);
    try {
      const data = await fetchAdminPendingStories({ token });
      setPendingStories(Array.isArray(data) ? data : []);
    } catch (err) {
      setPendingStories([]);
      setPendingError(err?.response?.data?.message || 'Không tải được danh sách truyện chờ duyệt.');
    } finally {
      setPendingLoading(false);
    }
  };

  const loadUsers = async (nextPage = userPage) => {
    if (!token) return;
    setUserError('');
    setUserLoading(true);
    try {
      const res = await adminListUsers({
        token,
        page: Math.max(0, Number(nextPage || 0)),
        size: userSize,
        q: userQ,
        role: userRole || undefined
      });
      setUserData(
        res || {
          content: [],
          page: 0,
          size: userSize,
          totalElements: 0,
          totalPages: 0
        }
      );
    } catch (err) {
      setUserData({ content: [], page: 0, size: userSize, totalElements: 0, totalPages: 0 });
      setUserError(err?.response?.data?.message || 'Không tải được danh sách người dùng.');
    } finally {
      setUserLoading(false);
    }
  };

  const loadVipUsers = async (nextPage = vipPage, nextQ = vipQ) => {
    if (!token) return;
    setVipError('');
    setVipLoading(true);
    try {
      const res = await adminListVipUsers({
        token,
        page: Math.max(0, Number(nextPage || 0)),
        size: vipSize,
        q: nextQ
      });
      setVipData(
        res || {
          content: [],
          page: 0,
          size: vipSize,
          totalElements: 0,
          totalPages: 0
        }
      );
      if (res && typeof res.page === 'number') {
        setVipPage(Math.max(0, Number(res.page || 0)));
      }
    } catch (err) {
      setVipData({ content: [], page: 0, size: vipSize, totalElements: 0, totalPages: 0 });
      setVipError(err?.response?.data?.message || 'Không tải được danh sách VIP.');
    } finally {
      setVipLoading(false);
    }
  };

  const loadReports = async (nextPage = reportPage) => {
    if (!token) return;
    setReportError('');
    setReportLoading(true);
    try {
      const res = await adminListReports({
        token,
        page: Math.max(0, Number(nextPage || 0)),
        size: reportSize,
        status: reportStatus || undefined,
        targetType: reportTargetType || undefined,
        q: reportQ
      });
      setReportData(res || { content: [], page: 0, size: reportSize, totalElements: 0, totalPages: 0 });
    } catch (err) {
      setReportData({ content: [], page: 0, size: reportSize, totalElements: 0, totalPages: 0 });
      setReportError(err?.response?.data?.message || 'Không tải được báo cáo vi phạm.');
    } finally {
      setReportLoading(false);
    }
  };

  const loadNotifications = async (nextPage = notifPage) => {
    if (!token) return;
    setNotifError('');
    setNotifLoading(true);
    try {
      const isRead = notifReadFilter === 'READ' ? true : notifReadFilter === 'UNREAD' ? false : undefined;
      const [pageRes, countRes] = await Promise.all([
        listMyNotifications({
          token,
          page: Math.max(0, Number(nextPage || 0)),
          size: notifSize,
          type: notifType || undefined,
          isRead
        }),
        getMyUnreadNotificationCount({ token })
      ]);
      setNotifData(pageRes || { content: [], page: 0, size: notifSize, totalElements: 0, totalPages: 0 });
      setNotifUnreadCount(Number(countRes?.unreadCount || 0));
      if (pageRes && typeof pageRes.page === 'number') {
        setNotifPage(Math.max(0, Number(pageRes.page || 0)));
      }
    } catch (err) {
      setNotifData({ content: [], page: 0, size: notifSize, totalElements: 0, totalPages: 0 });
      setNotifUnreadCount(0);
      setNotifError(err?.response?.data?.message || 'Không tải được danh sách thông báo.');
    } finally {
      setNotifLoading(false);
    }
  };

  const openNotificationDetail = async (item) => {
    const id = item?.id;
    if (!token || !id) return;
    setNotifDetail({ open: true, loading: true, error: '', data: null });
    try {
      const data = await getMyNotificationDetail({ token, id });
      setNotifDetail({ open: true, loading: false, error: '', data });
    } catch (err) {
      setNotifDetail({
        open: true,
        loading: false,
        error: err?.response?.data?.message || 'Không tải được chi tiết thông báo.',
        data: null
      });
    }
  };

  const closeNotificationDetail = () => {
    setNotifDetail({ open: false, loading: false, error: '', data: null });
  };

  const markNotificationRead = async (item) => {
    const id = item?.id;
    if (!token || !id || Boolean(item?.isRead)) return;
    setNotifMarkingId(id);
    try {
      const updated = await updateMyNotificationReadState({ token, id, isRead: true });
      const nextItem = updated || { ...item, isRead: true, readAt: new Date().toISOString() };

      setNotifData((prev) => {
        const content = Array.isArray(prev?.content) ? prev.content : [];
        const nextContent =
          notifReadFilter === 'UNREAD'
            ? content.filter((n) => String(n.id) !== String(id))
            : content.map((n) => (String(n.id) === String(id) ? { ...n, ...nextItem, isRead: true } : n));
        return {
          ...(prev || {}),
          content: nextContent,
          totalElements:
            notifReadFilter === 'UNREAD'
              ? Math.max(0, Number(prev?.totalElements || 0) - 1)
              : Number(prev?.totalElements || 0)
        };
      });
      setNotifUnreadCount((count) => Math.max(0, Number(count || 0) - 1));
      setNotifDetail((prev) => {
        if (!prev?.open || !prev?.data || String(prev.data.id) !== String(id)) return prev;
        return { ...prev, data: { ...prev.data, ...nextItem, isRead: true } };
      });
      setToast('Đã đánh dấu thông báo là đã đọc.');
      setTimeout(() => setToast(''), 3000);
    } catch (err) {
      setToast(err?.response?.data?.message || 'Không cập nhật được trạng thái thông báo.');
      setTimeout(() => setToast(''), 3000);
    } finally {
      setNotifMarkingId(null);
    }
  };

  const submitSystemNotification = async () => {
    if (!token) return;
    const title = String(notifSendForm.title || '').trim();
    const message = String(notifSendForm.message || '').trim();
    const type = String(notifSendForm.type || 'SYSTEM').trim().toUpperCase();

    if (!title || !message) {
      setToast('Vui lòng nhập tiêu đề và nội dung thông báo.');
      setTimeout(() => setToast(''), 3000);
      return;
    }

    setNotifSending(true);
    try {
      const res = await adminSendSystemNotification({ token, type, title, message });
      const created = Number(res?.createdCount || 0);
      setNotifSendForm({ type: 'SYSTEM', title: '', message: '' });
      setNotifType('');
      setNotifReadFilter('ALL');
      setNotifPage(0);
      await loadNotifications(0);
      setToast(`Đã gửi thông báo hệ thống cho ${formatNumber(created)} người dùng.`);
      setTimeout(() => setToast(''), 3000);
    } catch (err) {
      setToast(err?.response?.data?.message || 'Không gửi được thông báo hệ thống.');
      setTimeout(() => setToast(''), 3000);
    } finally {
      setNotifSending(false);
    }
  };

  const loadStories = async (nextPage = storyPage) => {
    if (!token) return;
    setStoriesError('');
    setStoriesLoading(true);
    try {
      const res = await adminListStories({
        token,
        page: Math.max(0, Number(nextPage || 0)),
        size: storySize,
        q: storyTitleQ,
        author: storyAuthorQ,
        status: storyStatus || undefined
      });
      setStoriesData(
        res || {
          content: [],
          page: 0,
          size: storySize,
          totalElements: 0,
          totalPages: 0
        }
      );
      if (res && typeof res.page === 'number') {
        setStoryPage(Math.max(0, Number(res.page || 0)));
      }
    } catch (err) {
      setStoriesData({ content: [], page: 0, size: storySize, totalElements: 0, totalPages: 0 });
      setStoriesError(err?.response?.data?.message || 'Không tải được danh sách truyện.');
    } finally {
      setStoriesLoading(false);
    }
  };

  const loadChapterStories = async () => {
    if (!token) return;
    setChapterStoriesLoading(true);
    try {
      const res = await fetchAdminStoriesForModeration({ token });
      const stories = Array.isArray(res) ? res : [];
      setChapterStories(stories);
      setSelectedChapterStoryId((prev) => {
        if (prev && stories.some((s) => String(s.id) === String(prev))) return prev;
        return stories[0]?.id ? String(stories[0].id) : '';
      });
    } catch (err) {
      setChapterStories([]);
      setSelectedChapterStoryId('');
      setToast(err?.response?.data?.message || 'Không tải được danh sách truyện cho chương.');
      setTimeout(() => setToast(''), 3000);
    } finally {
      setChapterStoriesLoading(false);
    }
  };

  const loadChaptersByStory = async (storyId) => {
    if (!token || !storyId) return;
    setChaptersLoading(true);
    setChaptersError('');
    try {
      const data = await fetchAdminChaptersByStoryId({ token, storyId });
      setChaptersData(Array.isArray(data) ? data : []);
    } catch (err) {
      setChaptersData([]);
      setChaptersError(err?.response?.data?.message || 'Không tải được danh sách chương.');
    } finally {
      setChaptersLoading(false);
    }
  };

  useEffect(() => {
    if (!token) return;
    let alive = true;

    const run = async () => {
      if (!alive) return;
      if (activeKey === 'overview') {
        await loadSummary();
      }
      if (activeKey === 'stories') {
        if (storyListMode === 'pending') {
          await loadPendingStories();
        } else {
          await loadStories(storyPage);
        }
      }
      if (activeKey === 'chapters') {
        await loadChapterStories();
      }
      if (activeKey === 'users') {
        await loadUsers(userPage);
      }
      if (activeKey === 'vip') {
        await loadVipUsers(vipPage);
      }
      if (activeKey === 'reports') {
        await loadReports(reportPage);
      }
      if (activeKey === 'notifications') {
        await loadNotifications(notifPage);
      }
    };

    run();

    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeKey, token, userPage, vipPage, storyPage, storyListMode, reportPage, notifPage, notifType, notifReadFilter]);

  useEffect(() => {
    if (activeKey !== 'notifications') return;
    setNotifPage(0);
  }, [activeKey, notifType, notifReadFilter]);

  useEffect(() => {
    if (activeKey !== 'chapters') return;
    if (!selectedChapterStoryId) return;
    loadChaptersByStory(selectedChapterStoryId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeKey, selectedChapterStoryId, token]);

  useEffect(() => {
    setChapterPage(1);
  }, [chapterSearch, chapterFilter, selectedChapterStoryId]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    localStorage.removeItem('role');
    navigate('/home', { replace: true });
  };

  const openStoryDialog = (type, story) => {
    setStoryDialog({ open: true, type, story });
    setStoryDialogNote(story?.adminNotes || '');
  };

  const closeStoryDialog = () => {
    setStoryDialog({ open: false, type: null, story: null });
    setStoryDialogNote('');
    setStoryConfirm({ open: false });
    setReviewSubmitting(false);
  };

  const requestStoryReview = () => {
    if (!token) return;
    if (!storyDialog?.story?.id || !storyDialog?.type) return;

    setStoryConfirm({ open: true });
  };

  const closeStoryConfirm = () => {
    setStoryConfirm({ open: false });
  };

  const confirmStoryReview = async () => {
    if (!token) return;
    if (!storyDialog?.story?.id || !storyDialog?.type) return;

    const approvalStatus = storyDialog.type === 'approve' ? 'APPROVED' : 'REJECTED';

    setReviewSubmitting(true);
    try {
      await reviewAdminStory({
        token,
        storyId: storyDialog.story.id,
        approvalStatus,
        adminNotes: storyDialogNote
      });

      setPendingStories((prev) => prev.filter((s) => String(s.id) !== String(storyDialog.story.id)));
      setToast(`Đã ${approvalStatus === 'APPROVED' ? 'phê duyệt' : 'từ chối'} truyện: ${storyDialog.story.title || 'Không tên'}`);
      closeStoryConfirm();
      closeStoryDialog();
      if (storyListMode === 'pending') {
        loadPendingStories();
      } else {
        loadStories(storyPage);
      }
      setTimeout(() => setToast(''), 3000);
    } catch (err) {
      setToast(err?.response?.data?.message || 'Không thể duyệt truyện. Vui lòng thử lại.');
      setTimeout(() => setToast(''), 3000);
      setReviewSubmitting(false);
    }
  };

  const openReviewModal = (type, story) => {
    openStoryDialog(type, story);
  };

  const hideStoryInline = async (story) => {
    if (!token || !story?.id) return;
    if (hideSubmittingId) return;

    setHideSubmittingId(story.id);
    try {
      const updated = await adminHideStory({ token, storyId: story.id });
      if (updated) {
        setStoriesData((prev) => ({
          ...prev,
          content: (prev?.content || []).map((s) => (String(s.id) === String(updated.id) ? updated : s))
        }));
      }
      setToast(`Đã ẩn truyện: ${story.title || 'Không tên'}`);
      setTimeout(() => setToast(''), 3000);
    } catch (err) {
      setToast(err?.response?.data?.message || 'Không thể ẩn truyện. Vui lòng thử lại.');
      setTimeout(() => setToast(''), 3000);
    } finally {
      setHideSubmittingId(null);
    }
  };

  const unhideStoryInline = async (story) => {
    if (!token || !story?.id) return;
    if (unhideSubmittingId) return;

    setUnhideSubmittingId(story.id);
    try {
      const updated = await adminUnhideStory({ token, storyId: story.id });
      if (updated) {
        setStoriesData((prev) => ({
          ...prev,
          content: (prev?.content || []).map((s) => (String(s.id) === String(updated.id) ? updated : s))
        }));
      }
      setToast(`Đã hiện truyện: ${story.title || 'Không tên'}`);
      setTimeout(() => setToast(''), 3000);
    } catch (err) {
      setToast(err?.response?.data?.message || 'Không thể hiện truyện. Vui lòng thử lại.');
      setTimeout(() => setToast(''), 3000);
    } finally {
      setUnhideSubmittingId(null);
    }
  };

  const updateChapterStatus = async (chapter, status) => {
    if (!token || !chapter?.id) return;
    if (chapterSubmittingId) return;

    setChapterSubmittingId(chapter.id);
    try {
      const updated = await updateAdminChapterModeration({
        token,
        chapterId: chapter.id,
        status
      });
      setChaptersData((prev) =>
        (prev || []).map((c) => (String(c.id) === String(updated.id) ? updated : c))
      );
      setToast(`Đã cập nhật chương: ${chapter.title || `#${chapter.id}`}`);
      setTimeout(() => setToast(''), 3000);
    } catch (err) {
      setToast(err?.response?.data?.message || 'Không thể cập nhật trạng thái chương.');
      setTimeout(() => setToast(''), 3000);
    } finally {
      setChapterSubmittingId(null);
    }
  };

  const openUserDialog = (type, user, nextRole = '') => {
    setUserDialog({ open: true, type, user, nextRole: String(nextRole || '').toUpperCase().trim() });
    setUserDialogReason('');
  };

  const closeUserDialog = () => {
    setUserDialog({ open: false, type: null, user: null, nextRole: '' });
    setUserDialogReason('');
    setUserSubmitting(false);
  };

  const submitUserAction = async () => {
    if (!token || !userDialog?.user?.id || !userDialog?.type) return;
    setUserSubmitting(true);
    try {
      let updated;

      if (userDialog.type === 'lock') {
        const reason = String(userDialogReason || '').trim();
        if (!reason) {
          setUserSubmitting(false);
          setToast('Vui lòng nhập lý do khóa tài khoản.');
          setTimeout(() => setToast(''), 3000);
          return;
        }
        updated = await adminLockUser({ token, userId: userDialog.user.id, reason });
        setToast(`Đã khóa tài khoản: ${userDialog.user.username || userDialog.user.email || 'user'}`);
      }

      if (userDialog.type === 'unlock') {
        updated = await adminUnlockUser({ token, userId: userDialog.user.id });
        setToast(`Đã mở khóa: ${userDialog.user.username || userDialog.user.email || 'user'}`);
      }

      if (userDialog.type === 'role') {
        const nextRole = String(userDialog.nextRole || '').trim().toUpperCase();
        if (!nextRole) {
          setUserSubmitting(false);
          setToast('Vui lòng chọn role.');
          setTimeout(() => setToast(''), 3000);
          return;
        }
        updated = await adminSetUserRole({ token, userId: userDialog.user.id, role: nextRole });
        setToast(`Đã đổi role: ${userDialog.user.username || userDialog.user.email || 'user'} → ${nextRole}`);
      }

      if (updated) {
        setUserData((prev) => ({
          ...prev,
          content: (prev?.content || []).map((u) => (String(u.id) === String(updated.id) ? updated : u))
        }));
      }

      closeUserDialog();
      setTimeout(() => setToast(''), 3000);
    } catch (err) {
      setToast(err?.response?.data?.message || 'Thao tác thất bại.');
      setTimeout(() => setToast(''), 3000);
      setUserSubmitting(false);
    }
  };

  const openVipDialog = (type, user = null) => {
    setVipDialog({ open: true, type, user, days: 30 });
  };

  const closeVipDialog = () => {
    setVipDialog({ open: false, type: null, user: null, days: 30 });
    setVipSubmittingId(null);
  };

  const submitVipAction = async () => {
    if (!token || !vipDialog?.user?.id || !vipDialog?.type) return;
    const userId = vipDialog.user.id;
    setVipSubmittingId(userId);
    try {
      let updated;
      if (vipDialog.type === 'upgrade') {
        const days = Number(vipDialog.days || 0);
        if (!Number.isFinite(days) || days < 1) {
          setVipSubmittingId(null);
          setToast('Vui lòng nhập số ngày VIP hợp lệ.');
          setTimeout(() => setToast(''), 3000);
          return;
        }
        updated = await adminUpgradeVip({ token, userId, days });
        setToast(`Đã nâng cấp VIP: ${updated?.username || vipDialog.user.username || 'user'}`);
      }
      if (vipDialog.type === 'cancel') {
        updated = await adminCancelVip({ token, userId });
        setToast(`Đã hủy VIP: ${updated?.username || vipDialog.user.username || 'user'}`);
      }
      closeVipDialog();
      await loadVipUsers(vipDialog.type === 'cancel' ? 0 : vipPage);
      await loadSummary();
      setTimeout(() => setToast(''), 3000);
    } catch (err) {
      setToast(err?.response?.data?.message || 'Không thể cập nhật VIP.');
      setTimeout(() => setToast(''), 3000);
      setVipSubmittingId(null);
    }
  };

  const openHandleModal = (report) => {
    setHandleModal({ open: true, report, resolution: 'RESOLVED', note: '' });
  };

  const closeHandleModal = () => {
    setHandleModal({ open: false, report: null, resolution: 'RESOLVED', note: '' });
    setHandleSubmitting(false);
  };

  const submitHandleReport = async () => {
    if (!token || !handleModal?.report?.id || handleSubmitting) return;
    setHandleSubmitting(true);
    try {
      const updated = await adminHandleReport({
        token,
        reportId: handleModal.report.id,
        resolution: handleModal.resolution,
        handledNote: handleModal.note
      });
      setReportData((prev) => ({
        ...prev,
        content: (prev?.content || []).map((r) => (String(r.id) === String(updated.id) ? updated : r))
      }));
      if (reportDetailModal.open && String(reportDetailModal.report?.id) === String(updated.id)) {
        setReportDetailModal({ open: true, report: updated });
      }
      setToast(`Đã xử lý báo cáo #${handleModal.report.id}`);
      setTimeout(() => setToast(''), 3000);
      closeHandleModal();
    } catch (err) {
      setToast(err?.response?.data?.message || 'Không thể xử lý báo cáo.');
      setTimeout(() => setToast(''), 3000);
      setHandleSubmitting(false);
    }
  };

  const summaryEmpty = isAllZero(summary);
  const filteredChapters = useMemo(() => {
    const q = String(chapterSearch || '').toLowerCase().trim();
    return (chaptersData || [])
      .filter((c) => {
        if (chapterFilter === 'ALL') return true;
        return String(c?.moderationStatus || c?.status || '').toUpperCase() === chapterFilter;
      })
      .filter((c) => {
        if (!q) return true;
        return String(c?.title || '').toLowerCase().includes(q);
      })
      .sort((a, b) => Number(a?.chapterNumber || 0) - Number(b?.chapterNumber || 0));
  }, [chaptersData, chapterFilter, chapterSearch]);
  const chapterTotalPages = Math.max(1, Math.ceil(filteredChapters.length / chapterSize));
  const chapterPageSafe = Math.min(chapterPage, chapterTotalPages);
  const pagedChapters = useMemo(() => {
    const start = (chapterPageSafe - 1) * chapterSize;
    return filteredChapters.slice(start, start + chapterSize);
  }, [filteredChapters, chapterPageSafe, chapterSize]);

  return (
    <div className="min-h-screen overflow-x-hidden bg-slate-950 text-slate-100">
      <div className="mx-auto w-full max-w-screen-2xl px-4 py-6 md:px-6">
        <div className="grid gap-5 lg:grid-cols-[260px_1fr]">
          <aside className="rounded-xl border border-slate-800 bg-slate-900/40 p-3 shadow-soft backdrop-blur">
            <div className="px-3 pb-2 pt-3">
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-300">Dashboard quản trị</div>
              <div className="mt-1 text-sm text-slate-400">Xin chào, {username || 'Admin'}</div>
            </div>

            <nav className="mt-3 space-y-1">
              {SIDEBAR_ITEMS.map((item) => {
                const active = item.key === activeKey;
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => {
                      if (item.to) {
                        navigate(item.to);
                        return;
                      }
                      setActiveKey(item.key);
                    }}
                    className={
                      active
                        ? 'w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-left text-sm font-semibold text-white'
                        : 'w-full rounded-lg border border-transparent px-3 py-2 text-left text-sm font-medium text-slate-300 hover:border-slate-800 hover:bg-slate-900 hover:text-slate-100'
                    }
                  >
                    {item.label}
                  </button>
                );
              })}
            </nav>
          </aside>

          <section className="min-w-0 rounded-xl border border-slate-800 bg-slate-900/30 shadow-soft backdrop-blur">
            <div className="flex flex-col gap-3 border-b border-slate-800 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-xl font-bold text-white">{pageTitle}</h1>
                <p className="mt-1 text-sm text-slate-400">Dữ liệu lấy trực tiếp từ PostgreSQL (API nội bộ).</p>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                {activeKey === 'overview' ? (
                  <button
                    type="button"
                    onClick={loadSummary}
                    disabled={summaryLoading}
                    className={`h-10 px-4 ${UI.buttonSecondary}`}
                  >
                    {summaryLoading ? 'Đang tải...' : 'Tải lại'}
                  </button>
                ) : null}

                {activeKey === 'users' ? (
                  <button
                    type="button"
                    onClick={() => loadUsers(userPage)}
                    disabled={userLoading}
                    className={`h-10 px-4 ${UI.buttonSecondary}`}
                  >
                    {userLoading ? 'Đang tải...' : 'Tải lại'}
                  </button>
                ) : null}

                {activeKey === 'vip' ? (
                  <button
                    type="button"
                    onClick={() => loadVipUsers(vipPage)}
                    disabled={vipLoading}
                    className={`h-10 px-4 ${UI.buttonSecondary}`}
                  >
                    {vipLoading ? 'Đang tải...' : 'Tải lại'}
                  </button>
                ) : null}

                {activeKey === 'stories' ? (
                  <button
                    type="button"
                    onClick={() => {
                      if (storyListMode === 'pending') {
                        loadPendingStories();
                        return;
                      }
                      loadStories(storyPage);
                    }}
                    disabled={storyListMode === 'pending' ? pendingLoading : storiesLoading}
                    className={`h-10 px-4 ${UI.buttonSecondary}`}
                  >
                    {(storyListMode === 'pending' ? pendingLoading : storiesLoading) ? 'Đang tải...' : 'Tải lại'}
                  </button>
                ) : null}

                {activeKey === 'chapters' ? (
                  <button
                    type="button"
                    onClick={() => {
                      loadChapterStories();
                      if (selectedChapterStoryId) loadChaptersByStory(selectedChapterStoryId);
                    }}
                    disabled={chapterStoriesLoading || chaptersLoading}
                    className={`h-10 px-4 ${UI.buttonSecondary}`}
                  >
                    {chapterStoriesLoading || chaptersLoading ? 'Đang tải...' : 'Tải lại'}
                  </button>
                ) : null}

                {activeKey === 'reports' ? (
                  <button
                    type="button"
                    onClick={() => loadReports(reportPage)}
                    disabled={reportLoading}
                    className={`h-10 px-4 ${UI.buttonSecondary}`}
                  >
                    {reportLoading ? 'Đang tải...' : 'Tải lại'}
                  </button>
                ) : null}

                {activeKey === 'notifications' ? (
                  <button
                    type="button"
                    onClick={() => loadNotifications(notifPage)}
                    disabled={notifLoading}
                    className={`h-10 px-4 ${UI.buttonSecondary}`}
                  >
                    {notifLoading ? 'Đang tải...' : 'Tải lại'}
                  </button>
                ) : null}

                <button
                  type="button"
                  onClick={handleLogout}
                  className={`h-10 px-4 ${UI.buttonSecondary}`}
                >
                  Đăng xuất
                </button>
              </div>
            </div>

            {toast ? (
              <div className="mx-5 mt-4 rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm font-medium text-slate-200">
                {toast}
              </div>
            ) : null}

            {activeKey === 'overview' ? (
              <div className="p-5">
                {summaryLoading ? (
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {Array.from({ length: 5 }).map((_, idx) => (
                      <div
                        key={idx}
                        className="animate-pulse rounded-lg border border-slate-800 bg-slate-950/40 p-4"
                      >
                        <div className="h-3 w-28 rounded bg-slate-800" />
                        <div className="mt-3 h-8 w-24 rounded bg-slate-800" />
                        <div className="mt-3 h-3 w-40 rounded bg-slate-800" />
                      </div>
                    ))}
                  </div>
                ) : summaryError ? (
                  <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-6">
                    <div className="text-sm font-semibold text-white">Không thể tải thống kê</div>
                    <div className="mt-1 text-sm text-slate-400">{summaryError}</div>
                    <button
                      type="button"
                      onClick={loadSummary}
                      className="mt-4 h-10 rounded-lg border border-slate-700 bg-slate-950 px-4 text-sm font-semibold text-slate-200 hover:bg-slate-900"
                    >
                      Thử lại
                    </button>
                  </div>
                ) : !summary ? (
                  <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-6 text-sm text-slate-400">
                    Không có dữ liệu tổng quan.
                  </div>
                ) : summaryEmpty ? (
                  <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-6">
                    <div className="text-sm font-semibold text-white">Chưa có dữ liệu thống kê</div>
                    <div className="mt-1 text-sm text-slate-400">Hệ thống chưa ghi nhận người dùng / truyện / chương.</div>
                  </div>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {cards.map((c) => (
                      <StatCard key={c.key} label={c.label} value={c.value} hint="Cập nhật theo dữ liệu hiện tại" />
                    ))}
                  </div>
                )}
              </div>
            ) : activeKey === 'stories' ? (
              <div className="p-5">
                <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="text-sm font-semibold text-white">Danh sách truyện</div>
                      <div className="mt-1 text-xs text-slate-400">Bảng quản lý truyện (dữ liệu thật từ API admin).</div>
                    </div>
                    <div className="text-xs text-slate-400">
                      {storyListMode === 'pending'
                        ? pendingLoading
                          ? 'Đang tải...'
                          : `${pendingStories.length} truyện chờ duyệt`
                        : storiesLoading
                        ? 'Đang tải...'
                        : `Tổng: ${formatNumber(storiesData?.totalElements || 0)} • Trang ${Number(storiesData?.page || 0) + 1}/${storiesData?.totalPages || 0}`}
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {STORY_MANAGEMENT_TABS.map((tab) => (
                    <button
                      key={tab.key}
                      type="button"
                      onClick={() => {
                        setStoryListMode(tab.key);
                        if (tab.key === 'pending') {
                          loadPendingStories();
                        } else {
                          loadStories(storyPage);
                        }
                      }}
                      className={
                        storyListMode === tab.key
                          ? 'h-10 rounded-lg border border-slate-600 bg-slate-800 px-4 text-sm font-semibold text-white'
                          : 'h-10 rounded-lg border border-slate-700 bg-slate-950 px-4 text-sm font-semibold text-slate-300 hover:bg-slate-900'
                      }
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {storyListMode === 'pending' ? (
                  <div className="mt-4">
                    <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <div className="text-sm font-semibold text-white">Truyện chờ duyệt</div>
                          <div className="mt-1 text-xs text-slate-400">Phê duyệt / từ chối truyện do tác giả gửi lên.</div>
                        </div>
                        <div className="text-xs text-slate-400">{pendingLoading ? 'Đang tải...' : `${pendingStories.length} truyện`}</div>
                      </div>
                    </div>

                    {pendingError ? (
                      <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950/40 p-6">
                        <div className="text-sm font-semibold text-white">Không thể tải danh sách</div>
                        <div className="mt-1 text-sm text-slate-400">{pendingError}</div>
                        <button
                          type="button"
                          onClick={loadPendingStories}
                          className="mt-4 h-10 rounded-lg border border-slate-700 bg-slate-950 px-4 text-sm font-semibold text-slate-200 hover:bg-slate-900"
                        >
                          Thử lại
                        </button>
                      </div>
                    ) : (
                      <div className="mt-4 min-w-0 overflow-hidden rounded-xl border border-slate-800 bg-slate-950/40">
                        <div className="w-full overflow-x-auto">
                          <table className="min-w-[980px] w-full border-collapse">
                            <thead>
                              <tr className="bg-slate-900/60 text-left text-xs font-semibold uppercase tracking-wide text-slate-300">
                                <th className="px-4 py-3">Truyện</th>
                                <th className="px-4 py-3">Tác giả</th>
                                <th className="px-4 py-3">Ngày gửi</th>
                                <th className="px-4 py-3">Tóm tắt</th>
                                <th className="px-4 py-3">Thao tác</th>
                              </tr>
                            </thead>
                            <tbody>
                              {pendingLoading ? (
                                <tr>
                                  <td colSpan={5} className="px-4 py-10 text-center text-sm text-slate-400">
                                    Đang tải danh sách truyện...
                                  </td>
                                </tr>
                              ) : pendingStories.length === 0 ? (
                                <tr>
                                  <td colSpan={5} className="px-4 py-10 text-center text-sm text-slate-400">
                                    Không có truyện chờ duyệt.
                                  </td>
                                </tr>
                              ) : (
                                pendingStories.map((s) => (
                                  <tr key={s.id} className="border-t border-slate-800 text-sm hover:bg-slate-900/30">
                                    <td className="px-4 py-3">
                                      <div className="max-w-[360px] truncate font-semibold text-white">{s.title || 'Không tên'}</div>
                                      <div className="mt-1 max-w-[360px] truncate text-xs text-slate-400">
                                        {s.type ? `Loại: ${s.type}` : '—'}{s.genres ? ` • Thể loại: ${s.genres}` : ''}
                                      </div>
                                    </td>
                                    <td className="px-4 py-3 text-slate-200">{s.authorName || '—'}</td>
                                    <td className="px-4 py-3 text-slate-400">{formatDateTimeVi(s.createdAt)}</td>
                                    <td className="px-4 py-3">
                                      <div className="max-w-[320px] truncate text-xs text-slate-400">{s.description || '—'}</div>
                                    </td>
                                    <td className="px-4 py-3">
                                      <div className="flex flex-wrap gap-2">
                                        <button
                                          type="button"
                                          onClick={() => openStoryDialog('approve', s)}
                                          className="h-9 rounded-lg border border-slate-600 bg-slate-800 px-3 text-xs font-semibold text-white hover:bg-slate-700"
                                        >
                                          Duyệt
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => openStoryDialog('reject', s)}
                                          className="h-9 rounded-lg border border-slate-700 bg-slate-950 px-3 text-xs font-semibold text-white hover:bg-slate-900"
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
                    )}
                  </div>
                ) : (
                  <>
                <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950/40 p-4">
                  <form
                    className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between"
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (storyPage !== 0) {
                        setStoryPage(0);
                        return;
                      }
                      loadStories(0);
                    }}
                  >
                    <div className="grid w-full gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_220px]">
                      <div>
                        <label className="text-xs font-semibold text-slate-300">Tìm theo tiêu đề</label>
                        <input
                          value={storyTitleQ}
                          onChange={(e) => setStoryTitleQ(e.target.value)}
                          placeholder="Nhập tiêu đề truyện"
                          className="mt-1 h-11 w-full rounded-lg border border-slate-800 bg-slate-950 px-4 text-sm text-slate-100 outline-none transition focus:border-slate-600"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-slate-300">Tìm theo tác giả</label>
                        <input
                          value={storyAuthorQ}
                          onChange={(e) => setStoryAuthorQ(e.target.value)}
                          placeholder="Nhập tên tác giả"
                          className="mt-1 h-11 w-full rounded-lg border border-slate-800 bg-slate-950 px-4 text-sm text-slate-100 outline-none transition focus:border-slate-600"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-slate-300">Trạng thái</label>
                        <select
                          value={storyStatus}
                          onChange={(e) => setStoryStatus(e.target.value)}
                          className="mt-1 h-11 w-full rounded-lg border border-slate-800 bg-slate-950 px-3 text-sm text-slate-100 outline-none transition focus:border-slate-600"
                        >
                          <option value="">Tất cả</option>
                          <option value="DRAFT">DRAFT</option>
                          <option value="PENDING">PENDING</option>
                          <option value="APPROVED">APPROVED</option>
                          <option value="REJECTED">REJECTED</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        type="submit"
                        className="h-10 rounded-lg border border-slate-600 bg-slate-800 px-4 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-60"
                        disabled={storiesLoading}
                      >
                        Lọc
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setStoryTitleQ('');
                          setStoryAuthorQ('');
                          setStoryStatus('');
                          if (storyPage !== 0) {
                            setStoryPage(0);
                            return;
                          }
                          loadStories(0);
                        }}
                        className="h-10 rounded-lg border border-slate-700 bg-slate-950 px-4 text-sm font-semibold text-slate-200 hover:bg-slate-900 disabled:opacity-60"
                        disabled={storiesLoading}
                      >
                        Xóa lọc
                      </button>
                    </div>
                  </form>

                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
                    <div>
                      Tổng: <span className="font-semibold text-slate-200">{formatNumber(storiesData?.totalElements || 0)}</span>
                    </div>
                    <div>
                      Trang: <span className="font-semibold text-slate-200">{Number(storiesData?.page || 0) + 1}</span>/{storiesData?.totalPages || 0}
                    </div>
                  </div>
                </div>

                {storiesError ? (
                  <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950/40 p-6">
                    <div className="text-sm font-semibold text-white">Không thể tải danh sách</div>
                    <div className="mt-1 text-sm text-slate-400">{storiesError}</div>
                    <button
                      type="button"
                      onClick={() => loadStories(storyPage)}
                      className="mt-4 h-10 rounded-lg border border-slate-700 bg-slate-950 px-4 text-sm font-semibold text-slate-200 hover:bg-slate-900"
                    >
                      Thử lại
                    </button>
                  </div>
                ) : (
                  <div className="mt-4 min-w-0 overflow-hidden rounded-xl border border-slate-800 bg-slate-950/40">
                    <div className="w-full overflow-x-auto">
                      <table className="min-w-[980px] w-full border-collapse">
                        <thead>
                          <tr className="bg-slate-900/60 text-left text-xs font-semibold uppercase tracking-wide text-slate-300">
                            <th className="px-4 py-3">Tiêu đề</th>
                            <th className="px-4 py-3">Tác giả</th>
                            <th className="px-4 py-3">Trạng thái</th>
                            <th className="px-4 py-3">Danh mục</th>
                            <th className="px-4 py-3">Ngày tạo</th>
                            <th className="px-4 py-3">Thao tác</th>
                          </tr>
                        </thead>
                        <tbody>
                          {storiesLoading ? (
                            Array.from({ length: 8 }).map((_, idx) => (
                              <tr key={idx} className="border-t border-slate-800">
                                <td className="px-4 py-3" colSpan={6}>
                                  <div className="h-4 w-full animate-pulse rounded bg-slate-900" />
                                </td>
                              </tr>
                            ))
                          ) : (Array.isArray(storiesData?.content) ? storiesData.content : []).length === 0 ? (
                            <tr>
                              <td colSpan={6} className="px-4 py-12 text-center text-sm text-slate-400">
                                Không có truyện.
                              </td>
                            </tr>
                          ) : (
                            (storiesData.content || []).map((s) => (
                              <tr key={s.id} className="border-t border-slate-800 text-sm hover:bg-slate-900/30">
                                <td className="px-4 py-3">
                                  <div className="max-w-[360px] truncate font-semibold text-white">{s.title || 'Không tên'}</div>
                                </td>
                                <td className="px-4 py-3 text-slate-200">
                                  <div className="max-w-[200px] truncate">{s.authorName || '—'}</div>
                                </td>
                                <td className="px-4 py-3">
                                  <span className="rounded-full border border-slate-700 bg-slate-950 px-2.5 py-1 text-xs font-semibold text-slate-200">
                                    {storyStatusLabel(s)}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-slate-200">
                                  <div className="max-w-[180px] truncate">{s.category || '—'}</div>
                                </td>
                                <td className="px-4 py-3 text-slate-400">{formatDateTimeVi(s.createdAt)}</td>
                                <td className="px-4 py-3">
                                  {String(s?.submissionStatus || '').toUpperCase() === 'SUBMITTED' ||
                                  String(s?.status || '').toUpperCase() === 'PENDING' ? (
                                    <div className="flex flex-wrap gap-2">
                                      <button
                                        type="button"
                                        onClick={() => openReviewModal('approve', s)}
                                        className="h-9 rounded-lg border border-slate-600 bg-slate-800 px-3 text-xs font-semibold text-white hover:bg-slate-700 disabled:opacity-60"
                                      >
                                        Approve
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => openReviewModal('reject', s)}
                                          className="h-9 rounded-lg border border-slate-700 bg-slate-950 px-3 text-xs font-semibold text-white hover:bg-slate-900 disabled:opacity-60"
                                      >
                                        Reject
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => hideStoryInline(s)}
                                        disabled={Boolean(hideSubmittingId) && String(hideSubmittingId) === String(s.id)}
                                        className="h-9 rounded-lg border border-slate-700 bg-slate-950 px-3 text-xs font-semibold text-slate-200 hover:bg-slate-900 disabled:opacity-60"
                                      >
                                        {Boolean(hideSubmittingId) && String(hideSubmittingId) === String(s.id) ? 'Đang ẩn...' : 'Hide'}
                                      </button>
                                      {s?.isHidden ? (
                                        <button
                                          type="button"
                                          onClick={() => unhideStoryInline(s)}
                                          disabled={Boolean(unhideSubmittingId) && String(unhideSubmittingId) === String(s.id)}
                                          className="h-9 rounded-lg border border-slate-700 bg-slate-950 px-3 text-xs font-semibold text-slate-200 hover:bg-slate-900 disabled:opacity-60"
                                        >
                                          {Boolean(unhideSubmittingId) && String(unhideSubmittingId) === String(s.id) ? 'Đang hiện...' : 'Unhide'}
                                        </button>
                                      ) : null}
                                    </div>
                                  ) : (
                                    <span className="text-xs text-slate-400">—</span>
                                  )}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {!storiesError ? (
                  <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="text-xs text-slate-400">Hiển thị {storySize}/trang</div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setStoryPage((p) => Math.max(0, p - 1))}
                        disabled={storiesLoading || storyPage <= 0}
                        className="h-10 rounded-lg border border-slate-700 bg-slate-950 px-4 text-sm font-semibold text-slate-200 hover:bg-slate-900 disabled:opacity-50"
                      >
                        ← Trước
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const total = Number(storiesData?.totalPages || 0);
                          if (total <= 0) return;
                          setStoryPage((p) => Math.min(total - 1, p + 1));
                        }}
                        disabled={
                          storiesLoading ||
                          Number(storiesData?.totalPages || 0) <= 0 ||
                          storyPage >= Number(storiesData?.totalPages || 0) - 1
                        }
                        className="h-10 rounded-lg border border-slate-700 bg-slate-950 px-4 text-sm font-semibold text-slate-200 hover:bg-slate-900 disabled:opacity-50"
                      >
                        Sau →
                      </button>
                    </div>
                  </div>
                ) : null}
                  </>
                )}
              </div>
            ) : activeKey === 'chapters' ? (
              <div className="p-5">
                <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
                  <div className="grid gap-3 lg:grid-cols-[1fr_320px]">
                    <div>
                      <label className="text-xs font-semibold text-slate-300">Chọn truyện</label>
                      <select
                        value={selectedChapterStoryId}
                        onChange={(e) => setSelectedChapterStoryId(e.target.value)}
                        disabled={chapterStoriesLoading || chapterStories.length === 0}
                        className="mt-1 h-11 w-full rounded-lg border border-slate-800 bg-slate-950 px-3 text-sm text-slate-100 outline-none transition focus:border-slate-600 disabled:opacity-60"
                      >
                        {chapterStoriesLoading ? (
                          <option value="">Đang tải...</option>
                        ) : chapterStories.length === 0 ? (
                          <option value="">Không có truyện</option>
                        ) : (
                          chapterStories.map((s) => (
                            <option key={s.id} value={String(s.id)}>
                              {s.title || 'Không tên'}{s.authorName ? ` — ${s.authorName}` : ''}
                            </option>
                          ))
                        )}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-300">Tìm theo tên chương</label>
                      <input
                        value={chapterSearch}
                        onChange={(e) => setChapterSearch(e.target.value)}
                        placeholder="Nhập tên chương"
                        className="mt-1 h-11 w-full rounded-lg border border-slate-800 bg-slate-950 px-4 text-sm text-slate-100 outline-none transition focus:border-slate-600"
                      />
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    {CHAPTER_FILTERS.map((f) => (
                      <button
                        key={f.key}
                        type="button"
                        onClick={() => setChapterFilter(f.key)}
                        className={
                          chapterFilter === f.key
                            ? 'h-9 rounded-full border border-slate-600 bg-slate-800 px-4 text-xs font-semibold text-white'
                            : 'h-9 rounded-full border border-slate-700 bg-slate-950 px-4 text-xs font-semibold text-slate-200 hover:bg-slate-900'
                        }
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>

                {chaptersError ? (
                  <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950/40 p-6">
                    <div className="text-sm font-semibold text-white">Không thể tải danh sách chương</div>
                    <div className="mt-1 text-sm text-slate-400">{chaptersError}</div>
                  </div>
                ) : (
                  <div className="mt-4 min-w-0 overflow-hidden rounded-xl border border-slate-800 bg-slate-950/40">
                    <div className="w-full overflow-x-auto">
                      <table className="min-w-[1080px] w-full border-collapse">
                        <thead>
                          <tr className="bg-slate-900/60 text-left text-xs font-semibold uppercase tracking-wide text-slate-300">
                            <th className="px-4 py-3">Số</th>
                            <th className="px-4 py-3">Tên chương</th>
                            <th className="px-4 py-3">Trạng thái duyệt</th>
                            <th className="px-4 py-3">Ngày tạo</th>
                            <th className="px-4 py-3">Lượt xem</th>
                            <th className="px-4 py-3">Báo cáo</th>
                            <th className="px-4 py-3">Thao tác</th>
                          </tr>
                        </thead>
                        <tbody>
                          {chaptersLoading ? (
                            <tr>
                              <td colSpan={7} className="px-4 py-10 text-center text-sm text-slate-400">
                                Đang tải danh sách chương...
                              </td>
                            </tr>
                          ) : pagedChapters.length === 0 ? (
                            <tr>
                              <td colSpan={7} className="px-4 py-10 text-center text-sm text-slate-400">
                                Không có chương phù hợp.
                              </td>
                            </tr>
                          ) : (
                            pagedChapters.map((c) => {
                              const currentStatus = String(c?.moderationStatus || c?.status || 'PENDING').toUpperCase();
                              const pendingAction = chapterSubmittingId && String(chapterSubmittingId) === String(c.id);
                              return (
                                <tr key={c.id} className="border-t border-slate-800 text-sm hover:bg-slate-900/30">
                                  <td className="px-4 py-3 text-slate-200">{c.chapterNumber || '—'}</td>
                                  <td className="px-4 py-3">
                                    <div className="max-w-[320px] truncate font-semibold text-white">{c.title || `Chương ${c.chapterNumber || ''}`}</div>
                                  </td>
                                  <td className="px-4 py-3">
                                    <span className="rounded-full border border-slate-700 bg-slate-950 px-2.5 py-1 text-xs font-semibold text-slate-200">
                                      {chapterStatusLabel(currentStatus)}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3 text-slate-400">{formatDateTimeVi(c.createdAt)}</td>
                                  <td className="px-4 py-3 text-slate-400">{Number(c.views || 0).toLocaleString('vi-VN')}</td>
                                  <td className="px-4 py-3 text-slate-400">{Number(c.reportCount || 0)}</td>
                                  <td className="px-4 py-3">
                                    <div className="flex flex-wrap gap-2">
                                      <button
                                        type="button"
                                        onClick={() => updateChapterStatus(c, 'APPROVED')}
                                        disabled={pendingAction}
                                        className="h-9 rounded-lg border border-slate-600 bg-slate-800 px-3 text-xs font-semibold text-white hover:bg-slate-700 disabled:opacity-60"
                                      >
                                        Approve
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => updateChapterStatus(c, 'REJECTED')}
                                        disabled={pendingAction}
                                        className="h-9 rounded-lg border border-slate-700 bg-slate-950 px-3 text-xs font-semibold text-white hover:bg-slate-900 disabled:opacity-60"
                                      >
                                        Reject
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => updateChapterStatus(c, 'HIDDEN')}
                                        disabled={pendingAction}
                                        className="h-9 rounded-lg border border-slate-700 bg-slate-950 px-3 text-xs font-semibold text-slate-200 hover:bg-slate-900 disabled:opacity-60"
                                      >
                                        Hide
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => updateChapterStatus(c, 'APPROVED')}
                                        disabled={pendingAction || currentStatus !== 'HIDDEN'}
                                        className="h-9 rounded-lg border border-slate-700 bg-slate-950 px-3 text-xs font-semibold text-slate-200 hover:bg-slate-900 disabled:opacity-60"
                                      >
                                        Unhide
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
                )}

                {!chaptersError ? (
                  <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="text-xs text-slate-400">Hiển thị {chapterSize}/trang</div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setChapterPage((p) => Math.max(1, p - 1))}
                        disabled={chaptersLoading || chapterPageSafe <= 1}
                        className="h-10 rounded-lg border border-slate-700 bg-slate-950 px-4 text-sm font-semibold text-slate-200 hover:bg-slate-900 disabled:opacity-50"
                      >
                        ← Trước
                      </button>
                      <button
                        type="button"
                        onClick={() => setChapterPage((p) => Math.min(chapterTotalPages, p + 1))}
                        disabled={chaptersLoading || chapterPageSafe >= chapterTotalPages}
                        className="h-10 rounded-lg border border-slate-700 bg-slate-950 px-4 text-sm font-semibold text-slate-200 hover:bg-slate-900 disabled:opacity-50"
                      >
                        Sau →
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            ) : activeKey === 'users' ? (
              <div className="p-5">
                <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
                  <form
                    className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between"
                    onSubmit={(e) => {
                      e.preventDefault();
                      setUserPage(0);
                      loadUsers(0);
                    }}
                  >
                    <div className="grid w-full gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_220px]">
                      <div>
                        <label className="text-xs font-semibold text-slate-300">Tìm kiếm</label>
                        <input
                          value={userQ}
                          onChange={(e) => setUserQ(e.target.value)}
                          placeholder="username hoặc email"
                          className="mt-1 h-11 w-full rounded-lg border border-slate-800 bg-slate-950 px-4 text-sm text-slate-100 outline-none transition focus:border-slate-600"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-slate-300">Role</label>
                        <select
                          value={userRole}
                          onChange={(e) => setUserRole(e.target.value)}
                          className="mt-1 h-11 w-full rounded-lg border border-slate-800 bg-slate-950 px-3 text-sm text-slate-100 outline-none transition focus:border-slate-600"
                        >
                          <option value="">Tất cả</option>
                          {ROLE_OPTIONS.map((r) => (
                            <option key={r} value={r}>
                              {r}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        type="submit"
                        className="h-10 rounded-lg border border-slate-600 bg-slate-800 px-4 text-sm font-semibold text-white hover:bg-slate-700"
                        disabled={userLoading}
                      >
                        Lọc
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setUserQ('');
                          setUserRole('');
                          setUserPage(0);
                          loadUsers(0);
                        }}
                        className="h-10 rounded-lg border border-slate-700 bg-slate-950 px-4 text-sm font-semibold text-slate-200 hover:bg-slate-900"
                        disabled={userLoading}
                      >
                        Xóa lọc
                      </button>
                    </div>
                  </form>

                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
                    <div>
                      Tổng: <span className="font-semibold text-slate-200">{formatNumber(userData?.totalElements || 0)}</span>
                    </div>
                    <div>
                      Trang: <span className="font-semibold text-slate-200">{Number(userData?.page || 0) + 1}</span>/{userData?.totalPages || 0}
                    </div>
                  </div>
                </div>

                {userError ? (
                  <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950/40 p-6">
                    <div className="text-sm font-semibold text-white">Không thể tải danh sách</div>
                    <div className="mt-1 text-sm text-slate-400">{userError}</div>
                    <button
                      type="button"
                      onClick={() => loadUsers(userPage)}
                      className="mt-4 h-10 rounded-lg border border-slate-700 bg-slate-950 px-4 text-sm font-semibold text-slate-200 hover:bg-slate-900"
                    >
                      Thử lại
                    </button>
                  </div>
                ) : (
                  <div className="mt-4 min-w-0 overflow-hidden rounded-xl border border-slate-800 bg-slate-950/40">
                    <div className="w-full overflow-x-auto">
                      <table className="min-w-[1120px] w-full border-collapse">
                        <thead>
                          <tr className="bg-slate-900/60 text-left text-xs font-semibold uppercase tracking-wide text-slate-300">
                            <th className="px-4 py-3">Username</th>
                            <th className="px-4 py-3">Email</th>
                            <th className="px-4 py-3">Role</th>
                            <th className="px-4 py-3">VIP</th>
                            <th className="px-4 py-3">Trạng thái</th>
                            <th className="px-4 py-3">Ngày tạo</th>
                            <th className="px-4 py-3">Thao tác</th>
                          </tr>
                        </thead>
                        <tbody>
                          {userLoading ? (
                            Array.from({ length: 8 }).map((_, idx) => (
                              <tr key={idx} className="border-t border-slate-800">
                                <td className="px-4 py-3" colSpan={7}>
                                  <div className="h-4 w-full animate-pulse rounded bg-slate-900" />
                                </td>
                              </tr>
                            ))
                          ) : (Array.isArray(userData?.content) ? userData.content : []).length === 0 ? (
                            <tr>
                              <td colSpan={7} className="px-4 py-12 text-center text-sm text-slate-400">
                                Không có người dùng phù hợp.
                              </td>
                            </tr>
                          ) : (
                            (userData.content || []).map((u) => {
                              const locked = Boolean(u?.isLocked);
                              const active = u?.isActive !== false;
                              const vipActive = isVipActive(u?.vipExpiryDate);
                              const statusLabel = locked ? 'Bị khóa' : active ? 'Hoạt động' : 'Không hoạt động';
                              const statusCls = locked
                                ? 'border-slate-600 bg-slate-950 text-white'
                                : active
                                  ? 'border-slate-700 bg-slate-800 text-slate-100'
                                  : 'border-slate-700/40 bg-slate-900/40 text-slate-200';

                              return (
                                <tr key={u.id} className="border-t border-slate-800 text-sm hover:bg-slate-900/30">
                                  <td className="px-4 py-3">
                                    <div className="max-w-[200px] truncate font-semibold text-white">{u.username || '—'}</div>
                                  </td>
                                  <td className="px-4 py-3 text-slate-200">
                                    <div className="max-w-[280px] truncate">{u.email || '—'}</div>
                                  </td>
                                  <td className="px-4 py-3">
                                    <span className="rounded-full border border-slate-700 bg-slate-950 px-2.5 py-1 text-xs font-semibold text-slate-200">
                                      {String(u.role || '—')}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3">
                                    {vipActive ? (
                                      <span className="rounded-full border border-slate-700 bg-slate-800 px-2.5 py-1 text-xs font-semibold text-slate-100">
                                        VIP đến {formatDateTimeVi(u.vipExpiryDate)}
                                      </span>
                                    ) : (
                                      <span className="text-xs text-slate-400">—</span>
                                    )}
                                  </td>
                                  <td className="px-4 py-3">
                                    <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${statusCls}`}>{statusLabel}</span>
                                  </td>
                                  <td className="px-4 py-3 text-slate-400">{formatDateTimeVi(u.createdAt)}</td>
                                  <td className="px-4 py-3">
                                    <div className="flex flex-wrap gap-2">
                                      <button
                                        type="button"
                                        onClick={() => openUserDialog('role', u, String(u.role || ''))}
                                        className="h-9 rounded-lg border border-slate-700 bg-slate-950 px-3 text-xs font-semibold text-slate-200 hover:bg-slate-900"
                                      >
                                        Đổi role
                                      </button>

                                      {locked ? (
                                        <button
                                          type="button"
                                          onClick={() => openUserDialog('unlock', u)}
                                          className="h-9 rounded-lg border border-slate-600 bg-slate-800 px-3 text-xs font-semibold text-white hover:bg-slate-700"
                                        >
                                          Mở khóa
                                        </button>
                                      ) : (
                                        <button
                                          type="button"
                                          onClick={() => openUserDialog('lock', u)}
                                          className="h-9 rounded-lg border border-slate-700 bg-slate-950 px-3 text-xs font-semibold text-white hover:bg-slate-900"
                                        >
                                          Khóa
                                        </button>
                                      )}
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
                )}

                {!userError ? (
                  <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="text-xs text-slate-400">Hiển thị {userSize}/trang</div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setUserPage((p) => Math.max(0, p - 1))}
                        disabled={userLoading || userPage <= 0}
                        className="h-10 rounded-lg border border-slate-700 bg-slate-950 px-4 text-sm font-semibold text-slate-200 hover:bg-slate-900 disabled:opacity-50"
                      >
                        ← Trước
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const total = Number(userData?.totalPages || 0);
                          if (total <= 0) return;
                          setUserPage((p) => Math.min(total - 1, p + 1));
                        }}
                        disabled={
                          userLoading ||
                          Number(userData?.totalPages || 0) <= 0 ||
                          userPage >= Number(userData?.totalPages || 0) - 1
                        }
                        className="h-10 rounded-lg border border-slate-700 bg-slate-950 px-4 text-sm font-semibold text-slate-200 hover:bg-slate-900 disabled:opacity-50"
                      >
                        Sau →
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            ) : activeKey === 'vip' ? (
              <div className="p-5">
                <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
                  <form
                    className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between"
                    onSubmit={(e) => {
                      e.preventDefault();
                      setVipPage(0);
                      loadVipUsers(0);
                    }}
                  >
                    <div className="grid w-full gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_220px]">
                      <div>
                        <label className="text-xs font-semibold text-slate-300">Tìm kiếm VIP</label>
                        <input
                          value={vipQ}
                          onChange={(e) => setVipQ(e.target.value)}
                          placeholder="username hoặc email"
                          className="mt-1 h-11 w-full rounded-lg border border-slate-800 bg-slate-950 px-4 text-sm text-slate-100 outline-none transition focus:border-slate-600"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-slate-300">Trạng thái VIP</label>
                        <select
                          value={vipStatusFilter}
                          onChange={(e) => setVipStatusFilter(e.target.value)}
                          className="mt-1 h-11 w-full rounded-lg border border-slate-800 bg-slate-950 px-3 text-sm text-slate-100 outline-none transition focus:border-slate-600"
                        >
                          <option value="ACTIVE">Đang VIP</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        type="submit"
                        className="h-10 rounded-lg border border-slate-600 bg-slate-800 px-4 text-sm font-semibold text-white hover:bg-slate-700"
                        disabled={vipLoading}
                      >
                        Lọc
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setVipQ('');
                          setVipStatusFilter('ACTIVE');
                          setVipPage(0);
                          loadVipUsers(0, '');
                        }}
                        className="h-10 rounded-lg border border-slate-700 bg-slate-950 px-4 text-sm font-semibold text-slate-200 hover:bg-slate-900"
                        disabled={vipLoading}
                      >
                        Xóa lọc
                      </button>
                    </div>
                  </form>

                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
                    <div>
                      Tổng VIP: <span className="font-semibold text-slate-200">{formatNumber(vipData?.totalElements || 0)}</span>
                    </div>
                    <div>
                      Trang: <span className="font-semibold text-slate-200">{Number(vipData?.page || 0) + 1}</span>/{Math.max(1, Number(vipData?.totalPages || 1))}
                    </div>
                  </div>
                </div>

                {vipError ? (
                  <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950/40 p-6">
                    <div className="text-sm font-semibold text-white">Không thể tải danh sách VIP</div>
                    <div className="mt-1 text-sm text-slate-400">{vipError}</div>
                    <button
                      type="button"
                      onClick={() => loadVipUsers(vipPage)}
                      className="mt-4 h-10 rounded-lg border border-slate-700 bg-slate-950 px-4 text-sm font-semibold text-slate-200 hover:bg-slate-900"
                    >
                      Thử lại
                    </button>
                  </div>
                ) : (
                  <div className="mt-4 min-w-0 overflow-hidden rounded-xl border border-slate-800 bg-slate-950/40">
                    <div className="w-full overflow-x-auto">
                      <table className="min-w-[980px] w-full border-collapse">
                        <thead>
                          <tr className="bg-slate-900/60 text-left text-xs font-semibold uppercase tracking-wide text-slate-300">
                            <th className="px-4 py-3">Username</th>
                            <th className="px-4 py-3">Email</th>
                            <th className="px-4 py-3">Role</th>
                            <th className="px-4 py-3">VIP status</th>
                            <th className="px-4 py-3">Hết hạn</th>
                            <th className="px-4 py-3">Thao tác</th>
                          </tr>
                        </thead>
                        <tbody>
                          {vipLoading ? (
                            Array.from({ length: 8 }).map((_, idx) => (
                              <tr key={idx} className="border-t border-slate-800">
                                <td className="px-4 py-3" colSpan={6}>
                                  <div className="h-4 w-full animate-pulse rounded bg-slate-900" />
                                </td>
                              </tr>
                            ))
                          ) : (Array.isArray(vipData?.content) ? vipData.content : []).length === 0 ? (
                            <tr>
                              <td colSpan={6} className="px-4 py-12 text-center text-sm text-slate-400">
                                Không có người dùng VIP phù hợp.
                              </td>
                            </tr>
                          ) : (
                            (vipData.content || []).map((u) => {
                              const activeVip = isVipActive(u.vipExpiryDate);
                              const busy = String(vipSubmittingId || '') === String(u.id);
                              return (
                                <tr key={u.id} className="border-t border-slate-800 text-sm hover:bg-slate-900/30">
                                  <td className="px-4 py-3">
                                    <div className="max-w-[220px] truncate font-semibold text-white">{u.username || '—'}</div>
                                  </td>
                                  <td className="px-4 py-3 text-slate-200">
                                    <div className="max-w-[300px] truncate">{u.email || '—'}</div>
                                  </td>
                                  <td className="px-4 py-3">
                                    <span className="rounded-full border border-slate-700 bg-slate-950 px-2.5 py-1 text-xs font-semibold text-slate-200">
                                      {u.role || '—'}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3">
                                    <span
                                      className={
                                        activeVip
                                          ? 'rounded-full border border-slate-600 bg-slate-800 px-2.5 py-1 text-xs font-semibold text-white'
                                          : 'rounded-full border border-slate-700 bg-slate-950 px-2.5 py-1 text-xs font-semibold text-slate-300'
                                      }
                                    >
                                      {activeVip ? 'Đang VIP' : 'Không hoạt động'}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3 text-slate-400">{formatDateTimeVi(u.vipExpiryDate)}</td>
                                  <td className="px-4 py-3">
                                    <div className="flex flex-wrap gap-2">
                                      <button
                                        type="button"
                                        onClick={() => openVipDialog('upgrade', u)}
                                        disabled={busy}
                                        className="h-9 rounded-lg border border-slate-600 bg-slate-800 px-3 text-xs font-semibold text-white hover:bg-slate-700 disabled:opacity-60"
                                      >
                                        Gia hạn VIP
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => openVipDialog('cancel', u)}
                                        disabled={busy}
                                        className="h-9 rounded-lg border border-slate-700 bg-slate-950 px-3 text-xs font-semibold text-slate-200 hover:bg-slate-900 disabled:opacity-60"
                                      >
                                        Hủy VIP
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
                )}

                {!vipError ? (
                  <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="text-xs text-slate-400">Hiển thị {vipSize}/trang</div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setVipPage((p) => Math.max(0, p - 1))}
                        disabled={vipLoading || vipPage <= 0}
                        className="h-10 rounded-lg border border-slate-700 bg-slate-950 px-4 text-sm font-semibold text-slate-200 hover:bg-slate-900 disabled:opacity-50"
                      >
                        ← Trước
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const total = Number(vipData?.totalPages || 0);
                          if (total <= 0) return;
                          setVipPage((p) => Math.min(total - 1, p + 1));
                        }}
                        disabled={
                          vipLoading ||
                          Number(vipData?.totalPages || 0) <= 0 ||
                          vipPage >= Number(vipData?.totalPages || 0) - 1
                        }
                        className="h-10 rounded-lg border border-slate-700 bg-slate-950 px-4 text-sm font-semibold text-slate-200 hover:bg-slate-900 disabled:opacity-50"
                      >
                        Sau →
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            ) : activeKey === 'notifications' ? (
              <div className="p-5">
                <div className="space-y-4">
                  <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                      <div>
                        <div className="text-sm font-semibold text-white">Danh sách thông báo</div>
                        <div className="mt-1 text-xs text-slate-400">
                          Chưa đọc: {formatNumber(notifUnreadCount)} • Đọc từ bảng notifications (PostgreSQL)
                        </div>
                      </div>

                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                        <select
                          value={notifType}
                          onChange={(e) => setNotifType(e.target.value)}
                          className="h-10 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 text-sm text-slate-100 outline-none focus:border-slate-500 sm:w-[220px]"
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
                          className="h-10 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 text-sm text-slate-100 outline-none focus:border-slate-500 sm:w-[220px]"
                        >
                          {NOTIFICATION_READ_OPTIONS.map((o) => (
                            <option key={o.value} value={o.value}>
                              {o.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <div className="text-sm font-semibold text-white">Gửi thông báo hệ thống</div>
                        <div className="mt-1 text-xs text-slate-400">Ghi thông báo thật vào bảng notifications cho người dùng đang active.</div>
                      </div>
                    </div>

                    <div className="mt-4 grid gap-3">
                      <div className="grid gap-3 lg:grid-cols-[220px_1fr]">
                        <div>
                          <label className="mb-1 block text-xs font-semibold text-slate-300">Loại</label>
                          <select
                            value={notifSendForm.type}
                            onChange={(e) => setNotifSendForm((prev) => ({ ...prev, type: e.target.value }))}
                            className="h-10 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 text-sm text-slate-100 outline-none focus:border-slate-500"
                          >
                            {NOTIFICATION_TYPE_OPTIONS.filter((o) => o.value).map((o) => (
                              <option key={o.value} value={o.value}>
                                {o.label}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="mb-1 block text-xs font-semibold text-slate-300">Tiêu đề</label>
                          <input
                            value={notifSendForm.title}
                            onChange={(e) => setNotifSendForm((prev) => ({ ...prev, title: e.target.value }))}
                            placeholder="Nhập tiêu đề thông báo"
                            className="h-10 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 text-sm text-slate-100 outline-none focus:border-slate-500"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="mb-1 block text-xs font-semibold text-slate-300">Nội dung</label>
                        <textarea
                          value={notifSendForm.message}
                          onChange={(e) => setNotifSendForm((prev) => ({ ...prev, message: e.target.value }))}
                          rows={4}
                          placeholder="Nhập nội dung thông báo"
                          className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-slate-500"
                        />
                      </div>

                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={submitSystemNotification}
                          disabled={notifSending}
                          className="h-10 rounded-lg border border-slate-600 bg-slate-800 px-4 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-60"
                        >
                          {notifSending ? 'Đang gửi...' : 'Gửi thông báo'}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="mb-3 flex items-center justify-between">
                    <div className="text-xs text-slate-400">
                      {notifLoading ? 'Đang tải...' : `${formatNumber(notifData?.totalElements || 0)} thông báo`}
                    </div>
                    <div className="text-xs text-slate-500">
                      Trang {Number(notifData?.page || 0) + 1}/{Math.max(1, Number(notifData?.totalPages || 1))}
                    </div>
                  </div>

                  {notifError ? (
                    <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-6">
                      <div className="text-sm font-semibold text-white">Không thể tải thông báo</div>
                      <div className="mt-1 text-sm text-slate-400">{notifError}</div>
                      <button
                        type="button"
                        onClick={() => loadNotifications(notifPage)}
                        className="mt-4 h-10 rounded-lg border border-slate-700 bg-slate-950 px-4 text-sm font-semibold text-slate-200 hover:bg-slate-900"
                      >
                        Thử lại
                      </button>
                    </div>
                  ) : notifLoading ? (
                    <div className="space-y-2">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="animate-pulse rounded-lg border border-slate-800 bg-slate-950/40 p-4">
                          <div className="h-3 w-24 rounded bg-slate-800" />
                          <div className="mt-3 h-4 w-2/3 rounded bg-slate-800" />
                          <div className="mt-2 h-3 w-1/2 rounded bg-slate-800" />
                        </div>
                      ))}
                    </div>
                  ) : (notifData?.content || []).length === 0 ? (
                    <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-8 text-center text-sm text-slate-400">
                      Không có thông báo phù hợp.
                    </div>
                  ) : (
                    <div className="overflow-x-auto rounded-xl border border-slate-800">
                      <table className="w-full min-w-[900px] text-sm">
                        <thead>
                          <tr className="border-b border-slate-800 bg-slate-900/60">
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">ID</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">Loại</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">Nội dung</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">Trạng thái</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">Ngày tạo</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">Thao tác</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(notifData?.content || []).map((n) => {
                            const badge = notificationTypeBadge(n.type);
                            const read = Boolean(n.isRead);
                            return (
                              <tr key={n.id} className="border-b border-slate-800 transition hover:bg-slate-900/30">
                                <td className="px-4 py-3 font-mono text-xs text-slate-300">#{n.id}</td>
                                <td className="px-4 py-3">
                                  <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold ${badge.cls}`}>
                                    {badge.label}
                                  </span>
                                </td>
                                <td className="px-4 py-3">
                                  <div className={read ? 'max-w-[420px] truncate text-slate-200' : 'max-w-[420px] truncate font-semibold text-white'}>
                                    {n.title || '—'}
                                  </div>
                                  {n.message ? <div className="mt-1 max-w-[520px] truncate text-xs text-slate-400">{n.message}</div> : null}
                                  <div className="mt-1 text-[11px] text-slate-500">User ID: {n.userId ?? '—'}</div>
                                </td>
                                <td className="px-4 py-3">
                                  <span
                                    className={
                                      read
                                        ? 'inline-flex rounded-full border border-slate-700 bg-slate-800 px-2 py-0.5 text-xs font-semibold text-slate-300'
                                        : 'inline-flex rounded-full border border-slate-600 bg-slate-950 px-2 py-0.5 text-xs font-semibold text-white'
                                    }
                                  >
                                    {read ? 'Đã đọc' : 'Chưa đọc'}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-xs text-slate-400">{formatDateTimeVi(n.createdAt)}</td>
                                <td className="px-4 py-3">
                                  <div className="flex flex-wrap gap-2">
                                    <button
                                      type="button"
                                      onClick={() => openNotificationDetail(n)}
                                      className="h-8 rounded-lg border border-slate-700 bg-slate-950 px-3 text-xs font-semibold text-slate-200 hover:bg-slate-900"
                                    >
                                      Chi tiết
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => markNotificationRead(n)}
                                      disabled={read || String(notifMarkingId) === String(n.id)}
                                      className="h-8 rounded-lg border border-slate-600 bg-slate-800 px-3 text-xs font-semibold text-white hover:bg-slate-700 disabled:opacity-50"
                                    >
                                      {String(notifMarkingId) === String(n.id) ? 'Đang lưu...' : 'Đánh dấu đã đọc'}
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {!notifError ? (
                    <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div className="text-xs text-slate-400">Hiển thị {notifSize}/trang</div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setNotifPage((p) => Math.max(0, p - 1))}
                          disabled={notifLoading || notifPage <= 0}
                          className="h-10 rounded-lg border border-slate-700 bg-slate-950 px-4 text-sm font-semibold text-slate-200 hover:bg-slate-900 disabled:opacity-50"
                        >
                          ← Trước
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const total = Number(notifData?.totalPages || 0);
                            if (total <= 0) return;
                            setNotifPage((p) => Math.min(total - 1, p + 1));
                          }}
                          disabled={
                            notifLoading ||
                            Number(notifData?.totalPages || 0) <= 0 ||
                            notifPage >= Number(notifData?.totalPages || 0) - 1
                          }
                          className="h-10 rounded-lg border border-slate-700 bg-slate-950 px-4 text-sm font-semibold text-slate-200 hover:bg-slate-900 disabled:opacity-50"
                        >
                          Sau →
                        </button>
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            ) : activeKey === 'logs' ? (
              <div className="p-5">
                <ModerationLogsPanel token={token} />
              </div>
            ) : activeKey === 'reports' ? (
              <div className="p-5">
                {/* Filter bar */}
                <div className="mb-4 flex flex-wrap gap-3">
                  <input
                    type="text"
                    value={reportQ}
                    onChange={(e) => setReportQ(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { setReportPage(0); loadReports(0); } }}
                    placeholder="Tìm lý do..."
                    className="h-10 flex-1 min-w-[160px] rounded-xl border border-slate-700 bg-slate-950 px-3 text-sm text-slate-100 outline-none focus:border-slate-500"
                  />
                  <select
                    value={reportStatus}
                    onChange={(e) => { setReportStatus(e.target.value); setReportPage(0); }}
                    className="h-10 rounded-lg border border-slate-700 bg-slate-950 px-3 text-sm text-slate-100 outline-none focus:border-slate-500"
                  >
                    {REPORT_STATUS_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                  <select
                    value={reportTargetType}
                    onChange={(e) => { setReportTargetType(e.target.value); setReportPage(0); }}
                    className="h-10 rounded-lg border border-slate-700 bg-slate-950 px-3 text-sm text-slate-100 outline-none focus:border-slate-500"
                  >
                    {REPORT_TARGET_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => { setReportPage(0); loadReports(0); }}
                    disabled={reportLoading}
                    className="h-10 rounded-lg border border-slate-600 bg-slate-800 px-4 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-60"
                  >
                    Tìm kiếm
                  </button>
                </div>

                {/* Info row */}
                <div className="mb-3 flex items-center justify-between">
                  <div className="text-xs text-slate-400">
                    {reportLoading ? 'Đang tải...' : `${Number(reportData?.totalElements || 0)} báo cáo`}
                  </div>
                  <div className="text-xs text-slate-500">
                    Trang {Number(reportData?.page || 0) + 1}/{Math.max(1, Number(reportData?.totalPages || 1))}
                  </div>
                </div>

                {reportError ? (
                  <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-6">
                    <div className="text-sm font-semibold text-white">Không thể tải báo cáo</div>
                    <div className="mt-1 text-sm text-slate-400">{reportError}</div>
                    <button
                      type="button"
                      onClick={() => loadReports(reportPage)}
                      className="mt-4 h-10 rounded-lg border border-slate-700 bg-slate-950 px-4 text-sm font-semibold text-slate-200 hover:bg-slate-900"
                    >
                      Thử lại
                    </button>
                  </div>
                ) : reportLoading ? (
                  <div className="space-y-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="animate-pulse rounded-lg border border-slate-800 bg-slate-950/40 p-4 h-14" />
                    ))}
                  </div>
                ) : (reportData?.content || []).length === 0 ? (
                  <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-8 text-center text-sm text-slate-400">
                    Không có báo cáo nào.
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-slate-800">
                    <table className="w-full min-w-[640px] text-sm">
                      <thead>
                        <tr className="border-b border-slate-800 bg-slate-900/60">
                          <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">ID</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">Người báo</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">Loại</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">Mục tiêu ID</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">Lý do</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">Trạng thái</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">Ngày tạo</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">Thao tác</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(reportData?.content || []).map((r) => {
                          const badge = reportStatusBadge(r.status);
                          return (
                            <tr key={r.id} className="border-b border-slate-800 transition hover:bg-slate-900/30">
                              <td className="px-4 py-3 text-slate-300 font-mono text-xs">#{r.id}</td>
                              <td className="px-4 py-3 text-slate-200">{r.reporterUsername || '—'}</td>
                              <td className="px-4 py-3 text-slate-300">{targetTypeLabel(r.targetType)}</td>
                              <td className="px-4 py-3 text-slate-300 font-mono text-xs">{r.targetId ?? '—'}</td>
                              <td className="px-4 py-3 text-slate-300 max-w-[200px] truncate" title={r.reason}>{r.reason || '—'}</td>
                              <td className="px-4 py-3">
                                <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold ${badge.cls}`}>
                                  {badge.label}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-xs text-slate-400">{formatDateTimeVi(r.createdAt)}</td>
                              <td className="px-4 py-3">
                                <div className="flex gap-2">
                                  <button
                                    type="button"
                                    onClick={() => setReportDetailModal({ open: true, report: r })}
                                    className="h-8 rounded-lg border border-slate-700 bg-slate-950 px-3 text-xs font-semibold text-slate-200 hover:bg-slate-900"
                                  >
                                    Chi tiết
                                  </button>
                                  {r.status === 'PENDING' ? (
                                    <button
                                      type="button"
                                      onClick={() => openHandleModal(r)}
                                      className="h-8 rounded-lg border border-slate-600 bg-slate-800 px-3 text-xs font-semibold text-white hover:bg-slate-700"
                                    >
                                      Xử lý
                                    </button>
                                  ) : null}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Pagination */}
                {!reportError ? (
                  <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="text-xs text-slate-400">{reportSize} báo cáo/trang</div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setReportPage((p) => Math.max(0, p - 1))}
                        disabled={reportLoading || reportPage <= 0}
                        className="h-10 rounded-lg border border-slate-700 bg-slate-950 px-4 text-sm font-semibold text-slate-200 hover:bg-slate-900 disabled:opacity-50"
                      >
                        ← Trước
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const total = Number(reportData?.totalPages || 0);
                          if (total <= 0) return;
                          setReportPage((p) => Math.min(total - 1, p + 1));
                        }}
                        disabled={
                          reportLoading ||
                          Number(reportData?.totalPages || 0) <= 0 ||
                          reportPage >= Number(reportData?.totalPages || 0) - 1
                        }
                        className="h-10 rounded-lg border border-slate-700 bg-slate-950 px-4 text-sm font-semibold text-slate-200 hover:bg-slate-900 disabled:opacity-50"
                      >
                        Sau →
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}
          </section>
        </div>
      </div>

      <Dialog
        open={notifDetail.open}
        title={notifDetail.data?.title || 'Chi tiết thông báo'}
        primaryLabel={
          notifDetail.loading || !notifDetail.data
            ? 'Đóng'
            : Boolean(notifDetail.data.isRead)
              ? 'Đã đọc'
              : String(notifMarkingId) === String(notifDetail.data.id)
                ? 'Đang lưu...'
                : 'Đánh dấu đã đọc'
        }
        secondaryLabel="Đóng"
        onSecondary={closeNotificationDetail}
        onPrimary={() => {
          if (notifDetail.loading || !notifDetail.data || Boolean(notifDetail.data.isRead)) {
            closeNotificationDetail();
            return;
          }
          markNotificationRead(notifDetail.data);
        }}
        primaryDisabled={
          notifDetail.loading ||
          !notifDetail.data ||
          Boolean(notifDetail.data.isRead) ||
          String(notifMarkingId) === String(notifDetail.data?.id)
        }
      >
        {notifDetail.loading ? (
          <div className="space-y-3">
            <div className="h-4 w-40 animate-pulse rounded bg-slate-800" />
            <div className="h-24 animate-pulse rounded-xl bg-slate-800" />
          </div>
        ) : notifDetail.error ? (
          <div className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm font-medium text-slate-200">
            {notifDetail.error}
          </div>
        ) : notifDetail.data ? (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              {(() => {
                const badge = notificationTypeBadge(notifDetail.data.type);
                return (
                  <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold ${badge.cls}`}>
                    {badge.label}
                  </span>
                );
              })()}
              <span
                className={
                  Boolean(notifDetail.data.isRead)
                    ? 'inline-flex rounded-full border border-slate-700 bg-slate-800 px-2 py-0.5 text-xs font-semibold text-slate-300'
                    : 'inline-flex rounded-full border border-slate-600 bg-slate-950 px-2 py-0.5 text-xs font-semibold text-white'
                }
              >
                {Boolean(notifDetail.data.isRead) ? 'Đã đọc' : 'Chưa đọc'}
              </span>
            </div>
            <div className="grid gap-2 text-xs text-slate-400 sm:grid-cols-2">
              <div>ID: #{notifDetail.data.id}</div>
              <div>User ID: {notifDetail.data.userId ?? '—'}</div>
              <div>Tạo lúc: {formatDateTimeVi(notifDetail.data.createdAt)}</div>
              <div>Đọc lúc: {formatDateTimeVi(notifDetail.data.readAt)}</div>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-3">
              <div className="text-sm font-semibold text-white">{notifDetail.data.title || '—'}</div>
              <div className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-300">{notifDetail.data.message || '—'}</div>
            </div>
            {notifDetail.data.meta ? (
              <div>
                <div className="mb-1 text-xs font-semibold text-slate-400">Meta</div>
                <pre className="max-h-40 overflow-auto rounded-lg border border-slate-800 bg-slate-950 p-3 text-xs text-slate-300">
                  {typeof notifDetail.data.meta === 'string'
                    ? notifDetail.data.meta
                    : JSON.stringify(notifDetail.data.meta, null, 2)}
                </pre>
              </div>
            ) : null}
          </div>
        ) : null}
      </Dialog>

      <Dialog
        open={storyDialog.open}
        title={storyDialog.type === 'reject' ? 'Từ chối truyện' : 'Phê duyệt truyện'}
        primaryLabel={storyDialog.type === 'reject' ? 'Từ chối' : 'Phê duyệt'}
        secondaryLabel="Hủy"
        danger={storyDialog.type === 'reject'}
        onSecondary={closeStoryDialog}
        onPrimary={requestStoryReview}
        primaryDisabled={reviewSubmitting}
      >
        <div className="space-y-3">
          <div className="rounded-xl border border-slate-800 bg-slate-900/30 p-3">
            <div className="text-sm font-semibold text-white">{storyDialog?.story?.title || 'Không tên'}</div>
            <div className="mt-1 text-xs text-slate-400">Tác giả: {storyDialog?.story?.authorName || '—'}</div>
          </div>

          <div>
            <label className="text-sm font-semibold text-slate-200">Ghi chú cho tác giả (tuỳ chọn)</label>
            <textarea
              value={storyDialogNote}
              onChange={(e) => setStoryDialogNote(e.target.value)}
              rows={4}
              placeholder="Nhập ghi chú..."
              className="mt-2 w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-slate-600"
            />
          </div>
        </div>
      </Dialog>

      <Dialog
        open={Boolean(storyConfirm.open) && Boolean(storyDialog.open)}
        title={storyDialog.type === 'reject' ? 'Xác nhận từ chối' : 'Xác nhận phê duyệt'}
        primaryLabel="Xác nhận"
        secondaryLabel="Quay lại"
        danger={storyDialog.type === 'reject'}
        onSecondary={closeStoryConfirm}
        onPrimary={confirmStoryReview}
        primaryDisabled={reviewSubmitting}
      >
        <div className="space-y-3">
          <div className="rounded-xl border border-slate-800 bg-slate-900/30 p-3">
            <div className="text-sm font-semibold text-white">{storyDialog?.story?.title || 'Không tên'}</div>
            <div className="mt-1 text-xs text-slate-400">Tác giả: {storyDialog?.story?.authorName || '—'}</div>
          </div>

          <p className="text-sm text-slate-300">
            Bạn chắc chắn muốn {storyDialog.type === 'reject' ? 'từ chối' : 'phê duyệt'} truyện này?
          </p>

          {String(storyDialogNote || '').trim() ? (
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-3">
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">Ghi chú</div>
              <div className="mt-2 whitespace-pre-wrap text-sm text-slate-200">{String(storyDialogNote || '').trim()}</div>
            </div>
          ) : (
            <p className="text-xs text-slate-400">Không có ghi chú.</p>
          )}
        </div>
      </Dialog>

      <Dialog
        open={userDialog.open}
        title={
          userDialog.type === 'lock'
            ? 'Khóa tài khoản'
            : userDialog.type === 'unlock'
              ? 'Mở khóa tài khoản'
              : 'Đổi role người dùng'
        }
        primaryLabel={userDialog.type === 'lock' ? 'Khóa' : userDialog.type === 'unlock' ? 'Mở khóa' : 'Xác nhận'}
        secondaryLabel="Hủy"
        danger={userDialog.type === 'lock'}
        onSecondary={closeUserDialog}
        onPrimary={submitUserAction}
        primaryDisabled={
          userSubmitting ||
          (userDialog.type === 'lock' && !String(userDialogReason || '').trim()) ||
          (userDialog.type === 'role' &&
            (!String(userDialog?.nextRole || '').trim() ||
              String(userDialog.nextRole || '').trim().toUpperCase() === String(userDialog?.user?.role || '').trim().toUpperCase()))
        }
      >
        <div className="space-y-3">
          <div className="rounded-xl border border-slate-800 bg-slate-900/30 p-3">
            <div className="text-sm font-semibold text-white">{userDialog?.user?.username || '—'}</div>
            <div className="mt-1 text-xs text-slate-400">{userDialog?.user?.email || '—'}</div>
          </div>

          {userDialog.type === 'role' ? (
            <div>
              <label className="text-sm font-semibold text-slate-200">Chọn role mới</label>
              <select
                value={userDialog.nextRole || ''}
                onChange={(e) => setUserDialog((prev) => ({ ...prev, nextRole: e.target.value }))}
                className="mt-2 h-11 w-full rounded-lg border border-slate-800 bg-slate-950 px-3 text-sm text-slate-100 outline-none transition focus:border-slate-600"
              >
                <option value="">-- Chọn role --</option>
                {ROLE_OPTIONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
              <p className="mt-2 text-xs text-slate-400">Role hiện tại: {String(userDialog?.user?.role || '—')}</p>
            </div>
          ) : null}

          {userDialog.type === 'lock' ? (
            <div>
              <label className="text-sm font-semibold text-slate-200">Lý do khóa</label>
              <textarea
                value={userDialogReason}
                onChange={(e) => setUserDialogReason(e.target.value)}
                rows={3}
                placeholder="Ví dụ: Vi phạm nội quy"
                className="mt-2 w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-slate-600"
              />
            </div>
          ) : null}

          {userDialog.type === 'unlock' ? (
            <p className="text-sm text-slate-300">Xác nhận mở khóa tài khoản này?</p>
          ) : null}
        </div>
      </Dialog>

      <Dialog
        open={vipDialog.open}
        title={vipDialog.type === 'cancel' ? 'Hủy VIP' : 'Gia hạn VIP'}
        primaryLabel={
          String(vipSubmittingId || '') === String(vipDialog?.user?.id || '')
            ? 'Đang lưu...'
            : vipDialog.type === 'cancel'
              ? 'Hủy VIP'
              : 'Gia hạn'
        }
        secondaryLabel="Đóng"
        danger={vipDialog.type === 'cancel'}
        onSecondary={closeVipDialog}
        onPrimary={submitVipAction}
        primaryDisabled={
          Boolean(vipSubmittingId) ||
          (vipDialog.type === 'upgrade' && Number(vipDialog.days || 0) < 1)
        }
      >
        <div className="space-y-3">
          <div className="rounded-xl border border-slate-800 bg-slate-900/30 p-3">
            <div className="text-sm font-semibold text-white">{vipDialog?.user?.username || '—'}</div>
            <div className="mt-1 text-xs text-slate-400">{vipDialog?.user?.email || '—'}</div>
            <div className="mt-1 text-xs text-slate-400">VIP hiện tại: {formatDateTimeVi(vipDialog?.user?.vipExpiryDate)}</div>
          </div>

          {vipDialog.type === 'upgrade' ? (
            <div>
              <label className="text-sm font-semibold text-slate-200">Số ngày VIP</label>
              <input
                type="number"
                min="1"
                value={vipDialog.days}
                onChange={(e) => setVipDialog((prev) => ({ ...prev, days: e.target.value }))}
                className="mt-2 h-11 w-full rounded-lg border border-slate-800 bg-slate-950 px-3 text-sm text-slate-100 outline-none transition focus:border-slate-600"
              />
            </div>
          ) : (
            <p className="text-sm text-slate-300">Xác nhận hủy VIP cho người dùng này?</p>
          )}
        </div>
      </Dialog>

      {/* ── Report detail modal ─────────────────────────────────────────── */}
      {reportDetailModal.open && reportDetailModal.report ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-lg rounded-xl border border-slate-800 bg-slate-950 shadow-soft">
            <div className="flex items-start justify-between gap-3 border-b border-slate-800 px-5 py-4">
              <h3 className="text-lg font-semibold text-white">Chi tiết báo cáo #{reportDetailModal.report.id}</h3>
              <button
                type="button"
                onClick={() => setReportDetailModal({ open: false, report: null })}
                className="rounded-lg px-2 py-1 text-slate-400 hover:bg-slate-900 hover:text-slate-200"
                aria-label="Đóng"
              >
                ✕
              </button>
            </div>
            <div className="space-y-3 px-5 py-4">
              {[
                ['Người báo cáo', `${reportDetailModal.report.reporterUsername || '—'} (ID: ${reportDetailModal.report.reporterId ?? '—'})`],
                ['Loại mục tiêu', targetTypeLabel(reportDetailModal.report.targetType)],
                ['ID mục tiêu', reportDetailModal.report.targetId ?? '—'],
                ['Lý do', reportDetailModal.report.reason || '—'],
                ['Trạng thái', reportDetailModal.report.status || '—'],
                ['Ngày tạo', formatDateTimeVi(reportDetailModal.report.createdAt)],
                ['Xử lý bửi', reportDetailModal.report.handledByUsername || '—'],
                ['Ngày xử lý', formatDateTimeVi(reportDetailModal.report.handledAt)]
              ].map(([label, value]) => (
                <div key={label} className="flex gap-3">
                  <div className="w-36 shrink-0 text-xs font-semibold text-slate-400">{label}</div>
                  <div className="text-sm text-slate-200 break-words">{String(value)}</div>
                </div>
              ))}
              {reportDetailModal.report.description ? (
                <div>
                  <div className="text-xs font-semibold text-slate-400 mb-1">Mô tả thêm</div>
                  <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-3 text-sm text-slate-200 whitespace-pre-wrap">{reportDetailModal.report.description}</div>
                </div>
              ) : null}
              {reportDetailModal.report.handledNote ? (
                <div>
                  <div className="text-xs font-semibold text-slate-400 mb-1">Ghi chú xử lý</div>
                  <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-3 text-sm text-slate-200 whitespace-pre-wrap">{reportDetailModal.report.handledNote}</div>
                </div>
              ) : null}
            </div>
            <div className="flex justify-end gap-2 border-t border-slate-800 px-5 py-4">
              {reportDetailModal.report.status === 'PENDING' ? (
                <button
                  type="button"
                  onClick={() => { openHandleModal(reportDetailModal.report); setReportDetailModal({ open: false, report: null }); }}
                  className="h-10 rounded-lg border border-slate-600 bg-slate-800 px-4 text-sm font-semibold text-white hover:bg-slate-700"
                >
                  Xử lý báo cáo
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => setReportDetailModal({ open: false, report: null })}
                className="h-10 rounded-lg border border-slate-700 bg-slate-950 px-4 text-sm font-semibold text-slate-200 hover:bg-slate-900"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* ── Handle report modal ──────────────────────────────────────────── */}
      <Dialog
        open={handleModal.open}
        title={`Xử lý báo cáo #${handleModal.report?.id ?? ''}`}
        primaryLabel={handleSubmitting ? 'Đang xử lý...' : 'Xác nhận'}
        secondaryLabel="Hủy"
        onSecondary={closeHandleModal}
        onPrimary={submitHandleReport}
        primaryDisabled={handleSubmitting}
      >
        <div className="space-y-4">
          <div className="rounded-xl border border-slate-800 bg-slate-900/30 p-3">
            <div className="text-xs text-slate-400">Báo cáo bởi: <span className="text-slate-200">{handleModal.report?.reporterUsername || '—'}</span></div>
            <div className="mt-1 text-xs text-slate-400">Lý do: <span className="text-slate-200">{handleModal.report?.reason || '—'}</span></div>
          </div>
          <div>
            <label className="text-sm font-semibold text-slate-200">Kết quả xử lý</label>
            <select
              value={handleModal.resolution}
              onChange={(e) => setHandleModal((prev) => ({ ...prev, resolution: e.target.value }))}
              className="mt-2 h-11 w-full rounded-lg border border-slate-800 bg-slate-950 px-3 text-sm text-slate-100 outline-none transition focus:border-slate-600"
            >
              <option value="RESOLVED">RESOLVED — Đã giải quyết</option>
              <option value="REJECTED">REJECTED — Từ chối báo cáo</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-semibold text-slate-200">Ghi chú xử lý (tuỳ chọn)</label>
            <textarea
              value={handleModal.note}
              onChange={(e) => setHandleModal((prev) => ({ ...prev, note: e.target.value }))}
              rows={3}
              placeholder="Nhập ghi chú..."
              className="mt-2 w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-slate-600"
            />
          </div>
        </div>
      </Dialog>
    </div>
  );
}


