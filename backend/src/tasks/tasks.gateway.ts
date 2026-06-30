import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  ConnectedSocket,
  BaseWsExceptionFilter,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { TasksService } from './tasks.service';
import { UseFilters } from '@nestjs/common';
import { Inject, forwardRef } from '@nestjs/common'; // 👈 1. Ensure imports are here

@WebSocketGateway({
  cors: {
    origin: '*', 
  },
})
@UseFilters(new BaseWsExceptionFilter())
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
async handleCreateTask(
  @MessageBody() data: any, 
  @ConnectedSocket() client: Socket // 👈 1. ADD THIS RIGHT HERE!
) {
  console.log('📥 Backend Gateway received "createTask" event! Data:', data);
  try {
    await this.tasksService.create(data);
  } catch (error: any) { // 👈 2. Add ": any" here so TypeScript lets us read custom properties
    console.error('❌ Error in gateway during task flow:', error);

    // 👈 3. Now "client" is fully recognized and will send the error to the frontend!
    client.emit('exception', {
      message: error?.message || error?.error || 'An unexpected error occurred',
    });
  }
}

 @SubscribeMessage('updateTaskStatus')
  async handleUpdateStatus(
    @MessageBody() data: { id: string; status: 'Todo' | 'InProgress' | 'Done' }
  ) {
    console.log('📥 Backend received "updateTaskStatus" event via WebSocket:', data);

    try {
      // 1. Update the document status in MongoDB using your service
      const updatedTask = await this.tasksService.updateStatus(data.id, data.status);

      // 2. Broadcast the freshly updated task to all connected clients
      this.server.emit('taskStatusUpdated', updatedTask);
      
      console.log(`📢 Broadcasted "taskStatusUpdated" for task ${data.id} to status ${data.status}`);
    } catch (error: any) { // 👈 Added ": any" here to let TypeScript know it can read .message safely
      console.error('❌ Error updating task status over WebSocket:', error.message);
    }
  }

  broadcastTaskCreated(task: any) {
    this.server.emit('taskCreated', task);
  }
}