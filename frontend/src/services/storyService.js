import axios from 'axios';

const storyApi = axios.create({
  baseURL: 'http://localhost:8080/api/stories',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Goi API tao truyen moi
export const createStory = (data, token) =>
  storyApi.post('', data, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
