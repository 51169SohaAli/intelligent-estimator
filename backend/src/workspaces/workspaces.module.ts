import { Module } from '@nestjs/common';
import { WorkspacesService } from './workspaces.services';
import { WorkspacesController } from './workspaces.controller'; // 👈 1. Import it

@Module({
  imports: [/* your schema/typeorm imports */],
  controllers: [WorkspacesController], // 👈 2. Register it here!
  providers: [WorkspacesService],
  exports: [WorkspacesService],
})
export class WorkspacesModule {}