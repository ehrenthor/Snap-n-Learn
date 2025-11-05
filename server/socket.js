const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const sessionService = require('./services/sessionService');
const chatService = require('./services/chatService');
require('dotenv').config();

let io;

function initializeSocket(server) {
  io = socketIo(server, {
    cors: {
      origin: "https://snapnlearn-7tsv3.ondigitalocean.app",
      methods: ["GET", "POST"],
      credentials: true
    }
  });

  // Middleware to authenticate socket connections using cookies
  io.use((socket, next) => {
    try {
      // Get the cookie from the handshake
      const cookies = socket.handshake.headers.cookie;
      if (!cookies) {
        return next(new Error('Authentication error: No cookies found'));
      }

      // Parse the cookies
      const parseCookies = (cookieString) => {
        const cookies = {};
        cookieString.split(';').forEach(cookie => {
          const parts = cookie.split('=');
          const name = parts[0].trim();
          const value = parts[1] || '';
          cookies[name] = value.trim();
        });
        return cookies;
      };

      const parsedCookies = parseCookies(cookies);
      const token = parsedCookies['token'];

      if (!token) {
        return next(new Error('Authentication error: No token found'));
      }

      // Verify the token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Attach user info to the socket
      socket.userId = decoded.userid;
      socket.userType = decoded.userType;
      socket.username = decoded.username;

      next();
    } catch (error) {
      console.error('Socket authentication error:', error);
      next(new Error(`Authentication error: ${error.message}`));
    }
  });

  io.on('connection', (socket) => {
    // Handle child user connection
    if (socket.userType === 'Child') {
      handleChildConnection(socket);
    }

    // Handle adult user connection
    if (socket.userType === 'Adult') {
      handleAdultConnection(socket);
    }

    // Handle heartbeat
    socket.on('heartbeat', async () => {
      if (socket.sessionId) {
        await sessionService.updateHeartbeat(socket.sessionId, socket.userId);
      }
    });

    // Handle chat message
    socket.on('sendMessage', async ({ sessionId, adultId, childId, note }) => {
      try {
        // Save the message in the database
        const newMessage = await chatService.sendMessage(sessionId, adultId, childId, note);

        // Broadcast the new message to the relevant session
        io.to(`session:${sessionId}`).emit('receiveMessage', {
          sessionId,
          adultId,
          childId,
          note: newMessage.note,
          createdAt: newMessage.createdAt
        });
      } catch (error) {
        console.error('Error sending message:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Handle disconnection
    socket.on('disconnect', async () => {
      if (socket.sessionId) {
        await sessionService.markParticipantOffline(socket.sessionId, socket.userId);
        await sessionService.endSession(socket.sessionId);
        await chatService.deleteNotesBySession(socket.sessionId);  // Clean up notes
      }
    });
  });

  // Set up a periodic task to manage session and participant status
  const cleanupIntervalMinutes = 5; // Run checks every 5 minutes
  const staleSessionTimeoutHours = 1; // End sessions inactive for 1 hour

  setInterval(async () => {
    try {
      await sessionService.markInactiveParticipantsOffline(cleanupIntervalMinutes);
      await sessionService.endStaleSessions(staleSessionTimeoutHours);
    } catch (error) {
      console.error("Error during periodic session maintenance:", error);
    }
  }, cleanupIntervalMinutes * 60 * 1000); // Interval in milliseconds

  return io;
}

async function handleChildConnection(socket) {
  try {
    // Check if child already has an active session
    const activeSessions = await sessionService.getActiveSessionsByChild(socket.userId);

    let sessionId;
    if (activeSessions) {
      sessionId = activeSessions.sessionId;
      await sessionService.updateHeartbeat(sessionId, socket.userId);
    } else {
      // Create a new session
      sessionId = await sessionService.createSession(socket.userId);
    }

    socket.sessionId = sessionId;
    socket.join(`session:${sessionId}`);
  } catch (error) {
    console.error('Error handling child connection:', error);
    socket.emit('error', { message: 'Failed to initialize session' });
  }
}

async function handleAdultConnection(socket) {
  try {
    // Get all active sessions for children associated with this adult
    const sessions = await sessionService.getActiveSessionsForAdult(socket.userId);

    // Join all relevant session rooms
    for (const session of sessions) {
      await sessionService.addSessionParticipant(session.sessionId, socket.userId, 'Adult');
      socket.join(`session:${session.sessionId}`);
    }

    // Send the list of active sessions to the adult
    socket.emit('activeSessions', sessions);
  } catch (error) {
    console.error('Error handling adult connection:', error);
    socket.emit('error', { message: 'Failed to join sessions' });
  }
}

// Function to broadcast image caption to all connected adults
function broadcastImageCaption(chatId, childId, sessionId) {
  if (!io) return;

  io.to(`session:${sessionId}`).emit('newImageCaption', {
    chatId,
    childId,
    timestamp: new Date()
  });
}

module.exports = {
  initializeSocket,
  broadcastImageCaption
};
