import * as mongoose from 'mongoose';
import * as bcrypt from 'bcrypt';

export const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please add a name'],
    },
    email: {
      type: String,
      required: [true, 'Please add an email'],
      unique: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        'Please add a valid email',
      ],
    },
    password: {
      type: String,
      // 🚨 CHANGED: Removed required: true so social login works without passwords
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

// --- ADDED FOR SECURITY ---
// This hook automatically hashes the password right before saving to MongoDB
UserSchema.pre('save', async function () {
  // 'this' refers to the user document being saved
  
  // 🚨 CHANGED: If there is no password (OAuth users) or it hasn't been modified, skip hashing!
  if (!this.password || !this.isModified('password')) {
    return; // Just return to stop execution and move to the next step
  }

  try {
    const salt = await bcrypt.genSalt(10); 
    this.password = await bcrypt.hash(this.password, salt);
    // No next() needed here, ending the async function completes the hook
  } catch (error: any) {
    throw error; // Simply throw the error so Mongoose can catch it
  }
});

export default UserSchema;