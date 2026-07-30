import { create } from "zustand";
import * as messageApi from "../api/messageApi";

const conversationIdOf = (message) =>
  String(message?.conversation?._id ?? message?.conversation ?? "");

const replaceMessageInState = (state, message) => {
  const conversationId = conversationIdOf(message);
  const existing = state.messagesByConversation[conversationId] ?? [];
  return {
    messagesByConversation: {
      ...state.messagesByConversation,
      [conversationId]: existing.map((item) => item._id === message._id ? message : item),
    },
    conversations: state.conversations.map((conversation) =>
      conversation._id === conversationId && conversation.lastMessage?._id === message._id
        ? { ...conversation, lastMessage: message }
        : conversation
    ),
  };
};

export const useMessageStore = create((set, get) => ({
  contacts: [],
  conversations: [],
  messagesByConversation: {},
  activeConversationId: null,
  loading: false,
  messagesLoading: false,
  error: null,

  fetchContacts: async () => {
    try {
      const response = await messageApi.getContacts();
      set({ contacts: response.data.data ?? [] });
    } catch (error) {
      set({ error: error.response?.data?.message || "Unable to load contacts." });
    }
  },

  fetchConversations: async () => {
    try {
      const response = await messageApi.getConversations();
      set({ conversations: response.data.data ?? [], error: null });
    } catch (error) {
      set({ error: error.response?.data?.message || "Unable to load conversations." });
    }
  },

  startConversation: async (recipientId) => {
    const response = await messageApi.startConversation(recipientId);
    const conversation = response.data.data;
    set((state) => ({
      conversations: [
        conversation,
        ...state.conversations.filter((item) => item._id !== conversation._id),
      ],
      activeConversationId: conversation._id,
    }));
    await get().loadMessages(conversation._id);
    return conversation;
  },

  selectConversation: async (conversationId) => {
    set({ activeConversationId: conversationId });
    await get().loadMessages(conversationId);
    await get().markRead(conversationId);
  },

  loadMessages: async (conversationId) => {
    set({ messagesLoading: true, error: null });
    try {
      const response = await messageApi.getMessages(conversationId);
      set((state) => ({
        messagesByConversation: {
          ...state.messagesByConversation,
          [conversationId]: response.data.data ?? [],
        },
        messagesLoading: false,
      }));
    } catch (error) {
      set({
        messagesLoading: false,
        error: error.response?.data?.message || "Unable to load messages.",
      });
    }
  },

  sendMessage: async (payload) => {
    const conversationId = get().activeConversationId;
    if (!conversationId) return;
    const response = await messageApi.sendMessage(conversationId, payload);
    get().receiveMessage(response.data.data, true);
  },

  editMessage: async (messageId, text) => {
    const response = await messageApi.editMessage(messageId, text);
    get().replaceMessage(response.data.data);
  },

  unsendMessage: async (messageId, scope) => {
    const response = await messageApi.unsendMessage(messageId, scope);
    if (response.data.scope === "you") {
      const { conversationId } = response.data;
      set((state) => ({
        messagesByConversation: {
          ...state.messagesByConversation,
          [conversationId]: (state.messagesByConversation[conversationId] ?? [])
            .filter((message) => message._id !== messageId),
        },
      }));
      await get().fetchConversations();
    } else {
      get().replaceMessage(response.data.data);
    }
  },

  forwardMessage: async (messageId, recipientId) => {
    const response = await messageApi.forwardMessage(messageId, recipientId);
    get().receiveMessage(response.data.data, true);
    await get().fetchConversations();
    return response.data;
  },

  reactToMessage: async (messageId, emoji) => {
    const response = await messageApi.reactToMessage(messageId, emoji);
    get().replaceMessage(response.data.data);
  },

  setConversationPreference: async (conversationId, preference, enabled) => {
    await messageApi.updateConversationPreference(conversationId, preference, enabled);
    set((state) => ({
      conversations: state.conversations.map((conversation) =>
        conversation._id === conversationId ? { ...conversation, [preference]: enabled } : conversation
      ),
    }));
  },

  createGroup: async (name, memberIds) => {
    const response = await messageApi.createGroup(name, memberIds);
    const conversation = response.data.data;
    set((state) => ({
      conversations: [conversation, ...state.conversations],
      activeConversationId: conversation._id,
    }));
    return conversation;
  },

  searchMessages: async (query) => {
    const response = await messageApi.searchMessages(query);
    return response.data.data ?? [];
  },

  replaceMessage: (message) => set((state) => replaceMessageInState(state, message)),

  applyReadReceipt: ({ conversationId, userId }) => set((state) => ({
    messagesByConversation: {
      ...state.messagesByConversation,
      [conversationId]: (state.messagesByConversation[conversationId] ?? []).map((message) => ({
        ...message,
        readBy: (message.readBy ?? []).some((id) => String(id?._id ?? id) === String(userId))
          ? message.readBy
          : [...(message.readBy ?? []), userId],
      })),
    },
  })),

  markRead: async (conversationId) => {
    if (!conversationId) return;
    set((state) => ({
      conversations: state.conversations.map((conversation) =>
        conversation._id === conversationId
          ? { ...conversation, unreadCount: 0 }
          : conversation
      ),
    }));
    try {
      await messageApi.markRead(conversationId);
    } catch {
      // The optimistic unread state will be corrected on the next refresh.
    }
  },

  receiveMessage: (message, isOwn = false) => {
    const conversationId = conversationIdOf(message);
    if (!conversationId) return;

    set((state) => {
      const currentMessages = state.messagesByConversation[conversationId] ?? [];
      const alreadyPresent = currentMessages.some((item) => item._id === message._id);
      const isActive = state.activeConversationId === conversationId;
      const existingConversation = state.conversations.find((item) => item._id === conversationId);

      const updatedConversation = existingConversation
        ? {
            ...existingConversation,
            lastMessage: message,
            lastMessageAt: message.createdAt,
            unreadCount: isOwn || isActive
              ? 0
              : (existingConversation.unreadCount ?? 0) + 1,
          }
        : null;

      return {
        messagesByConversation: {
          ...state.messagesByConversation,
          [conversationId]: alreadyPresent ? currentMessages : [...currentMessages, message],
        },
        conversations: updatedConversation
          ? [
              updatedConversation,
              ...state.conversations.filter((item) => item._id !== conversationId),
            ]
          : state.conversations,
      };
    });

    if (!isOwn && get().activeConversationId === conversationId) {
      get().markRead(conversationId);
    } else if (!isOwn && !get().conversations.some((item) => item._id === conversationId)) {
      get().fetchConversations();
    }
  },

  clear: () => set({
    contacts: [],
    conversations: [],
    messagesByConversation: {},
    activeConversationId: null,
    error: null,
  }),
}));
