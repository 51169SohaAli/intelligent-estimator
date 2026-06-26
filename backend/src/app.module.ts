import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TasksModule } from './tasks/tasks.module';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

@Module({
  imports: [
    // Adding || '' ensures TypeScript knows it will always be a string
    MongooseModule.forRoot(process.env.MONGO_URI || ''),
    TasksModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {} // Removed the trailing semicolon here