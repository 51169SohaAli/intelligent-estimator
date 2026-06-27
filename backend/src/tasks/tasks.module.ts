import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TasksService } from './tasks.service';
import { TasksController } from './tasks.controller';
import { Task, TaskSchema } from './task.schema';
import { AiModule } from '../ai/ai.module';
import { TasksGateway } from './tasks.gateway'; // Import the new Gateway

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Task.name, schema: TaskSchema }]),
    AiModule,
  ],
  controllers: [TasksController],
  // Add TasksGateway here so NestJS instantiates it on startup
  providers: [TasksService, TasksGateway], 
})
export class TasksModule {}