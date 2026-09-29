import * as mongoose from 'mongoose';
import * as bcrypt from 'bcrypt';

// 1. Export the TypeScript interface for Mongoose documents
export interface UserDocument extends mongoose.Document {
  name: string;
  email: string;
  password?: string;
  role: 'Admin' | 'Member';
  workspace?: mongoose.Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}

export const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please add a name'],
    },
    email: {
      type: String,
      required: [true, 'Please add a valid email'],
      unique: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        'Please add a valid email',
      ],
    },
    password: {
      type: String,
      minlength: 6,
    },
    role: {
      type: String,
      enum: ['Admin', 'Member'],
      default: 'Member',
    },
    workspace: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Workspace',
      required: false,
    },
  },
  { timestamps: true }
);

UserSchema.pre('save', async function () {
  if (!this.password || !this.isModified('password')) {
    return;
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  } catch (error: any) {
    throw error;
  }
});

export default UserSchema;