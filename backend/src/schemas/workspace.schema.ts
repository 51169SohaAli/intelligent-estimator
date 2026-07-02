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
  },
  { timestamps: true }
);

export default WorkspaceSchema;