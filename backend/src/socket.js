import { Server } from "socket.io";
import { verifyAuthToken } from "./utils/auth.js";
import Conversation from "./models/Conversation.js";

const onlineUsers = new Map();
let ioInstance = null;

export const emitToUser = (userId, event, payload) => {
  if (ioInstance) ioInstance.to(`user:${userId}`).emit(event, payload);
};

export const broadcastDataChange = (resource, payload = {}) => {
  if (ioInstance) ioInstance.emit("data:changed", { resource, ...payload });
};

export const initSocket = (httpServer, allowedOrigins = true) => {
  const io = new Server(httpServer, {
    cors: { origin: allowedOrigins, credentials: true },
  });
  ioInstance = io;

  io.on("connection", (socket) => {
    let userId = null;

    try {
      const decoded = verifyAuthToken(socket.handshake.auth?.token);
      userId = decoded.id;
    } catch (error) {
      socket.disconnect();
      return;
    }
    socket.join(`user:${userId}`);

    const relayConversationEvent = async (event, payload = {}) => {
      const conversation = await Conversation.findOne({
        _id: payload.conversationId,
        participants: userId,
      }).select("participants");
      if (!conversation) return;
      conversation.participants
        .filter((id) => String(id) !== String(userId))
        .forEach((id) => emitToUser(id, event, { ...payload, userId }));
    };

    socket.on("typing:start", (payload) => relayConversationEvent("typing:start", payload));
    socket.on("typing:stop", (payload) => relayConversationEvent("typing:stop", payload));
    socket.on("call:offer", (payload) => relayConversationEvent("call:offer", payload));
    socket.on("call:answer", (payload) => relayConversationEvent("call:answer", payload));
    socket.on("call:ice-candidate", (payload) => relayConversationEvent("call:ice-candidate", payload));
    socket.on("call:end", (payload) => relayConversationEvent("call:end", payload));

    if (!onlineUsers.has(userId)) {
      onlineUsers.set(userId, new Set());
    }
    onlineUsers.get(userId).add(socket.id);
    io.emit("online-users", Array.from(onlineUsers.keys()));

    socket.on("disconnect", () => {
      const sockets = onlineUsers.get(userId);

      if (sockets) {
        sockets.delete(socket.id);
        if (sockets.size === 0) onlineUsers.delete(userId);
      }

      io.emit("online-users", Array.from(onlineUsers.keys()));
    });
  });

  return io;
};
