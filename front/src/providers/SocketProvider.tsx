import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '../store/useAuthStore';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

interface SocketContextType {
  socket: Socket | null;
}

const SocketContext = createContext<SocketContextType>({ socket: null });

export const useSocket = () => useContext(SocketContext);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const token = useAuthStore((state) => state.token);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!token) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      return;
    }

    const newSocket = io(import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3000', {
      auth: { token },
      transports: ['websocket'],
    });

    newSocket.on('connect', () => {
      console.log('Connected to real-time notifications');
    });

    newSocket.on('transaction_created', (data) => {
      toast.success(`${data.title}: ${data.message}`, { duration: 5000 });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [token, queryClient]);

  return (
    <SocketContext.Provider value={{ socket }}>
      {children}
    </SocketContext.Provider>
  );
};
