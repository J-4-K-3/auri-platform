import { configureStore, combineReducers, createSelector } from '@reduxjs/toolkit';
import { persistReducer, persistStore } from 'redux-persist';
import storage from 'redux-persist/lib/storage'; // ✅ web-safe (localStorage)

import authReducer from './slices/authSlice';//✅
import uiReducer from './slices/uiSlice';//✅
import usersReducer from './slices/usersSlice';//✅
import postsReducer from './slices/postsSlice';//✅
import savedPostsReducer from './slices/savedPostsSlice';//✅
import storiesReducer from './slices/storiesSlice';//✅
import chatReducer from './slices/chatSlice';//✅
import exploreReducer from './slices/exploreSlice';//✅
import notificationsReducer from './slices/notificationsSlice';

// =======================
// Persist configs
// =======================

const authPersistConfig = {
  key: 'auth',
  storage,
};

const usersPersistConfig = {
  key: 'users',
  storage,
};

const postsPersistConfig = {
  key: 'posts',
  storage,
  blacklist: ['pending'],
};

const storiesPersistConfig = {
  key: 'stories',
  storage,
};

const chatPersistConfig = {
  key: 'chat',
  storage,
  blacklist: ['typing'],
};

const notificationsPersistConfig = {
  key: 'notifications',
  storage,
};

const savedPostsPersistConfig = {
  key: 'savedPosts',
  storage,
};

const uiPersistConfig = {
  key: 'ui',
  storage,
};

// =======================
// Root reducer
// =======================

const rootReducer = combineReducers({
  auth: persistReducer(authPersistConfig, authReducer),
  ui: persistReducer(uiPersistConfig, uiReducer),
  users: persistReducer(usersPersistConfig, usersReducer),
  posts: persistReducer(postsPersistConfig, postsReducer),
  savedPosts: persistReducer(savedPostsPersistConfig, savedPostsReducer),
  stories: persistReducer(storiesPersistConfig, storiesReducer),
  chat: persistReducer(chatPersistConfig, chatReducer),
  notifications: persistReducer(notificationsPersistConfig, notificationsReducer),
  explore: exploreReducer, // no persistence needed
});

// =======================
// Store
// =======================

export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false, // required for redux-persist
    }),
});

export const persistor = persistStore(store);

// =======================
// Selectors
// =======================

export const selectAuth = (state) => state.auth;
export const selectUi = (state) => state.ui;
export const selectPosts = (state) => state.posts;
export const selectStories = (state) => state.stories;
export const selectChat = (state) => state.chat;
export const selectExplore = (state) => state.explore;
export const selectNotifications = (state) => state.notifications;

// Memoized selector
const selectAuthState = (state) => state.auth;
const selectSavedPostsState = (state) => state.savedPosts;

export const selectSavedPosts = createSelector(
  [selectAuthState, selectSavedPostsState],
  (auth, savedPosts) => {
    const userId = auth.userId;
    if (!userId || !savedPosts.users?.[userId]) {
      return { byId: {}, allIds: [] };
    }
    return savedPosts.users[userId];
  }
);
