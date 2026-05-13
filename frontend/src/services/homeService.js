import { api } from './apiClient';

export const fetchExploreStories = async (tab = 'updated', category = '') => {
  const response = await api.get('/stories/explore', {
    params: {
      tab,
      category: category || undefined
    }
  });
  return response.data;
};

export const searchStories = async (keyword) => {
  const response = await api.get('/stories/search', {
    params: { keyword }
  });
  return response.data;
};
