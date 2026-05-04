import axios from 'axios';

const storyApi = axios.create({
  baseURL: 'http://localhost:8080/api/stories'
});

export const fetchExploreStories = async (tab = 'updated', category = '') => {
  const response = await storyApi.get('/explore', {
    params: {
      tab,
      category: category || undefined
    }
  });
  return response.data;
};

export const searchStories = async (keyword) => {
  const response = await storyApi.get('/search', {
    params: { keyword }
  });
  return response.data;
};
