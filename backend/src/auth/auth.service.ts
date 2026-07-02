import { Injectable, BadRequestException, UnauthorizedException, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as jwt from 'jsonwebtoken';
import * as bcrypt from 'bcrypt'; // Added for checking the hashed password
import { RegisterManagerDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';


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
        },
      };
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException('Server error during registration');
    }
  }

  // ======= ADD THE LOGIN METHOD HERE =======
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
        },
      };
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException('Server error during login authentication');
    }
  }
}