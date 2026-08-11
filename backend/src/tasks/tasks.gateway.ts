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
import { UseFilters, Inject, forwardRef } from '@nestjs/common';
// 1. Import your Task entity/interface/schema to resolve `Partial<Task>`
import { Task } from './task.schema'; // Update this path to match your Task schema/interface

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
    @ConnectedSocket() client: Socket,
  ) {
    console.log('📥 Backend Gateway received "createTask" event! Data:', data);
    try {
      const newTask = await this.tasksService.create(data);
      const workspaceId = data.workspace?.toString();

      if (workspaceId) {
        this.server.to(workspaceId).emit('task-created', newTask);
      }

      client.emit('task-created-success');
    } catch (error: any) {
      console.error('❌ Error in gateway during task flow:', error);
      client.emit('exception', {
        message: error?.message || 'Failed to create task',
      });
    }
  }

  @SubscribeMessage('updateTaskStatus')
  async handleUpdateStatus(
    @MessageBody() data: { id: string; status: 'Todo' | 'InProgress' | 'Done'; workspace: string },
  ) {
    console.log('📥 Backend received "updateTaskStatus" event via WebSocket:', data);

    try {
      const updatedTask = await this.tasksService.updateStatus(data.id, data.status);

      if (data.workspace) {
        this.server.to(data.workspace).emit('taskStatusUpdated', updatedTask);
        console.log(`📢 Broadcasted "taskStatusUpdated" to workspace room ${data.workspace} for task ${data.id}`);
      } else {
        this.server.emit('taskStatusUpdated', updatedTask);
      }
    } catch (error: any) {
      console.error('❌ Error updating task status over WebSocket:', error.message);
    }
  }

  broadcastTaskCreated(task: any) {
    const workspaceId = task.workspace?.toString();
    if (workspaceId) {
      this.server.to(workspaceId).emit('task-created', task);
      console.log(`📢 Broadcasted "task-created" explicitly to workspace room: ${workspaceId}`);
    } else {
      this.server.emit('task-created', task);
    }
  }

  @SubscribeMessage('update-task')
  async handleUpdateTask(
    @MessageBody() payload: { workspaceId: string; taskId: string; updates: Partial<Task> },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const updatedTask = await this.tasksService.update(payload.taskId, payload.updates);
      this.server.to(payload.workspaceId).emit('task-updated', updatedTask);
    } catch (error: any) {
      client.emit('exception', { message: error?.message || 'Failed to update task' });
    }
  }

  @SubscribeMessage('assign-task')
  async handleAssignTask(
    @MessageBody() payload: { workspaceId: string; taskId: string; assigneeId: string },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      // Ensure assignUser exists in your TasksService or map it to your update function
      const updatedTask = await this.tasksService.assignUser(payload.taskId, payload.assigneeId);
      this.server.to(payload.workspaceId).emit('task-updated', updatedTask);
    } catch (error: any) {
      client.emit('exception', { message: error?.message || 'Failed to assign task' });
    }
  }

  @SubscribeMessage('delete-task')
  async handleDeleteTask(
    @MessageBody() payload: { workspaceId: string; taskId: string },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      // Ensure remove or delete exists in your TasksService
      await this.tasksService.remove(payload.taskId);
      this.server.to(payload.workspaceId).emit('task-deleted', { taskId: payload.taskId });
    } catch (error: any) {
      client.emit('exception', { message: error?.message || 'Failed to delete task' });
    }
  }
}