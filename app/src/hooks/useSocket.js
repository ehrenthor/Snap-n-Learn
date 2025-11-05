import { useEffect, useState } from 'react';
import io from 'socket.io-client';

export const useSocket = (userType) => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Initialize socket
    const newSocket = io('/', {
      withCredentials: true,
    });

    newSocket.on('connect', () => {
      setConnected(true);

      // Set up heartbeat
      const heartbeatInterval = setInterval(() => {
        newSocket.emit('heartbeat');
      }, 30000); // Every 30 seconds

      return () => clearInterval(heartbeatInterval);
    });

    newSocket.on('connect_error', (err) => {
      console.error('Socket connection error:', err);
      setError(`Connection error: ${err.message}`);
      setConnected(false);
    });

    newSocket.on('error', (err) => {
      console.error('Socket error:', err);
      setError(`Socket error: ${err.message}`);
    });

    newSocket.on('disconnect', () => {
      setConnected(false);
    });

    setSocket(newSocket);

    // Clean up on unmount
    return () => {
      if (newSocket) {
        newSocket.disconnect();
      }
    };
  }, [userType]);

  // Send a message to the server
    const sendMessage = (sessionId, adultId, childId, note) => {
      if (socket && connected) {
        socket.emit('sendMessage', { sessionId, adultId, childId, note });
      }
    };

    const listenForMessages = (callback) => {
      if (socket) {
        socket.on('receiveMessage', callback);
      }
    
      // Return cleanup function
      return () => {
        if (socket) {
          socket.off('receiveMessage', callback);
        }
      };
    };
    
  return { socket, connected, error, sendMessage, listenForMessages };
};