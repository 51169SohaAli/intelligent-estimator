import { Controller, Get, Post, Body, UseGuards, Req } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('tasks')
@UseGuards(AuthGuard('jwt')) // 🛡️ Built-in passport guard passes decoded data to req.user
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  create(@Req() req, @Body() createTaskDto: any) {
    // Automatically bind the request user information into the task dto
    return this.tasksService.create({
      ...createTaskDto,
      createdBy: req.user.id,
      workspaceId: req.user.workspaceId, 
      workspace: req.user.workspaceId, // Added both keys just in case your schema uses one or the other!
    });
  }

  @Get()
  findAll(@Req() req) {
    // 🚀 This matches the new method name in your service file perfectly
    return this.tasksService.findAllByWorkspace(req.user.workspaceId);
  }
}