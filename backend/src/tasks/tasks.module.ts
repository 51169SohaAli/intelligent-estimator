import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TasksService } from './tasks.service';
import { TasksController } from './tasks.controller';
import { Task, TaskSchema } from './task.schema';
import { AiModule } from '../ai/ai.module';
import { TasksGateway } from './tasks.gateway'; // Import the new Gateway
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [MongooseModule.forFeature([{ name: Task.name, schema: TaskSchema }]),
AiModule,
forwardRef(() => AuthModule),
],
  controllers: [TasksController],
  providers: [TasksService, TasksGateway], 
})
export class TasksModule {}