import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TasksService } from './tasks.service';
import { TasksController } from './tasks.controller';
import { Task, TaskSchema } from './task.schema';
import { AiModule } from '../ai/ai.module'; // Import AiModule

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Task.name, schema: TaskSchema }]),
    AiModule, // Add it to imports
  ],
  controllers: [TasksController],
  providers: [TasksService],
})
export class TasksModule {}