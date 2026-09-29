import {
  Controller,
  Get,
  Patch,
  Post,
  Body,
  Req,
  Param,
  UseGuards,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { WorkspacesService } from './workspaces.services';

@Controller('workspaces')
export class WorkspacesController {
  constructor(private readonly workspacesService: WorkspacesService) {}

  private getWorkspaceIdFromReq(req: any): string {
    const workspaceId = req.user?.workspaceId || req.user?.workspace;
    if (!workspaceId) {
      throw new NotFoundException('No workspace associated with this user');
    }
    return typeof workspaceId === 'object' ? workspaceId._id : workspaceId;
  }

  // 1. PUBLIC ROUTE (Must be defined BEFORE generic :id routes)
  @Get('invite-info/:token')
  async getInviteInfo(@Param('token') token: string) {
    return this.workspacesService.getWorkspaceByInviteToken(token);
  }

  // 2. PROTECTED STATIC ROUTES
  @UseGuards(AuthGuard('jwt'))
  @Post('join')
  async joinWorkspace(@Req() req: any, @Body('token') token: string) {
    if (!token) {
      throw new BadRequestException('Invitation token is required');
    }

    const userId = req.user?._id || req.user?.id;
    return this.workspacesService.joinWorkspaceByToken(token, userId);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('current')
  async getCurrentWorkspace(@Req() req: any) {
    const workspaceId = this.getWorkspaceIdFromReq(req);
    return this.workspacesService.findById(workspaceId);
  }

  @UseGuards(AuthGuard('jwt'))
  @Patch('current')
  async updateCurrentWorkspace(
    @Req() req: any,
    @Body('name') name: string,
  ) {
    if (!name || name.trim() === '') {
      throw new BadRequestException('Workspace name is required');
    }

    const workspaceId = this.getWorkspaceIdFromReq(req);
    return this.workspacesService.updateName(workspaceId, name.trim());
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('reset-invite')
  async resetInviteCode(@Req() req: any) {
    const workspaceId = this.getWorkspaceIdFromReq(req);
    return this.workspacesService.resetInviteCode(workspaceId);
  }

  // 3. PARAMETERIZED ROUTES (Always at the bottom)
  @UseGuards(AuthGuard('jwt'))
  @Get(':workspaceId/members')
  async getWorkspaceMembers(@Param('workspaceId') workspaceId: string) {
    const members = await this.workspacesService.getMembers(workspaceId);
    if (!members) {
      throw new NotFoundException('Workspace not found');
    }
    return members;
  }

  @UseGuards(AuthGuard('jwt'))
  @Get(':id')
  async getWorkspace(@Param('id') id: string) {
    return this.workspacesService.findById(id);
  }
}