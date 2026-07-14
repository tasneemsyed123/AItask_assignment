/**
 * models/User.model.ts
 * --------------------------------------------------------------------------
 * Mongoose schema for a registered user. `passwordHash` is selected: false
 * by default so a stray `User.find()` anywhere in the codebase can never
 * accidentally leak password hashes into an API response - callers must
 * explicitly `.select('+passwordHash')` when they need it (only the auth
 * service does this, for login comparison).
 */
import { Schema, model, Document, Types } from 'mongoose';

export interface UserDocument extends Document {
  _id: Types.ObjectId;
  email: string;
  passwordHash: string;
  name: string;
  resetPasswordTokenHash?: string | null;
  resetPasswordExpires?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<UserDocument>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    passwordHash: {
      type: String,
      required: true,
      select: false,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    // Never store the raw reset token (it would let anyone with DB read
    // access reset any password) - only its SHA-256 hash. The raw token is
    // what goes in the emailed link and is compared by re-hashing on submit.
    resetPasswordTokenHash: {
      type: String,
      default: null,
      select: false,
    },
    resetPasswordExpires: {
      type: Date,
      default: null,
      select: false,
    },
  },
  { timestamps: true },
);

export const UserModel = model<UserDocument>('User', userSchema);
