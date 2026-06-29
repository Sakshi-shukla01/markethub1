const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const env = require('../config/env');

// Socket.io is used ONLY for realtime notifications (no chat).
function initSocket(httpServer) {
  const io = new Server(httpServer, {
    cors: { origin: env.CLIENT_URL, credentials: true },
  });

  // Authenticate sockets via the access token sent in the handshake
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth && socket.handshake.auth.token;
      if (!token) return next(); // allow anonymous connections (no rooms)
      const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET);
      socket.userId = decoded.id;
      socket.role = decoded.role;
    } catch (_) {
      // invalid token -> connect anonymously
    }
    next();
  });

  io.on('connection', (socket) => {
    if (socket.userId) {
      socket.join(`user:${socket.userId}`);
      if (socket.role === 'admin') socket.join('admins');
    }

    socket.on('disconnect', () => {});
  });

  console.log('[socket] Socket.io ready');
  return io;
}

module.exports = initSocket;
