import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { WorkspacesService } from './workspaces.services';
import { WorkspacesController } from './workspaces.controller';
import { WorkspaceSchema } from '../schemas/workspace.schema'; // Adjust path
import { UserSchema } from '../schemas/user.schema';           // Adjust path

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'Workspace', schema: WorkspaceSchema },
      { name: 'User', schema: UserSchema },
    ]),
  ],
  controllers: [WorkspacesController],
  providers: [WorkspacesService],
  exports: [WorkspacesService],
})
export class WorkspacesModule {}