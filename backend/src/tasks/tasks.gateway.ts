import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

// Enforce CORS so your frontend port can securely talk to this websocket port
@WebSocketGateway({
  cors: {
    origin: '*', // We can restrict this to your specific Next.js URL later
  },
})
export class TasksGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  
  @WebSocketServer() 
  server: Server; // This gives us access to the main socket broadcast server

  afterInit(server: Server) {
    console.log('🌐 WebSockets Gateway Initialized successfully!');
  }

  handleConnection(client: Socket) {
    console.log(`🔌 Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`❌ Client disconnected: ${client.id}`);
  }

  // A helper function we can call from our services to alert all open screens
  broadcastTaskCreated(task: any) {
    this.server.emit('taskCreated', task);
  }
}