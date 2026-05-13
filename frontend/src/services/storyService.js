import { api, withAuth } from './apiClient';

// Goi API tao truyen moi
export const createStory = (data, token) => api.post('/stories', data, withAuth(token));

export async function getMyStories(token) {
  const response = await api.get('/stories/my', withAuth(token));
  return response.data;
}

export async function getStoryDetail(storyId, token) {
  const response = await api.get(`/stories/${storyId}`, withAuth(token));
  return response.data;
}

export async function getStoryChapters(storyId, token) {
  const response = await api.get(`/stories/${storyId}/chapters`, withAuth(token));
  return response.data;
}

export async function createChapter(storyId, payload, token) {
  const response = await api.post(`/stories/${storyId}/chapters`, payload, withAuth(token));
  return response.data;
}
