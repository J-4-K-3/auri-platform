import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  theme: 'dark',
  haptics: true,
  reduceMotion: false,
  dataSaver: false,
  showStatusReels: false,
  loading: false,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setTheme(state, action) {
      state.theme = action.payload;
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
  },
});

export const {
  setTheme,
  toggleHaptics,
  toggleReduceMotion,
  toggleDataSaver,
  toggleShowStatusReels,
  setLoading,
} = uiSlice.actions;

export default uiSlice.reducer;