// Singleton io reference and per-user socket tracking
let io = null;

// userId (string) -> socketId
const userSockets = new Map();

/**
 * Initialize Socket.io and register all event handlers.
 * Call this once from server.js after creating the io instance.
 */
export const initSocket = (ioInstance) => {
  io = ioInstance;

  io.on('connection', (socket) => {
    console.log(`[Socket] Connected: ${socket.id}`);

    // Client calls this right after connecting to register their userId
    socket.on('join', (userId) => {
      const roomId = `user_${userId}`;
      socket.join(roomId);
      userSockets.set(userId.toString(), socket.id);
      console.log(`[Socket] User ${userId} joined room ${roomId}`);
    });

    // Donors join their blood-group broadcast room
    socket.on('join_blood_group', (bloodGroup) => {
      const room = `bloodgroup_${bloodGroup}`;
      socket.join(room);
      console.log(`[Socket] Socket ${socket.id} joined blood-group room ${room}`);
    });

    socket.on('disconnect', () => {
      for (const [uid, sid] of userSockets.entries()) {
        if (sid === socket.id) {
          userSockets.delete(uid);
          break;
        }
      }
      console.log(`[Socket] Disconnected: ${socket.id}`);
    });
  });
};

/**
 * Emit an event directly to a specific user's room.
 * @param {string} userId
 * @param {string} event
 * @param {object} data
 */
export const emitToUser = (userId, event, data) => {
  if (io) {
    io.to(`user_${userId.toString()}`).emit(event, data);
  }
};

/**
 * Broadcast an event to all sockets in a blood-group room.
 * @param {string} bloodGroup  e.g. 'A+'
 * @param {string} event
 * @param {object} data
 */
export const emitToBloodGroup = (bloodGroup, event, data) => {
  if (io) {
    io.to(`bloodgroup_${bloodGroup}`).emit(event, data);
  }
};

export const getIo = () => io;
