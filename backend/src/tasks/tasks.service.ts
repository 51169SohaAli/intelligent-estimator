import { Injectable, Inject, forwardRef } from '@nestjs/common'; // 👈 1. Add Inject and forwardRef
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

    const enrichedTaskData = {
      ...createTaskDto,
      ...aiEstimation,
    };

    const newTask = new this.taskModel(enrichedTaskData);
    const savedTask = await newTask.save();

    this.tasksGateway.broadcastTaskCreated(savedTask);

    return savedTask;
  }

  async findAll(): Promise<Task[]> {
    return this.taskModel.find().exec();
  }
}