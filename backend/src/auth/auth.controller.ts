import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterManagerDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() registerDto: RegisterManagerDto) {
    return this.authService.registerManager(registerDto);
  }
  @Post('login')
  @HttpCode(HttpStatus.OK) // Sets response status to 200 instead of 201 Created
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }
}