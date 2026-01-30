import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  theme: 'dark',
  layout: 'default',
  isPremium: true, // Set to true for testing premium features
  haptics: true,
  reduceMotion: false,
  dataSaver: false,
  showStatusReels: false,
  loading: false,
  pendingTabNavigation: null, // For premium layouts to request tab navigation
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setTheme(state, action) {
      state.theme = action.payload;
    },
    setLayout(state, action) {
      state.layout = action.payload;
    },
    togglePremium(state) {
      state.isPremium = !state.isPremium;
    },
    toggleHaptics(state) {
      state.haptics = !state.haptics;
    },
    toggleReduceMotion(state) {
      state.reduceMotion = !state.reduceMotion;
    },
    toggleDataSaver(state) {
      state.dataSaver = !state.dataSaver;
    },
    toggleShowStatusReels(state) {
      state.showStatusReels = !state.showStatusReels;
    },
    setLoading(state, action) {
      state.loading = action.payload;
    },
    setPendingTabNavigation(state, action) {
      state.pendingTabNavigation = action.payload;
    },
    clearPendingTabNavigation(state) {
      state.pendingTabNavigation = null;
    },
  },
});

export const {
  setTheme,
  setLayout,
  togglePremium,
  toggleHaptics,
  toggleReduceMotion,
  toggleDataSaver,
  toggleShowStatusReels,
  setLoading,
  setPendingTabNavigation,
  clearPendingTabNavigation,
} = uiSlice.actions;

export default uiSlice.reducer;