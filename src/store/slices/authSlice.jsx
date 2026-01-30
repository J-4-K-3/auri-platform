import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  userId: null,
  isAuthenticated: false,
  onboardingDone: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    completeOnboarding(state) {
      state.onboardingDone = true;
    },
    resetOnboarding(state) {
      state.onboardingDone = false;
    },
    loginSuccess(state, action) {
      state.userId = action.payload.userId;
      state.isAuthenticated = true;
    },
    signupComplete(state, action) {
      state.userId = action.payload.userId;
      state.isAuthenticated = true;
    },
    setUserId(state, action) {
      state.userId = action.payload;
      state.isAuthenticated = true;
    },
    logout() {
      return initialState;
    },
  },
});

export const { completeOnboarding, resetOnboarding, loginSuccess, signupComplete, setUserId, logout } = authSlice.actions;

export default authSlice.reducer;
