import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TasksModule } from './tasks/tasks.module';
import { WorkspacesModule } from './workspaces/workspaces.module';
import * as dotenv from 'dotenv';
import { AuthModule } from './auth/auth.module';

// Load environment variables
dotenv.config();

@Module({
  imports: [
    // Adding || '' ensures TypeScript knows it will always be a string
    MongooseModule.forRoot(process.env.MONGO_URI || ''),
    TasksModule,
    AuthModule,
    WorkspacesModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {} // Removed the trailing semicolon here