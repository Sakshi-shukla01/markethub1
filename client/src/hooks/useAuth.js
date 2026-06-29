'use client';

import { useDispatch, useSelector } from 'react-redux';
import api, { setAccessToken } from '@/lib/api';
import { setCredentials, clearCredentials, setUser } from '@/store/authSlice';

export function useAuth() {
  const dispatch = useDispatch();
  const { user, isAuthenticated, bootstrapped } = useSelector((s) => s.auth);

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    setAccessToken(data.accessToken);
    dispatch(setCredentials({ user: data.user }));
    return data;
  };

  const finishVerification = (data) => {
    setAccessToken(data.accessToken);
    dispatch(setCredentials({ user: data.user }));
  };

  const loginWithGoogle = async (credential) => {
    const { data } = await api.post('/auth/google', { credential });
    setAccessToken(data.accessToken);
    dispatch(setCredentials({ user: data.user }));
    return data;
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (_) {}
    setAccessToken(null);
    dispatch(clearCredentials());
  };

  const updateUser = (u) => dispatch(setUser(u));

  return {
    user,
    isAuthenticated,
    bootstrapped,
    isAdmin: user?.role === 'admin',
    login,
    loginWithGoogle,
    finishVerification,
    logout,
    updateUser,
  };
}
