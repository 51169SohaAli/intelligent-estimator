import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { GoogleStrategy } from './google.strategy'; // Added
import { GithubStrategy } from './github.strategy'; // Added
import { UserSchema } from '../schemas/user.schema'; 
import { WorkspaceSchema } from '../schemas/workspace.schema'; 
import { JwtStrategy } from './strategies/jwt.strategy'; // 🚀 Make sure this is imported!

@Module({
  imports: [
    // Keep your database configurations intact
    MongooseModule.forFeature([
      { name: 'User', schema: UserSchema },
      { name: 'Workspace', schema: WorkspaceSchema },
    ]),
    // Add Passport and JWT configurations for social login token signing
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'fallbackSecretKey',
      signOptions: { expiresIn: '1d' },
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService, 
    GoogleStrategy, // Registered
    GithubStrategy,  // Registered
    JwtStrategy,
  ],
  exports: [PassportModule, AuthService, JwtStrategy], 
})
export class AuthModule {}