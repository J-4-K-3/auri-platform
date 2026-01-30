import { createSlice, nanoid } from "@reduxjs/toolkit";

// Utility function to check if a story is expired
export const isStoryExpired = (story) => {
  if (!story || !story.expiresAt) return false;
  return new Date(story.expiresAt).getTime() <= Date.now();
};

const initialState = {
  byUser: {},
};

const storiesSlice = createSlice({
  name: "stories",
  initialState,
  reducers: {
    hydrateStories(state, action) {
      const stories = action.payload || [];
      state.byUser = {};
      stories.forEach(story => {
        if (story.userId && !state.byUser[story.userId]) {
          state.byUser[story.userId] = {
            ...story,
            items: story.items || [],
            views: story.views || [],
          };
        }
      });
    },
    addStory: (state, action) => {
      const { userId, mediaUri, mediaType, caption } = action.payload;

      const newItem = {
        id: `story-item-${Date.now()}`,
        mediaUri,
        mediaType,
        caption,
        createdAt: new Date().toISOString(),
        views: [],
      };

      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

      if (state.byUser[userId]) {
        if (!state.byUser[userId].items) state.byUser[userId].items = [];
        state.byUser[userId].items.push(newItem);
        state.byUser[userId].expiresAt = expiresAt;
      } else {
        state.byUser[userId] = {
          id: `story-${Date.now()}`,
          userId,
          items: [newItem],
          expiresAt,
          views: [],
        };
      }
    },
    addStoryView(state, action) {
      const { userId, itemId, viewerId } = action.payload;
      const story = state.byUser[userId];
      if (!story || !story.items) return;
      const item = story.items.find((i) => i.id === itemId);
      if (!item || !Array.isArray(item.views)) {
        item.views = [];
      }
      if (!item.views.includes(viewerId)) {
        item.views.push(viewerId);
      }
    },
    expireStories(state) {
      const now = Date.now();
      Object.keys(state.byUser).forEach(userId => {
        if (new Date(state.byUser[userId].expiresAt).getTime() <= now) {
          delete state.byUser[userId];
        }
      });
    },
  },
});

export const { hydrateStories, addStory, expireStories, addStoryView } =
  storiesSlice.actions;

export default storiesSlice.reducer;
