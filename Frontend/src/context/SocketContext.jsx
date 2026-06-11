import { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';
import { useAuth } from './AuthContext.jsx';
import api from '../api/axios.js';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const { user, token, profile } = useAuth();
  const [socket, setSocket] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const socketRef = useRef(null);

  // Fetch the real unread count from the DB
  const refreshUnreadCount = useCallback(async () => {
    if (!token || !user) return;
    try {
      const { data } = await api.get('/notifications');
      setUnreadCount(data.data.unreadCount);
    } catch {
      // silently fail — non-critical
    }
  }, [token, user?.id]);

  // Seed the bell count from the DB whenever the user session changes
  useEffect(() => {
    refreshUnreadCount();
  }, [refreshUnreadCount]);

  // Socket connection lifecycle
  useEffect(() => {
    if (!token || !user) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setSocket(null);
      }
      return;
    }

    const newSocket = io(import.meta.env.VITE_SOCKET_URL, {
      transports: ['websocket', 'polling']
    });

    newSocket.on('connect', () => {
      newSocket.emit('join', user.id);
    });

    // Targeted notification (e.g. hospital receives donor response)
    newSocket.on('notification', (data) => {
      setUnreadCount((c) => c + 1);
      toast.success(data.message, { duration: 5000 });
    });

    // Broadcast to blood-group room (new urgent/critical request)
    newSocket.on('new_urgent_request', (data) => {
      setUnreadCount((c) => c + 1);
      toast(`🚨 ${data.message}`, {
        duration: 7000,
        style: { background: '#dc2626', color: '#fff' }
      });
    });

    socketRef.current = newSocket;
    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
      socketRef.current = null;
    };
  }, [token, user?.id]);

  // Join blood-group room once socket is ready and profile has bloodGroup
  useEffect(() => {
    if (socketRef.current && user?.role === 'donor' && profile?.bloodGroup) {
      socketRef.current.emit('join_blood_group', profile.bloodGroup);
    }
  }, [socket, profile?.bloodGroup, user?.role]);

  const resetUnreadCount = () => setUnreadCount(0);

  return (
    <SocketContext.Provider value={{ socket, unreadCount, refreshUnreadCount, resetUnreadCount }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error('useSocket must be used within SocketProvider');
  return ctx;
};
