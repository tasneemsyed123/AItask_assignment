/**
 * lib/apiClient.ts
 * --------------------------------------------------------------------------
 * Single Axios instance for the whole frontend. Attaches the access token
 * (from localStorage) to every request, and normalizes error responses so
 * calling code can always read `error.response.data.error.message`.
 *
 * Phase 1 decision: access-token-only auth (no refresh token), so on a 401
 * we simply clear the stored token and redirect to /login rather than
 * attempting a silent refresh.
 */
import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4000/api/v1';

export const apiClient = axios.create({ baseURL: API_BASE_URL });

apiClient.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // A 401 from /auth/* itself (wrong login password, expired reset token,
    // ...) is an expected response the calling page already handles with
    // its own error toast - redirecting here would force a full page
    // reload via window.location.href (even while already on /login),
    // tearing down the React app before that toast ever gets to render.
    // This redirect is only for a previously-valid token going stale on a
    // PROTECTED route (e.g. /tasks/*) mid-session.
    const isAuthEndpoint = error.config?.url?.includes('/auth/');
    if (error.response?.status === 401 && !isAuthEndpoint && typeof window !== 'undefined') {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  },
);

export function getApiErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.error?.message ?? 'Something went wrong. Please try again.';
  }
  return 'Something went wrong. Please try again.';
}
