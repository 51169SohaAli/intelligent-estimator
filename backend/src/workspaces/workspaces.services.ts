import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { WorkspaceDocument } from '../schemas/workspace.schema';
import { UserDocument } from '../schemas/user.schema'; // 👈 Resolved import
import * as crypto from 'crypto';

@Injectable()
export class WorkspacesService {
  constructor(
    @InjectModel('Workspace')
    private readonly workspaceModel: Model<WorkspaceDocument>,
    @InjectModel('User')
    private readonly userModel: Model<UserDocument>,
  ) {}

  private escapeRegex(text: string): string {
    return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  private slugify(text: string): string {
    return text
      .toString()
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^\w\-]+/g, '')
      .replace(/\-\-+/g, '-');
  }

  async findById(id: string): Promise<WorkspaceDocument> {
    const workspace = await this.workspaceModel.findById(id).exec();
    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    if (!workspace.inviteToken) {
      workspace.inviteToken = crypto.randomBytes(8).toString('hex');
      await workspace.save();
    }

    return workspace;
  }

  async updateName(id: string, name: string): Promise<WorkspaceDocument> {
    const newSlug = this.slugify(name);

    const existingWorkspace = await this.workspaceModel.findOne({
      slug: newSlug,
      _id: { $ne: id },
    });

    if (existingWorkspace) {
      throw new BadRequestException(
        'A workspace with a similar name already exists.',
      );
    }

    const updatedWorkspace = await this.workspaceModel
      .findByIdAndUpdate(
        id,
        { name, slug: newSlug },
        { new: true, runValidators: true },
      )
      .exec();

    if (!updatedWorkspace) {
      throw new NotFoundException('Workspace not found');
    }

    return updatedWorkspace;
  }

  async resetInviteCode(id: string): Promise<{ inviteToken: string }> {
    const newCode = crypto.randomBytes(8).toString('hex');
    const updatedWorkspace = await this.workspaceModel
      .findByIdAndUpdate(id, { inviteToken: newCode }, { new: true })
      .exec();

    if (!updatedWorkspace) {
      throw new NotFoundException('Workspace not found');
    }

    return { inviteToken: updatedWorkspace.inviteToken };
  }

  async getMembers(workspaceId: string) {
    const workspace = await this.workspaceModel
      .findById(workspaceId)
      .populate({
        path: 'members',
        select: '_id name email role',
      })
      .exec();

    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    return workspace.members;
  }

  async getWorkspaceByInviteToken(token: string) {
    const cleanToken = this.escapeRegex(token.trim());
    const workspace = await this.workspaceModel
      .findOne({ inviteToken: { $regex: new RegExp(`^${cleanToken}$`, 'i') } })
      .select('name')
      .exec();

    if (!workspace) {
      throw new NotFoundException('Invalid or expired invitation token.');
    }

    return { name: workspace.name };
  }

  async joinWorkspaceByToken(token: string, userId: string) {
    const cleanToken = this.escapeRegex(token.trim());
    const workspace = await this.workspaceModel.findOne({
      inviteToken: { $regex: new RegExp(`^${cleanToken}$`, 'i') },
    });

    if (!workspace) {
      throw new NotFoundException('Invalid or expired invitation token.');
    }

    const isAlreadyMember = workspace.members?.some(
      (memberId: any) => memberId.toString() === userId,
    );

    const rawWorkspace = workspace as any;
    const ownerField = rawWorkspace.ownerId || rawWorkspace.owner;
    const isOwner = ownerField ? ownerField.toString() === userId : false;

    // Update user workspace reference
    await this.userModel.findByIdAndUpdate(userId, {
      workspace: workspace._id,
    });

    if (isAlreadyMember || isOwner) {
      return {
        message: 'You are already a member of this workspace.',
        workspaceId: workspace._id,
      };
    }

    workspace.members.push(userId as any);
    await workspace.save();

    return {
      message: 'Successfully joined workspace.',
      workspaceId: workspace._id,
    };
  }
}