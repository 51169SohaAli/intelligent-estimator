'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '@/context/AuthContext';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  joinWorkspace: (workspaceId: string) => void;
  leaveWorkspace: (workspaceId: string) => void;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
  joinWorkspace: () => {},
  leaveWorkspace: () => {},
});

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const { user, loading } = useAuth() as any;

  // Extract workspace ID flexibly regardless of Mongoose population strategy
  const workspaceId =
    user?.workspaceId ||
    (typeof user?.workspace === 'string' ? user?.workspace : user?.workspace?._id);

  useEffect(() => {
    // 1. Wait until Auth Context finishes checking the user token
    if (loading) return;

    // 2. If user logs out or session is clear, disconnect socket
    if (!user) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    // 3. Prevent creating duplicate socket instances if already initialized
    if (socket) return;

    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000';

   const socketInstance = io(SOCKET_URL, {
      transports: ['websocket'],
      auth: { token },
      autoConnect: true,
      query: {              // <--- ADD THIS
        workspace: workspaceId // <--- This guarantees the backend sees it
      }
    });

    socketInstance.on('connect', () => {
      console.log('⚡ Socket connected globally:', socketInstance.id);
      setIsConnected(true);

      // Auto-join workspace room the moment the socket connects
      if (workspaceId) {
        console.log('⚡ Joining workspace room:', workspaceId);
        socketInstance.emit('join-workspace', { workspaceId });
      }
    });

    socketInstance.on('disconnect', (reason) => {
      console.log('🔌 Socket disconnected:', reason);
      setIsConnected(false);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [user, loading, workspaceId]);

  // Dynamic helper method to join rooms manually if needed
  const joinWorkspace = useCallback(
    (targetWorkspaceId: string) => {
      if (socket && targetWorkspaceId) {
        socket.emit('join-workspace', { workspaceId: targetWorkspaceId });
      }
    },
    [socket]
  );

  // Dynamic helper method to leave rooms manually
  const leaveWorkspace = useCallback(
    (targetWorkspaceId: string) => {
      if (socket && targetWorkspaceId) {
        socket.emit('leave-workspace', { workspaceId: targetWorkspaceId });
      }
    },
    [socket]
  );

  return (
    <SocketContext.Provider value={{ socket, isConnected, joinWorkspace, leaveWorkspace }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);