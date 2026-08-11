import * as mongoose from 'mongoose';

export const WorkspaceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please add a company or workspace name'],
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    // 🔑 NEW: Unique random token for team invite links
    inviteToken: {
      type: String,
      default: () => Math.random().toString(36).substring(2, 12),
    },
  },
  { timestamps: true }
);

export default WorkspaceSchema;