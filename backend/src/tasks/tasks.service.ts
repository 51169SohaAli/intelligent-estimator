import { Injectable, Inject, forwardRef, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Task, TaskDocument } from './task.schema';
import { AiService } from '../ai/ai.service';
import { TasksGateway } from './tasks.gateway';

@Injectable()
export class TasksService {
  constructor(
    @InjectModel(Task.name) private taskModel: Model<TaskDocument>,
    private aiService: AiService,
    @Inject(forwardRef(() => TasksGateway))
    private tasksGateway: TasksGateway, 
  ) {}

async create(createTaskDto: any): Promise<Task> {
  const aiEstimation = await this.aiService.generateEstimation(
    createTaskDto.title,
    createTaskDto.description,
  );

  if (aiEstimation.isValidTask === false) {
    console.log('🛑 AI rejected input as nonsense. Sending error to client.');
    const workspaceId = createTaskDto.workspaceId;
    const errorMessage = aiEstimation.validationErrorReason || "Invalid software task description.";

    if (workspaceId) {
      this.tasksGateway.server.to(workspaceId).emit('taskCreationError', { message: errorMessage });
    } else {
      this.tasksGateway.server.emit('taskCreationError', { message: errorMessage });
    }
    
    throw new Error(errorMessage);
  }

  // 🛠️ Ensure the incoming workspace identifier matches your schema property name
  const enrichedTaskData = {
    title: createTaskDto.title,
    description: createTaskDto.description,
    status: createTaskDto.status || 'Todo',
    // Map workspaceId from the DTO directly into the schema's 'workspace' property
    workspace: createTaskDto.workspaceId || createTaskDto.workspace, 
    ...aiEstimation,
  };

  const newTask = new this.taskModel(enrichedTaskData);
  const savedTask = await newTask.save();

  this.tasksGateway.broadcastTaskCreated(savedTask);

  return savedTask;
}

  async updateStatus(id: string, status: 'Todo' | 'InProgress' | 'Done') {
    const updatedTask = await this.taskModel
      .findByIdAndUpdate(id, { status }, { new: true })
      .exec();

    if (!updatedTask) {
      throw new NotFoundException(`Task with ID "${id}" not found`);
    }

    return updatedTask;
  }

  // 🛡️ WORKSPACE FILTER: Changed parameter name to match the database field name
  async findAllByWorkspace(workspaceId: string): Promise<Task[]> {
    // Look at how your schema is designed. If your task schema field is named "workspace", keep it here.
    // If your schema field is named "workspaceId", change the key below to workspaceId!
    return this.taskModel.find({ workspace: workspaceId }).sort({ createdAt: -1 }).exec();
  }

  // In tasks.service.ts
async update(id: string, updateTaskDto: any): Promise<Task> {
  return this.taskModel.findByIdAndUpdate(id, updateTaskDto, { new: true }).exec();
}

async assignUser(taskId: string, assigneeId: string): Promise<Task> {
  return this.taskModel.findByIdAndUpdate(taskId, { assignee: assigneeId }, { new: true }).exec();
}

async remove(id: string): Promise<any> {
  return this.taskModel.findByIdAndDelete(id).exec();
}
}