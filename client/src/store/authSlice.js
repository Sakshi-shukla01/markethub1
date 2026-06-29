import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  user: null,
  isAuthenticated: false,
  bootstrapped: false, // true once we've checked for an existing session
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials(state, action) {
      state.user = action.payload.user;
      state.isAuthenticated = true;
      state.bootstrapped = true;
    },
    setUser(state, action) {
      state.user = action.payload;
    },
    clearCredentials(state) {
      state.user = null;
      state.isAuthenticated = false;
      state.bootstrapped = true;
    },
    setBootstrapped(state) {
      state.bootstrapped = true;
    },
  },
});

export const { setCredentials, setUser, clearCredentials, setBootstrapped } = authSlice.actions;
export default authSlice.reducer;
