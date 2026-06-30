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
      
      // Emit the error event to the frontend using your injected gateway instance
      this.tasksGateway.server.emit('taskCreationError', {
        message: aiEstimation.validationErrorReason || "Invalid software task description."
      });
      
      // Stop right here! Return a generic blank object or null so it never saves to MongoDB
      return null as any; 
    }

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

  async findAll(): Promise<Task[]> {
    return this.taskModel.find().exec();
  }
}