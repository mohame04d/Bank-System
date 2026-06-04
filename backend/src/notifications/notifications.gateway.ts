import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
@Injectable()
export class NotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  // Map to store connected users: userId -> socketId
  private connectedUsers = new Map<string, string>();

  constructor(private jwtService: JwtService) {}

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth?.token || client.handshake.headers?.authorization?.split(' ')[1];
      if (!token) {
        client.disconnect();
        return;
      }

      const decoded = await this.jwtService.verifyAsync(token, { secret: process.env.JWT_SECRET });
      const userId = decoded.sub;

      this.connectedUsers.set(userId, client.id);
      console.log(`User ${userId} connected via WebSocket`);
    } catch (error) {
      console.log('WebSocket Authentication Error');
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const userEntries = Array.from(this.connectedUsers.entries());
    const foundUser = userEntries.find(([_, socketId]) => socketId === client.id);
    if (foundUser) {
      this.connectedUsers.delete(foundUser[0]);
    }
  }

  sendNotificationToUser(userId: string, event: string, payload: any) {
    const socketId = this.connectedUsers.get(userId);
    if (socketId) {
      this.server.to(socketId).emit(event, payload);
    }
  }
}
