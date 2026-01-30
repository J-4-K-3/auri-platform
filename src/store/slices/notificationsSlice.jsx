import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  byId: {},
  allIds: [],
  unreadCount: 0,
};

const sortIdsByCreatedAt = (state) => {
  state.allIds.sort((a, b) => {
    const aDate = new Date(state.byId[a]?.createdAt || 0).getTime();
    const bDate = new Date(state.byId[b]?.createdAt || 0).getTime();
    return bDate - aDate;
  });
};

const recalcUnread = (state) => {
  state.unreadCount = state.allIds.reduce(
    (acc, id) => (state.byId[id]?.read ? acc : acc + 1),
    0
  );
};

const notificationsSlice = createSlice({
  name: "notifications",
  initialState,
  reducers: {
    hydrateNotifications(state, action) {
      const incoming = action.payload || [];
      incoming.forEach((notification) => {
        if (!notification?.id) return;
        state.byId[notification.id] = {
          ...state.byId[notification.id],
          ...notification,
        };
        if (!state.allIds.includes(notification.id)) {
          state.allIds.push(notification.id);
        }
      });
      sortIdsByCreatedAt(state);
      recalcUnread(state);
    },
    addNotification(state, action) {
      const notification = action.payload;
      if (!notification?.id) return;

      state.byId[notification.id] = notification;
      state.allIds = [
        notification.id,
        ...state.allIds.filter((id) => id !== notification.id),
      ];
      recalcUnread(state);
    },
    markNotificationRead(state, action) {
      const id = action.payload;
      const item = state.byId[id];
      if (!item) return;
      item.read = true;
      recalcUnread(state);
    },
    markAllNotificationsRead(state) {
      state.allIds.forEach((id) => {
        if (state.byId[id]) {
          state.byId[id].read = true;
        }
      });
      state.unreadCount = 0;
    },
    clearNotifications(state) {
      state.byId = {};
      state.allIds = [];
      state.unreadCount = 0;
    },
  },
});

export const {
  hydrateNotifications,
  addNotification,
  markNotificationRead,
  markAllNotificationsRead,
  clearNotifications,
} = notificationsSlice.actions;

export default notificationsSlice.reducer;
