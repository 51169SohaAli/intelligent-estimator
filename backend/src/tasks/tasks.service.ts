import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Task, TaskDocument } from './task.schema';
import { AiService } from '../ai/ai.service';
import { TasksGateway } from './tasks.gateway'; // Import the Gateway

@Injectable()
export class TasksService {
  constructor(
    @InjectModel(Task.name) private taskModel: Model<TaskDocument>,
    private aiService: AiService,
    private tasksGateway: TasksGateway, // Inject the gateway here
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

    // 📢 Broadcast the newly created task to all connected frontend clients instantly!
    this.tasksGateway.broadcastTaskCreated(savedTask);

    return savedTask;
  }

  async findAll(): Promise<Task[]> {
    return this.taskModel.find().exec();
  }
}