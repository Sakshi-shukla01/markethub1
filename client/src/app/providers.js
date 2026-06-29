'use client';

import { useEffect, useRef } from 'react';
import { Provider, useDispatch, useSelector } from 'react-redux';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster, toast } from 'react-hot-toast';
import { io } from 'socket.io-client';
import { store } from '@/store';
import { setCredentials, setBootstrapped } from '@/store/authSlice';
import { setTheme } from '@/store/themeSlice';
import api, { getAccessToken, setAccessToken } from '@/lib/api';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { refetchOnWindowFocus: false, retry: 1, staleTime: 30 * 1000 },
  },
});

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000';

// Restores the session, applies theme, connects the notification socket
function AppBootstrap({ children }) {
  const dispatch = useDispatch();
  const { user, isAuthenticated } = useSelector((s) => s.auth);
  const themeMode = useSelector((s) => s.theme.mode);
  const socketRef = useRef(null);

  // restore theme from localStorage
  useEffect(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('mh_theme') : null;
    if (saved) dispatch(setTheme(saved));
  }, [dispatch]);

  // apply theme class + persist
  useEffect(() => {
    const root = document.documentElement;
    if (themeMode === 'dark') root.classList.add('dark');
    else root.classList.remove('dark');
    localStorage.setItem('mh_theme', themeMode);
  }, [themeMode]);

  // try to restore a session on first load
  useEffect(() => {
    let active = true;
    async function bootstrap() {
      try {
        // get a fresh access token via the refresh cookie
        const { data } = await api.post('/auth/refresh');
        if (!active) return;
        setAccessToken(data.accessToken);
        dispatch(setCredentials({ user: data.user }));
      } catch (_) {
        if (active) dispatch(setBootstrapped());
      }
    }
    if (getAccessToken() || true) bootstrap();
    return () => {
      active = false;
    };
  }, [dispatch]);

  // connect notification socket when logged in
  useEffect(() => {
    if (!isAuthenticated || !user) return;
    const socket = io(SOCKET_URL, {
      auth: { token: getAccessToken() },
      transports: ['websocket', 'polling'],
    });
    socketRef.current = socket;

    socket.on('notification', (payload) => {
      const icons = {
        order_success: '✅',
        product_sold: '💰',
        listing_approved: '🎉',
        listing_rejected: '⚠️',
        new_product: '🆕',
      };
      toast(payload.message, { icon: icons[payload.type] || '🔔', duration: 5000 });
    });

    return () => socket.disconnect();
  }, [isAuthenticated, user]);

  return children;
}

export default function Providers({ children }) {
  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <AppBootstrap>{children}</AppBootstrap>
        <Toaster
          position="top-right"
          toastOptions={{
            style: { borderRadius: '12px', background: '#1e293b', color: '#fff' },
          }}
        />
      </QueryClientProvider>
    </Provider>
  );
}
