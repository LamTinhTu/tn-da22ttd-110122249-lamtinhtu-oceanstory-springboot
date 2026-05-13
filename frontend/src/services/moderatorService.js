import { api, withAuth } from './apiClient';

export async function fetchStoriesForModeration({ token, keyword } = {}) {
  const params = keyword ? { keyword } : undefined;
  const response = await api.get('/moderator/stories', { params, ...withAuth(token) });
  return response.data;
}

export async function fetchPendingStoriesForModeration({ token, keyword } = {}) {
  const params = keyword ? { keyword } : undefined;
  const response = await api.get('/moderator/stories/pending', { params, ...withAuth(token) });
  return response.data;
}

export async function reviewStoryModeration({ token, storyId, approvalStatus, adminNotes }) {
  const payload = {
    approvalStatus,
    adminNotes
  };
  const response = await api.put(`/moderator/stories/${storyId}/review`, payload, withAuth(token));
  return response.data;
}

export async function fetchChaptersByStoryId({ token, storyId, storyTitle } = {}) {
  void storyTitle;
  const response = await api.get(`/moderator/stories/${storyId}/chapters`, withAuth(token));
  return response.data;
}

export async function updateChapterModeration({ token, chapterId, status, violationNote }) {
  const payload = {
    status,
    violationNote
  };
  const response = await api.put(`/moderator/chapters/${chapterId}/moderation`, payload, withAuth(token));
  return response.data;
}
