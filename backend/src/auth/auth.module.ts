import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UserSchema } from '../schemas/user.schema';        // Make sure this points to your User Schema file
import { WorkspaceSchema } from '../schemas/workspace.schema'; // Make sure this points to your Workspace Schema file

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'User', schema: UserSchema },
      { name: 'Workspace', schema: WorkspaceSchema },
    ]),
  ],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService], // Exporting it allows other modules (like Tasks) to use it later
})
export class AuthModule {}