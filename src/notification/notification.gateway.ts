import { Logger } from '@nestjs/common';
import { ConnectedSocket, MessageBody, OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  namespace: 'notification',
  cors: {
    origin: "*",
    credentials: true
  }
})
export class NotificationGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()

  private readonly logger = new Logger(NotificationGateway.name);

  // Map to store userId -> Socket connection
  private userSockets = new Map<string, Socket>();

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    
    // Clean up socket mapping when client disconnects
    for (const [userId, socket] of this.userSockets.entries()) {
      if (socket.id === client.id) {
        this.userSockets.delete(userId);
        this.logger.log(`Unregistered user: ${userId} (socket ID: ${client.id})`);
        break;
      }
    }
  }

  @SubscribeMessage("register")
  handleRegister(
    @MessageBody() data: { userId: string },
    @ConnectedSocket() client: Socket
  ) {
    if (data && data.userId) {
      this.userSockets.set(data.userId, client);
      this.logger.log(`Registered user: ${data.userId} to socket: ${client.id}`);
      client.emit("registered", { success: true });
    }
  }

  // Method called by NotificationService to send real-time events to connected clients
  sendNotificationToUser(userId: string, notification: any): boolean {
    const socket = this.userSockets.get(userId);
    if (socket) {
      socket.emit("notification", notification);
      this.logger.log(`Real-time notification pushed to user: ${userId}`);
      return true;
    }
    this.logger.log(`User: ${userId} is offline. Notification saved to database only.`);
    return false;
  }
}
