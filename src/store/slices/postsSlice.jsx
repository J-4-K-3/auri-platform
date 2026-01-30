import { createSlice, nanoid } from "@reduxjs/toolkit";
import { encodeLikeToken, normalizeLikeTokenArray } from "../../utils/socialEncoding";

const initialState = {
  byId: {},
  allIds: [],
  pending: {},
};

const postsSlice = createSlice({
  name: "posts",
  initialState,
  reducers: {
    hydratePosts(state, action) {
      (action.payload || []).forEach((post) => {
        if (!post?.id) {
          return;
        }

        const normalizedLikes = normalizeLikeTokenArray(post.likes);
        const commentCount =
          typeof post.commentCount === "number"
            ? post.commentCount
            : Array.isArray(post.comments)
            ? post.comments.length
            : 0;

        state.byId[post.id] = {
          ...post,
          likes: normalizedLikes,
          comments: [],
          commentCount,
        };

        if (!state.allIds.includes(post.id)) {
          state.allIds.push(post.id);
        }
      });
    },
    resetPosts(state) {
      state.byId = {};
      state.allIds = [];
      state.pending = {};
    },
    createPostOptimistic: {
      reducer(state, action) {
        const post = action.payload;
        state.byId[post.id] = post;
        if (!state.allIds.includes(post.id)) {
          state.allIds.unshift(post.id);
        }
        state.pending[post.localId] = post.id;
      },
      prepare(data) {
        const localId = nanoid();
        return {
          payload: {
            ...data,
            id: `local-${localId}`,
            localId,
            createdAt: new Date().toISOString(),
            likes: [],
            comments: [],
            commentCount: data?.commentCount ?? 0,
          },
        };
      },
    },
    createPostSuccess(state, action) {
      const { localId, post } = action.payload;
      const tempId = state.pending[localId];
      if (!tempId) return;
      delete state.pending[localId];

      const commentCount =
        typeof post.commentCount === "number"
          ? post.commentCount
          : Array.isArray(post.comments)
          ? post.comments.length
          : 0;

      const sanitizedPost = {
        ...post,
        likes: normalizeLikeTokenArray(post.likes),
        comments: [],
        commentCount,
      };

      state.byId[sanitizedPost.id] = sanitizedPost;
      state.allIds = state.allIds.map((id) => (id === tempId ? sanitizedPost.id : id));
      delete state.byId[tempId];
    },
    createPostFailure(state, action) {
      const { localId } = action.payload;
      const tempId = state.pending[localId];
      if (!tempId) return;
      delete state.pending[localId];
      state.allIds = state.allIds.filter((id) => id !== tempId);
      delete state.byId[tempId];
    },
    toggleLike(state, action) {
      const { postId, userId } = action.payload;
      const post = state.byId[postId];
      if (!post) return;
      const likeToken = encodeLikeToken(userId);
      if (!likeToken) return;
      const likes = Array.isArray(post.likes) ? post.likes : [];
      const liked = likes.includes(likeToken);
      post.likes = liked
        ? likes.filter((token) => token !== likeToken)
        : [...likes, likeToken];
    },
    addComment(state, action) {
      const { postId, comment } = action.payload;
      const post = state.byId[postId];
      if (!post) return;
      if (!Array.isArray(post.comments)) {
        post.comments = [];
      }
      const nextComment = { ...comment, id: comment?.id ?? nanoid() };
      post.comments.push(nextComment);
      const previousCount =
        typeof post.commentCount === "number"
          ? post.commentCount
          : post.comments.length - 1;
      post.commentCount = previousCount + 1;
    },
    setPostLikes(state, action) {
      const { postId, likes } = action.payload || {};
      const post = state.byId[postId];
      if (!post) return;
      post.likes = normalizeLikeTokenArray(likes);
    },
    setPostComments(state, action) {
      const { postId, comments, total } = action.payload || {};
      const post = state.byId[postId];
      if (!post) return;
      const nextComments = Array.isArray(comments) ? [...comments] : [];
      post.comments = nextComments;
      const incomingTotal =
        typeof total === "number"
          ? total
          : comments && typeof comments.total === "number"
          ? comments.total
          : nextComments.length;
      if (typeof incomingTotal === "number") {
        post.commentCount = incomingTotal;
      }
    },
    removePost(state, action) {
      const postId = typeof action.payload === "string" ? action.payload : action.payload?.postId;
      if (!postId || !state.byId[postId]) return;
      delete state.byId[postId];
      state.allIds = state.allIds.filter((id) => id !== postId);
      Object.entries(state.pending).forEach(([localId, remoteId]) => {
        if (remoteId === postId) {
          delete state.pending[localId];
        }
      });
    },
  },
});

export const {
  hydratePosts,
  resetPosts,
  createPostOptimistic,
  createPostSuccess,
  createPostFailure,
  toggleLike,
  addComment,
  setPostLikes,
  setPostComments,
  removePost,
} = postsSlice.actions;

export default postsSlice.reducer;
