import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose'; // Or your ORM (e.g., TypeORM)
import { Model } from 'mongoose';

@Injectable()
export class WorkspacesService {
  constructor(
    // Inject your Workspace model/repository here
    // Example: @InjectModel('Workspace') private readonly workspaceModel: Model<any>
  ) {}

  async findById(id: string) {
    // Replace with your actual database query logic
    // e.g., return await this.workspaceModel.findById(id);
    return {
      _id: id,
      name: 'Default Workspace',
      inviteCode: 'INVITE123',
    };
  }

  async resetInviteCode(id: string) {
    // Replace with your database update logic to generate a new invite code
    const newCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    return {
      _id: id,
      inviteCode: newCode,
    };
  }
}