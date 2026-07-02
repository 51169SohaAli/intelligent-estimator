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
import { Inject, forwardRef } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: '*', 
  },
})
@UseFilters(new BaseWsExceptionFilter())
export class TasksGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  
  constructor(
    @Inject(forwardRef(() => TasksService)) 
    private readonly tasksService: TasksService,
  ) {}

  @WebSocketServer() 
  server: Server;

  afterInit(server: Server) {
    console.log('🌐 WebSockets Gateway Initialized successfully!');
  }

  // 🔌 Securely place the admin into an isolated room named after their workspace ObjectId string
  handleConnection(client: Socket) {
    const workspaceId = client.handshake.query.workspace as string;
    
    if (workspaceId) {
      client.join(workspaceId);
      console.log(`🔌 Client connected: ${client.id} joined workspace room: ${workspaceId}`);
    } else {
      console.log(`🔌 Client connected: ${client.id} (⚠️ No workspace query parameter provided)`);
    }
  }

  handleDisconnect(client: Socket) {
    console.log(`❌ Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('createTask')
  async handleCreateTask(
    @MessageBody() data: any, 
    @ConnectedSocket() client: Socket 
  ) {
    console.log('📥 Backend Gateway received "createTask" event! Data:', data);
    try {
      // Your service saves the document, making sure the workspace field gets populated
      await this.tasksService.create(data);
    } catch (error: any) { 
      console.error('❌ Error in gateway during task flow:', error);
      client.emit('exception', {
        message: error?.message || error?.error || 'An unexpected error occurred',
      });
    }
  }

  @SubscribeMessage('updateTaskStatus')
  async handleUpdateStatus(
    @MessageBody() data: { id: string; status: 'Todo' | 'InProgress' | 'Done'; workspace: string }
  ) {
    console.log('📥 Backend received "updateTaskStatus" event via WebSocket:', data);

    try {
      // 1. Update the document status in MongoDB using your service
      const updatedTask = await this.tasksService.updateStatus(data.id, data.status);

      // 2. 🔑 Target only the specific workspace room instead of a global server emit
      if (data.workspace) {
        this.server.to(data.workspace).emit('taskStatusUpdated', updatedTask);
        console.log(`📢 Broadcasted "taskStatusUpdated" to workspace room ${data.workspace} for task ${data.id}`);
      } else {
        // Fallback safety broadcast if no workspace is attached to the payload
        this.server.emit('taskStatusUpdated', updatedTask);
      }
    } catch (error: any) { 
      console.error('❌ Error updating task status over WebSocket:', error.message);
    }
  }

  // 📢 Used if tasks are generated out-of-band (like a REST controller calling it)
  broadcastTaskCreated(task: any) {
    const workspaceId = task.workspace?.toString();
    if (workspaceId) {
      this.server.to(workspaceId).emit('taskCreated', task);
      console.log(`📢 Broadcasted "taskCreated" explicitly to workspace room: ${workspaceId}`);
    } else {
      this.server.emit('taskCreated', task);
    }
  }
}