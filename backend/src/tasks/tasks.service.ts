import { Injectable, Inject, forwardRef, NotFoundException } from '@nestjs/common'; // 👈 1. Add Inject and forwardRef
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
    
    @Inject(forwardRef(() => TasksGateway)) // 👈 2. Wrap it here!
    private tasksGateway: TasksGateway, 
  ) {}

  async create(createTaskDto: any): Promise<Task> {
    const aiEstimation = await this.aiService.generateEstimation(
      createTaskDto.title,
      createTaskDto.description,
    );

    if (aiEstimation.isValidTask === false) {
      console.log('🛑 AI rejected input as nonsense. Sending error to client.');
      
      const workspaceId = createTaskDto.workspace;
      const errorMessage = aiEstimation.validationErrorReason || "Invalid software task description.";

      if (workspaceId) {
        // 🔑 Target only the specific workspace room with this validation error
        this.tasksGateway.server.to(workspaceId).emit('taskCreationError', {
          message: errorMessage
        });
      } else {
        // Fallback to global emit if workspace context is missing
        this.tasksGateway.server.emit('taskCreationError', {
          message: errorMessage
        });
      }
      
      // Throwing an actual exception here stops database execution safely and triggers
      // the try/catch block inside tasks.gateway.ts to turn off the loading spinning state!
      throw new Error(errorMessage);
    }

    // Since createTaskDto includes the workspace identifier sent from the frontend,
    // spreading it here ensures it's correctly mapped into the database document.
    const enrichedTaskData = {
      ...createTaskDto,
      ...aiEstimation,
    };

    const newTask = new this.taskModel(enrichedTaskData);
    const savedTask = await newTask.save();

    this.tasksGateway.broadcastTaskCreated(savedTask);

    return savedTask;
  }

  async updateStatus(id: string, status: 'Todo' | 'InProgress' | 'Done') {
    // Find the task by ID and update its status field, returning the updated document
    const updatedTask = await this.taskModel
      .findByIdAndUpdate(id, { status }, { new: true })
      .exec();

    if (!updatedTask) {
      throw new NotFoundException(`Task with ID "${id}" not found`);
    }

    return updatedTask;
  }

  // 🔑 Updated to accept a workspace identifier so admins don't see each other's tasks
  async findAll(workspaceId?: string): Promise<Task[]> {
    if (workspaceId) {
      return this.taskModel.find({ workspace: workspaceId }).sort({ createdAt: -1 }).exec();
    }
    return this.taskModel.find().sort({ createdAt: -1 }).exec();
  }
}