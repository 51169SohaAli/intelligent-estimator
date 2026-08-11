import { Injectable, BadRequestException, UnauthorizedException, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as jwt from 'jsonwebtoken';
import * as bcrypt from 'bcrypt'; // Added for checking the hashed password
import { RegisterManagerDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
// 👈 Add this line near your other DTO imports at the top
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdateWorkspaceDto } from './dto/update-workspace.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel('User') private userModel: Model<any>,
    @InjectModel('Workspace') private workspaceModel: Model<any>,
  ) {}

  async registerManager(dto: RegisterManagerDto) {
    const { name, email, password, companyName } = dto;

    if (!name || !email || !password || !companyName) {
      throw new BadRequestException('All fields are required');
    }

    const userExists = await this.userModel.findOne({ email });
    if (userExists) {
      throw new BadRequestException('User with this email already exists');
    }

    const slug = companyName
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');

    const workspaceExists = await this.workspaceModel.findOne({ slug });
    if (workspaceExists) {
      throw new BadRequestException('This company name is already registered');
    }

    try {
      const newUser = await this.userModel.create({
        name,
        email,
        password, 
        role: 'Admin',
      });

      const newWorkspace = await this.workspaceModel.create({
        name: companyName,
        slug,
        owner: newUser._id,
        members: [newUser._id],
      });

      newUser.workspace = newWorkspace._id;
      await newUser.save();

      const token = jwt.sign(
        { id: newUser._id, workspaceId: newWorkspace._id, role: newUser.role },
        process.env.JWT_SECRET || 'sprintflow_fallback_secret_key',
        { expiresIn: '30d' }
      );

      return {
        message: 'Registration successful!',
        token,
        user: {
          id: newUser._id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
          workspace: newWorkspace.name,
          slug: newWorkspace.slug,
          workspaceId: newWorkspace._id.toString(),
        },
      };
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException('Server error during registration');
    }
  }

  async login(dto: LoginDto) {
    const { email, password } = dto;

    if (!email || !password) {
      throw new BadRequestException('Email and password are required');
    }

    // 1. Find user and populate workspace object details
    const user = await this.userModel.findOne({ email }).populate('workspace');
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // 2. Compare incoming text password with stored hashed password
    const isPasswordMatch = await bcrypt.compare(password, user.password);
    if (!isPasswordMatch) {
      throw new UnauthorizedException('Invalid email or password');
    }

    try {
      // 3. Sign access token using your setup configuration
      const token = jwt.sign(
        { id: user._id, workspaceId: user.workspace?._id, role: user.role },
        process.env.JWT_SECRET || 'sprintflow_fallback_secret_key',
        { expiresIn: '30d' }
      );

      // 4. Return data structured perfectly for your frontend AuthContext interface
      return {
        message: 'Login successful!',
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          workspace: user.workspace?.name || 'No Workspace',
          slug: user.workspace?.slug || '',
          workspaceId: user.workspace?._id?.toString() || '',
        },
      };
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException('Server error during login authentication');
    }
  }

  // 🚀 NEW: The OAuth Validator & Creator Method
  async validateOAuthUser(profilePayload: {
    email: string;
    firstName: string;
    lastName: string;
    picture: string;
    accessToken: string;
  }) {
    const { email, firstName, lastName, picture } = profilePayload;
    const fullName = `${firstName} ${lastName}`.trim();

    try {
      // Step A: Look for user and populate workspace details
      let user = await this.userModel.findOne({ email }).populate('workspace');

      if (!user) {
        console.log(`👤 Creating a new database record for social login user: ${email}`);

        // Step B: Create the User account (isOAuthUser flag set if schema supports it)
        user = await this.userModel.create({
          name: fullName,
          email,
          role: 'Admin', // Default to Admin so they can control their workspace
          profilePicture: picture,
          isOAuthUser: true, // Helpful metadata flag
        });

        // Step C: Build a default workspace slug
        const companyName = `${fullName}'s Workspace`;
        const slug = companyName
          .toLowerCase()
          .trim()
          .replace(/[^\w\s-]/g, '')
          .replace(/[\s_-]+/g, '-')
          .replace(/^-+|-+$/g, '');

        // Step D: Spin up their personal Workspace
        const newWorkspace = await this.workspaceModel.create({
          name: companyName,
          slug,
          owner: user._id,
          members: [user._id],
        });

        // Link the workspace to user and re-query to match structure
        user.workspace = newWorkspace._id;
        await user.save();
        
        // Repopulate workspace details on our user instance
        user = await this.userModel.findById(user._id).populate('workspace');
      }

      // Step E: Sign a real JWT using your exact signature style (expires in 30d)
      const token = jwt.sign(
        { id: user._id, workspaceId: user.workspace?._id, role: user.role },
        process.env.JWT_SECRET || 'sprintflow_fallback_secret_key',
        { expiresIn: '30d' }
      );

      return {
        profile: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          workspace: user.workspace?.name || 'No Workspace',
          slug: user.workspace?.slug || '',
          workspaceId: user.workspace?._id?.toString() || '',
        },
        jwtToken: token,
      };
    } catch (error) {
      console.error('Error during OAuth validation:', error);
      throw new InternalServerErrorException('Server error during social authentication');
    }
  }

  async updateUserProfile(userId: string, dto: UpdateProfileDto) {
    const updatedUser = await this.userModel.findByIdAndUpdate(
      userId,
      { $set: dto },
      { new: true }
    );
    return { message: 'Profile updated!', user: updatedUser };
  }

  async updateWorkspaceDetails(workspaceId: string, dto: UpdateWorkspaceDto) {
    const updateData: any = {};

    if (dto.name) {
      updateData.name = dto.name;
      // Re-generate slug if workspace name changes
      updateData.slug = dto.name
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');
    }

    const updatedWorkspace = await this.workspaceModel.findByIdAndUpdate(
      workspaceId,
      { $set: updateData },
      { new: true }
    );

    return { message: 'Workspace updated!', workspace: updatedWorkspace };
  }

  // 1. Get Workspace Info + Invite Token (Admin Only)
  async getWorkspaceSettings(workspaceId: string) {
    const workspace = await this.workspaceModel.findById(workspaceId).populate('members', 'name email role');
    if (!workspace) throw new BadRequestException('Workspace not found');
    return workspace;
  }

  // 2. Reset Invite Token (In case an old link leaked)
  async resetInviteToken(workspaceId: string) {
    const newToken = Math.random().toString(36).substring(2, 12);
    const workspace = await this.workspaceModel.findByIdAndUpdate(
      workspaceId,
      { inviteToken: newToken },
      { new: true }
    );
    return { message: 'Invite link reset successfully', inviteToken: workspace.inviteToken };
  }

  // 3. Verify Invite Link when a new Employee clicks it
  async verifyInviteToken(slug: string, token: string) {
    const workspace = await this.workspaceModel.findOne({ slug, inviteToken: token });
    if (!workspace) {
      throw new BadRequestException('Invalid or expired invite link.');
    }
    return {
      valid: true,
      workspaceName: workspace.name,
      workspaceId: workspace._id,
    };
  }
}