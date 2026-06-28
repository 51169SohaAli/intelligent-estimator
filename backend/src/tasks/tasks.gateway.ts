import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { TasksService } from './tasks.service';
import { Inject, forwardRef } from '@nestjs/common'; // 👈 1. Ensure imports are here

@WebSocketGateway({
  cors: {
    origin: '*', 
  },
})
export class TasksGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  
  constructor(
    @Inject(forwardRef(() => TasksService)) // 👈 2. Wrap it here!
    private readonly tasksService: TasksService,
  ) {}

  @WebSocketServer() 
  server: Server;

  afterInit(server: Server) {
    console.log('🌐 WebSockets Gateway Initialized successfully!');
  }

  handleConnection(client: Socket) {
    console.log(`🔌 Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`❌ Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('createTask')
  async handleCreateTask(@MessageBody() data: any) {
    console.log('📥 Backend Gateway received "createTask" event! Data:', data);
    try {
      // 👈 3. Just invoke the service method. 
      // It handles Gemini, MongoDB saving, and broadcasts the card back automatically!
      await this.tasksService.create(data);
    } catch (error) {
      console.error('❌ Error in gateway during task flow:', error);
    }
  }

  broadcastTaskCreated(task: any) {
    this.server.emit('taskCreated', task);
  }
}