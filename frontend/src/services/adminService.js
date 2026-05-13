import { api, withAuth } from './apiClient';

export async function fetchAdminDashboardSummary({ token, days = 30 } = {}) {
  const response = await api.get('/admin/dashboard/summary', {
    params: { days },
    ...withAuth(token)
  });
  return response.data;
}

export async function fetchAdminPendingStories({ token } = {}) {
  const response = await api.get('/admin/moderation/stories/pending', withAuth(token));
  return response.data;
}

export async function fetchAdminStoriesForModeration({ token, keyword } = {}) {
  const params = keyword ? { keyword } : undefined;
  const response = await api.get('/admin/moderation/stories', { params, ...withAuth(token) });
  return response.data;
}

export async function fetchAdminChaptersByStoryId({ token, storyId } = {}) {
  const response = await api.get(`/admin/moderation/stories/${storyId}/chapters`, withAuth(token));
  return response.data;
}

export async function updateAdminChapterModeration({ token, chapterId, status, violationNote }) {
  const payload = {
    status,
    violationNote
  };
  const response = await api.put(`/admin/moderation/chapters/${chapterId}/moderation`, payload, withAuth(token));
  return response.data;
}

export async function reviewAdminStory({ token, storyId, approvalStatus, adminNotes }) {
  const payload = { approvalStatus, adminNotes };
  const response = await api.put(`/admin/stories/${storyId}/review`, payload, withAuth(token));
  return response.data;
}

export async function adminHideStory({ token, storyId }) {
  const response = await api.put(`/admin/stories/${storyId}/hide`, {}, withAuth(token));
  return response.data;
}

export async function adminUnhideStory({ token, storyId }) {
  const response = await api.put(`/admin/stories/${storyId}/unhide`, {}, withAuth(token));
  return response.data;
}

export async function adminListStories(
  { token, page = 0, size = 50, q, submissionStatus, status, category, author, hidden, includeDeleted } = {}
) {
  const params = {
    page,
    size,
    q: q ? String(q).trim() : undefined,
    submissionStatus: submissionStatus || undefined,
    status: status || undefined,
    category: category || undefined,
    author: author || undefined,
    hidden: typeof hidden === 'boolean' ? hidden : undefined,
    includeDeleted: typeof includeDeleted === 'boolean' ? includeDeleted : undefined
  };

  const response = await api.get('/admin/stories', { params, ...withAuth(token) });
  return response.data;
}

export async function adminListUsers({ token, page = 0, size = 10, q, role, locked, active } = {}) {
  const params = {
    page,
    size,
    q: q ? String(q).trim() : undefined,
    role: role || undefined,
    locked: typeof locked === 'boolean' ? locked : undefined,
    active: typeof active === 'boolean' ? active : undefined
  };
  const response = await api.get('/admin/users', { params, ...withAuth(token) });
  return response.data;
}

export async function adminLockUser({ token, userId, reason }) {
  const payload = { reason: String(reason || '').trim() };
  const response = await api.put(`/admin/users/${userId}/lock`, payload, withAuth(token));
  return response.data;
}

export async function adminUnlockUser({ token, userId }) {
  const response = await api.put(`/admin/users/${userId}/unlock`, {}, withAuth(token));
  return response.data;
}

export async function adminSetUserRole({ token, userId, role }) {
  const payload = { role: String(role || '').trim() };
  const response = await api.put(`/admin/users/${userId}/role`, payload, withAuth(token));
  return response.data;
}

export async function adminListVipUsers({ token, page = 0, size = 10, q } = {}) {
  const params = {
    page,
    size,
    q: q ? String(q).trim() : undefined
  };
  const response = await api.get('/admin/vip/users', { params, ...withAuth(token) });
  return response.data;
}

export async function adminUpgradeVip({ token, userId, days }) {
  const payload = { days: Number(days || 0) };
  const response = await api.put(`/admin/vip/${userId}/upgrade`, payload, withAuth(token));
  return response.data;
}

export async function adminCancelVip({ token, userId }) {
  const response = await api.put(`/admin/vip/${userId}/cancel`, {}, withAuth(token));
  return response.data;
}

export async function adminListReports({ token, page = 0, size = 10, status, targetType, q } = {}) {
  const params = {
    page,
    size,
    status: status || undefined,
    targetType: targetType || undefined,
    q: q ? String(q).trim() : undefined
  };
  const response = await api.get('/admin/reports', { params, ...withAuth(token) });
  return response.data;
}

export async function adminHandleReport({ token, reportId, resolution, handledNote }) {
  const payload = {
    resolution: String(resolution || '').trim().toUpperCase(),
    handledNote: handledNote ? String(handledNote).trim() : ''
  };
  const response = await api.put(`/admin/reports/${reportId}/handle`, payload, withAuth(token));
  return response.data;
}

// ─────────────────────────────────────────────────────────────────────────────
// Admin/Moderator: Comment management (REAL DB via backend APIs)
// ─────────────────────────────────────────────────────────────────────────────

export async function adminListComments({ token, page = 0, size = 10, q, storyId, chapterId, hidden, locked } = {}) {
  const params = {
    page,
    size,
    q: q ? String(q).trim() : undefined,
    storyId: storyId ? Number(storyId) : undefined,
    chapterId: chapterId ? Number(chapterId) : undefined,
    hidden: typeof hidden === 'boolean' ? hidden : undefined,
    locked: typeof locked === 'boolean' ? locked : undefined
  };

  const response = await api.get('/admin/comments', { params, ...withAuth(token) });
  return response.data;
}

export async function adminGetCommentDetail({ token, commentId } = {}) {
  const response = await api.get(`/admin/comments/${commentId}`, withAuth(token));
  return response.data;
}

export async function adminHideComment({ token, commentId, reason } = {}) {
  const payload = { reason: String(reason || '').trim() };
  const response = await api.put(`/admin/comments/${commentId}/hide`, payload, withAuth(token));
  return response.data;
}

export async function adminUnhideComment({ token, commentId } = {}) {
  const response = await api.put(`/admin/comments/${commentId}/unhide`, {}, withAuth(token));
  return response.data;
}

export async function adminDeleteComment({ token, commentId } = {}) {
  const response = await api.delete(`/admin/comments/${commentId}`, withAuth(token));
  return response.data;
}

// ─────────────────────────────────────────────────────────────────────────────
// Admin/Moderator: Category & Tag management (REAL DB via backend APIs)
// ─────────────────────────────────────────────────────────────────────────────

export async function adminListCategories({ token, page = 0, size = 20, q, active, deleted } = {}) {
  const params = {
    page,
    size,
    q: q ? String(q).trim() : undefined,
    active: typeof active === 'boolean' ? active : undefined,
    deleted: typeof deleted === 'boolean' ? deleted : undefined
  };

  const response = await api.get('/admin/categories', { params, ...withAuth(token) });
  return response.data;
}

export async function adminCreateCategory({ token, name, slug, isActive } = {}) {
  const payload = {
    name: String(name || '').trim(),
    slug: slug ? String(slug).trim() : undefined,
    isActive: typeof isActive === 'boolean' ? isActive : undefined
  };
  const response = await api.post('/admin/categories', payload, withAuth(token));
  return response.data;
}

export async function adminUpdateCategory({ token, categoryId, name, slug, isActive } = {}) {
  const payload = {
    name: String(name || '').trim(),
    slug: slug ? String(slug).trim() : undefined,
    isActive: typeof isActive === 'boolean' ? isActive : undefined
  };
  const response = await api.put(`/admin/categories/${categoryId}`, payload, withAuth(token));
  return response.data;
}

export async function adminDeleteCategory({ token, categoryId } = {}) {
  const response = await api.delete(`/admin/categories/${categoryId}`, withAuth(token));
  return response.data;
}

export async function adminListTags({ token, page = 0, size = 20, q, active, deleted } = {}) {
  const params = {
    page,
    size,
    q: q ? String(q).trim() : undefined,
    active: typeof active === 'boolean' ? active : undefined,
    deleted: typeof deleted === 'boolean' ? deleted : undefined
  };

  const response = await api.get('/admin/tags', { params, ...withAuth(token) });
  return response.data;
}

export async function adminCreateTag({ token, name, slug, isActive } = {}) {
  const payload = {
    name: String(name || '').trim(),
    slug: slug ? String(slug).trim() : undefined,
    isActive: typeof isActive === 'boolean' ? isActive : undefined
  };
  const response = await api.post('/admin/tags', payload, withAuth(token));
  return response.data;
}

export async function adminUpdateTag({ token, tagId, name, slug, isActive } = {}) {
  const payload = {
    name: String(name || '').trim(),
    slug: slug ? String(slug).trim() : undefined,
    isActive: typeof isActive === 'boolean' ? isActive : undefined
  };
  const response = await api.put(`/admin/tags/${tagId}`, payload, withAuth(token));
  return response.data;
}

export async function adminDeleteTag({ token, tagId } = {}) {
  const response = await api.delete(`/admin/tags/${tagId}`, withAuth(token));
  return response.data;
}

// ─────────────────────────────────────────────────────────────────────────────
// Admin/Moderator: Moderation logs (REAL DB via backend APIs)
// ─────────────────────────────────────────────────────────────────────────────

export async function adminListAuditLogs(
  { token, page = 0, size = 20, action, admin, fromDate, toDate } = {}
) {
  const params = {
    page,
    size,
    action: action ? String(action).trim() : undefined,
    admin: admin ? String(admin).trim() : undefined,
    fromDate: fromDate ? String(fromDate).trim() : undefined,
    toDate: toDate ? String(toDate).trim() : undefined
  };
  const response = await api.get('/admin/moderation-logs/audit-logs', { params, ...withAuth(token) });
  return response.data;
}

export async function adminGetAuditLogDetail({ token, id } = {}) {
  const response = await api.get(`/admin/moderation-logs/audit-logs/${id}`, withAuth(token));
  return response.data;
}

export async function adminListModerationActions(
  { token, page = 0, size = 20, action, admin, fromDate, toDate } = {}
) {
  const params = {
    page,
    size,
    action: action ? String(action).trim() : undefined,
    admin: admin ? String(admin).trim() : undefined,
    fromDate: fromDate ? String(fromDate).trim() : undefined,
    toDate: toDate ? String(toDate).trim() : undefined
  };
  const response = await api.get('/admin/moderation-logs/moderation-actions', { params, ...withAuth(token) });
  return response.data;
}

// ─────────────────────────────────────────────────────────────────────────────
// Admin/Moderator: Notifications (REAL DB via backend APIs)
// ─────────────────────────────────────────────────────────────────────────────

export async function listMyNotifications({ token, page = 0, size = 10, type, isRead } = {}) {
  const params = {
    page,
    size,
    type: type ? String(type).trim() : undefined,
    isRead: typeof isRead === 'boolean' ? isRead : undefined
  };
  const response = await api.get('/notifications', { params, ...withAuth(token) });
  return response.data;
}

export async function getMyUnreadNotificationCount({ token } = {}) {
  const response = await api.get('/notifications/unread-count', withAuth(token));
  return response.data;
}

export async function getMyNotificationDetail({ token, id } = {}) {
  const response = await api.get(`/notifications/${id}`, withAuth(token));
  return response.data;
}

export async function updateMyNotificationReadState({ token, id, isRead } = {}) {
  const payload = { isRead: Boolean(isRead) };
  const response = await api.put(`/notifications/${id}/read-state`, payload, withAuth(token));
  return response.data;
}

export async function adminSendSystemNotification({ token, type = 'SYSTEM', title, message, meta } = {}) {
  const payload = {
    type: type ? String(type).trim().toUpperCase() : 'SYSTEM',
    title: String(title || '').trim(),
    message: String(message || '').trim(),
    meta: meta ?? undefined
  };
  const response = await api.post('/admin/notifications/system', payload, withAuth(token));
  return response.data;
}

export async function adminGetModerationActionDetail({ token, id } = {}) {
  const response = await api.get(`/admin/moderation-logs/moderation-actions/${id}`, withAuth(token));
  return response.data;
}
