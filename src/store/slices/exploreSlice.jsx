import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  query: '',
  results: [],
  trending: [],
  activeFilter: null,
};

const exploreSlice = createSlice({
  name: 'explore',
  initialState,
  reducers: {
    setQuery(state, action) {
      state.query = action.payload;
    },
    setResults(state, action) {
      state.results = action.payload;
    },
    setTrending(state, action) {
      state.trending = action.payload;
    },
    applyFilter(state, action) {
      state.activeFilter = action.payload;
    },
    clearFilter(state) {
      state.activeFilter = null;
    },
  },
});

export const { setQuery, setResults, setTrending, applyFilter, clearFilter } = exploreSlice.actions;

export default exploreSlice.reducer;

