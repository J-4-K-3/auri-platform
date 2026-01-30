import { createSlice, nanoid } from '@reduxjs/toolkit';

const initialState = {
  chats: [],
  messagesByChatId: {},
  typing: {},
};

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    hydrateChats(state, action) {
      state.chats = action.payload.chats ?? [];
      state.messagesByChatId = action.payload.messagesByChatId ?? {};
    },
    sendMessage: {
      reducer(state, action) {
        const { message } = action.payload;
        if (!state.messagesByChatId[message.chatId]) {
          state.messagesByChatId[message.chatId] = [];
        }
        state.messagesByChatId[message.chatId].push(message);
        const chatIndex = state.chats.findIndex((chat) => chat.id === message.chatId);
        if (chatIndex >= 0) {
          state.chats[chatIndex].lastMessageAt = message.createdAt;
        }
      },
      prepare(data) {
        return {
          payload: {
            message: {
              id: nanoid(),
              status: 'queued',
              createdAt: new Date().toISOString(),
              ...data,
            },
          },
        };
      },
    },
    receiveMessage(state, action) {
      const message = action.payload;
      if (!state.messagesByChatId[message.chatId]) {
        state.messagesByChatId[message.chatId] = [];
      }
      state.messagesByChatId[message.chatId].push(message);
    },
    updateMessageStatus(state, action) {
      const { chatId, messageId, status } = action.payload;
      const messages = state.messagesByChatId[chatId];
      if (!messages) return;
      const message = messages.find((m) => m.id === messageId);
      if (message) {
        message.status = status;
      }
    },
    setTyping(state, action) {
      const { chatId, isTyping } = action.payload;
      state.typing[chatId] = isTyping;
    },
  },
});

export const { hydrateChats, sendMessage, receiveMessage, updateMessageStatus, setTyping } = chatSlice.actions;

export default chatSlice.reducer;