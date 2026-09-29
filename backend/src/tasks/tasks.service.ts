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
    const workspaceId = createTaskDto.workspace || createTaskDto.workspaceId;
    const userId = createTaskDto.creator || createTaskDto.userId;

    // 1. Generate AI Estimation
    const aiEstimation = await this.aiService.generateEstimation(
      createTaskDto.title,
      createTaskDto.description,
    );

    if (aiEstimation.isValidTask === false) {
      console.log('🛑 AI rejected input as nonsense. Sending error to client.');
      const errorMessage = aiEstimation.validationErrorReason || 'Invalid software task description.';

      if (workspaceId) {
        this.tasksGateway.server.to(workspaceId.toString()).emit('taskCreationError', { message: errorMessage });
      } else {
        this.tasksGateway.server.emit('taskCreationError', { message: errorMessage });
      }

      throw new Error(errorMessage);
    }

    // 2. Prepare task payload with default creator & assignee set to task creator
    const enrichedTaskData = {
      title: createTaskDto.title,
      description: createTaskDto.description,
      status: createTaskDto.status || 'Todo',
      workspace: workspaceId,
      creator: userId,
      assignee: userId, // 👈 Default assignee is set to task creator
      ...aiEstimation,
    };

    const newTask = new this.taskModel(enrichedTaskData);
    const savedTask = await newTask.save();

    // 3. Populate creator & assignee before returning/broadcasting
    const populatedTask = await savedTask.populate('assignee creator');

    // 4. Broadcast to workspace room
    this.tasksGateway.broadcastTaskCreated(populatedTask);

    return populatedTask;
  }

  async updateStatus(id: string, status: 'Todo' | 'InProgress' | 'Done'): Promise<Task> {
    const updatedTask = await this.taskModel
      .findByIdAndUpdate(id, { status }, { new: true })
      .populate('assignee creator')
      .exec();

    if (!updatedTask) {
      throw new NotFoundException(`Task with ID "${id}" not found`);
    }

    return updatedTask;
  }

  async findAllByWorkspace(workspaceId: string): Promise<Task[]> {
    return this.taskModel
      .find({ workspace: workspaceId })
      .populate('assignee creator')
      .sort({ createdAt: -1 })
      .exec();
  }

  async update(id: string, updateTaskDto: any): Promise<Task> {
    const updatedTask = await this.taskModel
      .findByIdAndUpdate(id, updateTaskDto, { new: true })
      .populate('assignee creator')
      .exec();

    if (!updatedTask) {
      throw new NotFoundException(`Task with ID "${id}" not found`);
    }

    return updatedTask;
  }

  async assignUser(taskId: string, assigneeId: string): Promise<Task> {
    const updatedTask = await this.taskModel
      .findByIdAndUpdate(
        taskId,
        { assignee: assigneeId ? assigneeId : null },
        { new: true },
      )
      .populate('assignee creator')
      .exec();

    if (!updatedTask) {
      throw new NotFoundException(`Task with ID "${taskId}" not found`);
    }

    return updatedTask;
  }

  async remove(id: string): Promise<any> {
    const deletedTask = await this.taskModel.findByIdAndDelete(id).exec();
    if (!deletedTask) {
      throw new NotFoundException(`Task with ID "${id}" not found`);
    }
    return deletedTask;
  }
}