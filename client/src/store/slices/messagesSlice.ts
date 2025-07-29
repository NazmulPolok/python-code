import { createSlice } from '@reduxjs/toolkit';

interface Message {
  _id: string;
  sender: string;
  receiver: string;
  encryptedContent: string;
  nonce: string;
  type: string;
  createdAt: string;
  status: 'sent' | 'delivered' | 'read';
}

interface MessagesState {
  conversations: any[];
  messages: { [key: string]: Message[] };
  isLoading: boolean;
  error: string | null;
}

const initialState: MessagesState = {
  conversations: [],
  messages: {},
  isLoading: false,
  error: null,
};

const messagesSlice = createSlice({
  name: 'messages',
  initialState,
  reducers: {
    addMessage: (state, action) => {
      const { conversationId, message } = action.payload;
      if (!state.messages[conversationId]) {
        state.messages[conversationId] = [];
      }
      state.messages[conversationId].push(message);
    },
    setConversations: (state, action) => {
      state.conversations = action.payload;
    },
    setMessages: (state, action) => {
      const { conversationId, messages } = action.payload;
      state.messages[conversationId] = messages;
    },
  },
});

export const { addMessage, setConversations, setMessages } = messagesSlice.actions;
export default messagesSlice.reducer;