// 1. Add Put to the @nestjs/common import line
import { Controller, Post, Body, HttpCode, Query, HttpStatus, ForbiddenException, Get, UseGuards, Req, Res, Injectable, Put } from '@nestjs/common';

// 2. Add these two missing imports at the top:
import { UpdateProfileDto } from './dto/update-profile.dto';
import { AuthService } from './auth.service';
import { RegisterManagerDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthGuard } from '@nestjs/passport';
import { Response } from 'express';
import { UpdateWorkspaceDto } from './dto/update-workspace.dto';

// 🛡️ Custom Google Guard to safely force account selection
@Injectable()
export class GoogleAuthGuard extends AuthGuard('google') {
  getAuthenticateOptions(req: any) {
    return {
      accessType: 'offline',
      prompt: 'select_account',
    };
  }
}

// 🐙 Custom GitHub Guard to safely force account selection / re-login
@Injectable()
export class GithubAuthGuard extends AuthGuard('github') {
  getAuthenticateOptions(req: any) {
    return {
      // Forces GitHub to present the login screen if they want to switch accounts
      prompt: 'login',
      // Allows users to sign up or switch accounts seamlessly during the prompt
      allow_signup: 'true',
    };
  }
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() registerDto: RegisterManagerDto) {
    return this.authService.registerManager(registerDto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  // 🚪 1. Google Auth Kickoff Entrypoint
  @Get('google')
  @UseGuards(GoogleAuthGuard) // Use our clean custom guard here
  async googleAuth(@Req() req: any) {
    // Passport handles the redirect to Google
  }

  // 🔄 2. Google Redirect Target
  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleAuthRedirect(@Req() req: any, @Res() res: Response) {
    const token = req.user.jwtToken; 
    const userPayload = encodeURIComponent(JSON.stringify(req.user.profile));
    return res.redirect(`http://localhost:3000/auth/callback?token=${token}&user=${userPayload}`);
  }

  // 🐙 3. GitHub Auth Kickoff Entrypoint
  @Get('github')
  @UseGuards(GithubAuthGuard) // Use our clean custom guard here
  async githubAuth(@Req() req: any) {
    // Passport handles the redirect to GitHub
  }

  // 🔄 4. GitHub Redirect Target
  @Get('github/callback')
  @UseGuards(AuthGuard('github'))
  async githubAuthRedirect(@Req() req: any, @Res() res: Response) {
    const token = req.user.jwtToken;
    const userPayload = encodeURIComponent(JSON.stringify(req.user.profile));
    return res.redirect(`http://localhost:3000/auth/callback?token=${token}&user=${userPayload}`);
  }

  // 👤 Update Profile Route
  @UseGuards(AuthGuard('jwt')) // 👈 Use AuthGuard('jwt') directly here
  @Put('users/profile')
  async updateProfile(@Req() req: any, @Body() dto: UpdateProfileDto) {
    return await this.authService.updateUserProfile(req.user.id, dto);
  }

  @UseGuards(AuthGuard('jwt'))
  @Put('workspace/settings')
  async updateWorkspace(@Req() req: any, @Body() dto: UpdateWorkspaceDto) {
    // Basic check: Only allow admins to change workspace settings
    if (req.user.role !== 'Admin') {
      throw new ForbiddenException('Only workspace admins can change settings');
    }
    return await this.authService.updateWorkspaceDetails(req.user.workspaceId, dto);
  }

  // 🏢 Fetch Workspace Settings & Team (Admin Only)
  @UseGuards(AuthGuard('jwt'))
  @Get('workspace/settings')
  async getWorkspaceSettings(@Req() req: any) {
    if (req.user.role !== 'Admin') {
      throw new ForbiddenException('Only admins can view workspace settings');
    }
    return await this.authService.getWorkspaceSettings(req.user.workspaceId);
  }

  // 🔄 Reset Invite Link (Admin Only)
  @UseGuards(AuthGuard('jwt'))
  @Post('workspace/reset-invite')
  async resetInvite(@Req() req: any) {
    if (req.user.role !== 'Admin') {
      throw new ForbiddenException('Only admins can reset invite links');
    }
    return await this.authService.resetInviteToken(req.user.workspaceId);
  }

  // 🔓 Public Route: Verify invite link before rendering employee signup page
  @Get('invite/verify')
  async verifyInvite(@Query('slug') slug: string, @Query('token') token: string) {
    return await this.authService.verifyInviteToken(slug, token);
  }
}