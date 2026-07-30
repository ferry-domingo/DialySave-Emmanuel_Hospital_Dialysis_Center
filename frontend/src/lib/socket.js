import { io } from "socket.io-client";

let socket = null;
const socketUrl = import.meta.env.VITE_SOCKET_URL || window.location.origin;

export const connectSocket = (token) => {
  if (socket) return socket;

  socket = io(socketUrl, {
    auth: { token },
  });

  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const getSocket = () => socket;
