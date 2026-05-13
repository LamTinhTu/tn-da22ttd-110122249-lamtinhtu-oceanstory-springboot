import axios from 'axios';

export const API_BASE_URL = (import.meta.env?.VITE_API_BASE_URL || '/api').replace(/\/$/, '');

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

export function withAuth(token) {
  return token
    ? {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    : undefined;
}

export function getBackendOrigin() {
  const originFallback = typeof window !== 'undefined' ? window.location.origin : '';
  try {
    return new URL(API_BASE_URL, originFallback).origin;
  } catch {
    return originFallback;
  }
}

export function resolveBackendUrl(pathOrUrl) {
  const raw = String(pathOrUrl || '').trim();
  if (!raw) return '';
  if (raw.startsWith('http://') || raw.startsWith('https://')) return raw;

  const origin = getBackendOrigin();
  if (!origin) return raw;
  if (raw.startsWith('/')) return `${origin}${raw}`;
  return `${origin}/${raw}`;
}
