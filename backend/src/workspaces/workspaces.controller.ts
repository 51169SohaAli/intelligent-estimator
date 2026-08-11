import { Controller, Get, Post, Req, UseGuards, NotFoundException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';// Adjust path to your JWT guard
import { WorkspacesService } from './workspaces.services'; // Adjust path to your service

@Controller('workspaces')
@UseGuards(AuthGuard('jwt'))
export class WorkspacesController {
  constructor(private readonly workspacesService: WorkspacesService) {}

  // GET /workspaces/current
  @Get('current')
  async getCurrentWorkspace(@Req() req: any) {
    const workspaceId = req.user?.workspaceId;
    if (!workspaceId) {
      throw new NotFoundException('No workspace associated with this user');
    }
    
    return this.workspacesService.findById(workspaceId);
  }

  // POST /workspaces/reset-invite
  @Post('reset-invite')
  async resetInviteCode(@Req() req: any) {
    const workspaceId = req.user?.workspaceId;
    if (!workspaceId) {
      throw new NotFoundException('No workspace associated with this user');
    }

    return this.workspacesService.resetInviteCode(workspaceId);
  }
}