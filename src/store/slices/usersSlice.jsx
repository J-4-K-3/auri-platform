import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  byId: {},
  allIds: [],
};

const usersSlice = createSlice({
  name: 'users',
  initialState,
  reducers: {
    upsertUser(state, action) {
      const user = action.payload || {};
      if (!user.id) {
        return;
      }

      const existing = state.byId[user.id] || {};
      const normalized = {
        ...existing,
        ...user,
      };

      const ensureArray = (incoming, fallback = []) => {
        if (Array.isArray(incoming)) return [...incoming];
        if (Array.isArray(fallback)) return [...fallback];
        return [];
      };

      normalized.followers = ensureArray(user.followers, existing.followers);
      normalized.following = ensureArray(user.following, existing.following);
      normalized.interests = ensureArray(user.interests, existing.interests);
      normalized.connections = user.connections ?? existing.connections ?? 0;

      if (typeof normalized.avatarUri === 'undefined') {
        normalized.avatarUri = existing.avatarUri ?? user.avatarUri ?? null;
      }

      if (typeof normalized.avatarStorageId === 'undefined') {
        normalized.avatarStorageId = existing.avatarStorageId ?? user.avatarStorageId ?? null;
      }

      state.byId[user.id] = normalized;

      if (!state.allIds.includes(user.id)) {
        state.allIds.push(user.id);
      }
    },
    follow(state, action) {
      const { userId, targetId } = action.payload;
      const user = state.byId[userId];
      const target = state.byId[targetId];
      if (!user || !target) return;
      if (!user.following.includes(targetId)) {
        user.following.push(targetId);
      }
      if (!target.followers.includes(userId)) {
        target.followers.push(userId);
      }
    },
    unfollow(state, action) {
      const { userId, targetId } = action.payload;
      const user = state.byId[userId];
      const target = state.byId[targetId];
      if (!user || !target) return;
      user.following = user.following.filter((id) => id !== targetId);
      target.followers = target.followers.filter((id) => id !== userId);
    },
    setConnections(state, action) {
      const { userId, connections } = action.payload;
      if (!state.byId[userId]) return;
      state.byId[userId].connections = connections;
    },
  },
});

export const { upsertUser, follow, unfollow, setConnections } = usersSlice.actions;

export default usersSlice.reducer;