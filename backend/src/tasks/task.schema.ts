import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type TaskDocument = Task & Document;

@Schema({ timestamps: true }) // Automatically adds createdAt and updatedAt fields
export class Task {
  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  description: string;

  @Prop({ default: 'Todo' }) // Todo, In Progress, Review, Done
  status: string;

  // AI-powered fields
  @Prop({ default: null })
  aiStoryPoints: number; // The estimation given by our AI engine

  @Prop({ type: [String], default: [] })
  aiSubTasks: string[]; // Automated technical steps broken down by AI

  @Prop({ default: 'Low' }) // Low, Medium, High risk flagged by AI
  riskLevel: string;

  @Prop({ default: '' })
  riskReason: string; // Explanation of why the AI flagged it as risky

  // Human metric tracking
  @Prop({ default: null })
  actualHoursLogged: number; // For tracking variance later on
}

export const TaskSchema = SchemaFactory.createForClass(Task);