import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  // { [userId]: { byId: { postId: post }, allIds: [postId1, postId2, ...] } }
  users: {},
};

const savedPostsSlice = createSlice({
  name: 'savedPosts',
  initialState,
  reducers: {
    hydrateSavedPostsForUser(state, action) {
      const { userId, posts } = action.payload;
      if (!userId) return;

      if (!state.users[userId]) {
        state.users[userId] = { byId: {}, allIds: [] };
      }

      (posts || []).forEach((post) => {
        if (!post?.id) {
          return;
        }

        state.users[userId].byId[post.id] = post;

        if (!state.users[userId].allIds.includes(post.id)) {
          state.users[userId].allIds.push(post.id);
        }
      });
    },
    savePostForUser(state, action) {
      const { userId, post } = action.payload;
      if (!userId || !post?.id) {
        console.warn('[savedPostsSlice] savePostForUser: missing userId or post id', { userId, post });
        return;
      }

      if (!state.users[userId]) {
        state.users[userId] = { byId: {}, allIds: [] };
      }

      console.log('[savedPostsSlice] savePostForUser: saving post', post.id, 'for user', userId);
      state.users[userId].byId[post.id] = post;

      if (!state.users[userId].allIds.includes(post.id)) {
        state.users[userId].allIds.push(post.id);
      }
      console.log('[savedPostsSlice] savePostForUser: saved posts now:', state.users[userId].allIds);
    },
    unsavePostForUser(state, action) {
      const { userId, postId } = action.payload;
      const resolvedPostId = typeof postId === 'string' ? postId : postId?.postId;
      if (!userId || !resolvedPostId || !state.users[userId]?.byId[resolvedPostId]) {
        return;
      }

      delete state.users[userId].byId[resolvedPostId];
      state.users[userId].allIds = state.users[userId].allIds.filter((id) => id !== resolvedPostId);
    },
    resetSavedPostsForUser(state, action) {
      const { userId } = action.payload;
      if (userId && state.users[userId]) {
        state.users[userId] = { byId: {}, allIds: [] };
      }
    },
    // Legacy actions for backward compatibility (deprecated)
    hydrateSavedPosts(state, action) {
      console.warn('[savedPostsSlice] hydrateSavedPosts is deprecated, use hydrateSavedPostsForUser');
      // Fallback to current user if available, but this should be updated in calling code
    },
    savePost(state, action) {
      console.warn('[savedPostsSlice] savePost is deprecated, use savePostForUser');
    },
    unsavePost(state, action) {
      console.warn('[savedPostsSlice] unsavePost is deprecated, use unsavePostForUser');
    },
    resetSavedPosts(state) {
      console.warn('[savedPostsSlice] resetSavedPosts is deprecated, use resetSavedPostsForUser');
    },
    // Action to set bookmarked state for a specific post
    setIsBookmarked(state, action) {
      const { userId, postId, isBookmarked } = action.payload;
      if (!userId || !postId) {
        return;
      }

      if (!state.users[userId]) {
        state.users[userId] = { byId: {}, allIds: [] };
      }

      // If bookmarked, ensure post exists in state (it might be added later from API)
      if (isBookmarked && !state.users[userId].byId[postId]) {
        // Just mark the ID as bookmarked without full post data
        if (!state.users[userId].allIds.includes(postId)) {
          state.users[userId].allIds.push(postId);
        }
      }
    },
    // Action to hydrate saved posts from remote bookmark data
    hydrateSavedPostsFromRemote(state, action) {
      const { userId, bookmarks } = action.payload;
      if (!userId) return;

      if (!state.users[userId]) {
        state.users[userId] = { byId: {}, allIds: [] };
      }

      (bookmarks || []).forEach((bookmark) => {
        if (!bookmark?.postId) {
          return;
        }

        // Create a post-like object from the bookmark data
        const postData = {
          id: bookmark.postId,
          userId: bookmark.userId,
          title: bookmark.title,
          description: bookmark.description,
          createdAt: bookmark.createdAt,
          $createdAt: bookmark.$createdAt,
          archived: bookmark.archived,
          isFromBookmark: true,
          bookmarkId: bookmark.bookmarkId || bookmark.$id,
        };

        state.users[userId].byId[bookmark.postId] = postData;

        if (!state.users[userId].allIds.includes(bookmark.postId)) {
          state.users[userId].allIds.push(bookmark.postId);
        }
      });
    },
  },
});

export const {
  hydrateSavedPostsForUser,
  savePostForUser,
  unsavePostForUser,
  resetSavedPostsForUser,
  setIsBookmarked,
  hydrateSavedPostsFromRemote,
  hydrateSavedPosts,
  savePost,
  unsavePost,
  resetSavedPosts
} = savedPostsSlice.actions;

export default savedPostsSlice.reducer;

