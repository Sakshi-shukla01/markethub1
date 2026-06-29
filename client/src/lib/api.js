import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true, // send the httpOnly refresh cookie
});

// --- access token helpers (kept in localStorage so it survives refresh) ---
export function getAccessToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('mh_token');
}
export function setAccessToken(token) {
  if (typeof window === 'undefined') return;
  if (token) localStorage.setItem('mh_token', token);
  else localStorage.removeItem('mh_token');
}

// attach access token to every request
api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// auto-refresh on 401 (once)
let isRefreshing = false;
let queue = [];

function processQueue(error, token = null) {
  queue.forEach((p) => (error ? p.reject(error) : p.resolve(token)));
  queue = [];
}

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    const status = error.response ? error.response.status : null;

    // don't try to refresh the refresh/login endpoints themselves
    const noRetry = ['/auth/refresh', '/auth/login', '/auth/register'].some((p) =>
      original.url.includes(p)
    );

    if (status === 401 && !original._retry && !noRetry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => queue.push({ resolve, reject }))
          .then((token) => {
            original.headers.Authorization = `Bearer ${token}`;
            return api(original);
          })
          .catch((err) => Promise.reject(err));
      }

      original._retry = true;
      isRefreshing = true;
      try {
        const { data } = await axios.post(
          `${API_URL}/auth/refresh`,
          {},
          { withCredentials: true }
        );
        setAccessToken(data.accessToken);
        processQueue(null, data.accessToken);
        original.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(original);
      } catch (err) {
        processQueue(err, null);
        setAccessToken(null);
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  }
);

export default api;
