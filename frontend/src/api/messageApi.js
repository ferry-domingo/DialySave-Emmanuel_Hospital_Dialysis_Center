import api from "./axios";

export const getContacts = () => api.get("/messages/contacts");
export const getConversations = () => api.get("/messages/conversations");
export const startConversation = (recipientId) =>
  api.post("/messages/conversations", { recipientId });
export const getMessages = (conversationId) =>
  api.get(`/messages/conversations/${conversationId}/messages`);
export const sendMessage = (conversationId, payload) =>
  api.post(`/messages/conversations/${conversationId}/messages`, payload);
export const markRead = (conversationId) =>
  api.patch(`/messages/conversations/${conversationId}/read`);
export const editMessage = (messageId, text) =>
  api.patch(`/messages/messages/${messageId}`, { text });
export const unsendMessage = (messageId, scope) =>
  api.post(`/messages/messages/${messageId}/unsend`, { scope });
export const forwardMessage = (messageId, recipientId) =>
  api.post(`/messages/messages/${messageId}/forward`, { recipientId });
export const reactToMessage = (messageId, emoji) =>
  api.patch(`/messages/messages/${messageId}/reaction`, { emoji });
export const updateConversationPreference = (conversationId, preference, enabled) =>
  api.patch(`/messages/conversations/${conversationId}/preferences`, { preference, enabled });
export const createGroup = (name, memberIds) =>
  api.post("/messages/conversations/group", { name, memberIds });
export const searchMessages = (query) =>
  api.get("/messages/search", { params: { q: query } });
