import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Task, TaskDocument } from './task.schema';
import { AiService } from '../ai/ai.service'; // Import AiService

@Injectable()
export class TasksService {
  constructor(
    @InjectModel(Task.name) private taskModel: Model<TaskDocument>,
    private aiService: AiService, // Inject AiService here
  ) {}

  async create(createTaskDto: any): Promise<Task> {
    // 1. Get smart predictions from Gemini
    const aiEstimation = await this.aiService.generateEstimation(
      createTaskDto.title,
      createTaskDto.description,
    );

    // 2. Combine original data with the AI insights
    const enrichedTaskData = {
      ...createTaskDto,
      ...aiEstimation,
    };

    // 3. Save the final integrated object to MongoDB
    const newTask = new this.taskModel(enrichedTaskData);
    return newTask.save();
  }

  async findAll(): Promise<Task[]> {
    return this.taskModel.find().exec();
  }
}