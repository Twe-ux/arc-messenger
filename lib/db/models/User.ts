import mongoose, { Schema, Model } from 'mongoose';
import { IUser } from '@/types';

const UserSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email'],
    },
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters long'],
      maxlength: [50, 'Name cannot exceed 50 characters'],
    },
    avatar: {
      type: String,
      default: null,
    },
    gmailTokens: {
      accessToken: String,
      refreshToken: String,
      expiresAt: Date,
    },
    preferences: {
      theme: {
        type: String,
        enum: ['light', 'dark', 'system'],
        default: 'system',
      },
      notifications: {
        email: {
          type: Boolean,
          default: true,
        },
        push: {
          type: Boolean,
          default: true,
        },
        sound: {
          type: Boolean,
          default: true,
        },
      },
      language: {
        type: String,
        default: 'en',
      },
      timezone: {
        type: String,
        default: 'UTC',
      },
    },
    status: {
      type: String,
      enum: ['online', 'offline', 'away', 'busy'],
      default: 'offline',
    },
    lastSeen: {
      type: Date,
      default: Date.now,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: function(doc, ret) {
        // Remove sensitive information when converting to JSON
        delete ret.gmailTokens;
        return ret;
      },
    },
  }
);

// Indexes for better performance
UserSchema.index({ email: 1 });
UserSchema.index({ status: 1 });
UserSchema.index({ lastSeen: -1 });

// Virtual for user's full display name
UserSchema.virtual('displayName').get(function() {
  return this.name || this.email.split('@')[0];
});

// Instance method to update last seen
UserSchema.methods.updateLastSeen = function() {
  this.lastSeen = new Date();
  return this.save();
};

// Instance method to update status
UserSchema.methods.updateStatus = function(status: 'online' | 'offline' | 'away' | 'busy') {
  this.status = status;
  this.lastSeen = new Date();
  return this.save();
};

// Static method to find online users
UserSchema.statics.findOnlineUsers = function() {
  return this.find({ status: { $ne: 'offline' } }).select('_id name avatar status lastSeen');
};

// Static method to find users by email or name
UserSchema.statics.searchUsers = function(query: string) {
  const searchRegex = new RegExp(query, 'i');
  return this.find({
    $or: [
      { name: searchRegex },
      { email: searchRegex },
    ],
  }).select('_id name email avatar status');
};

// Pre-save middleware to hash sensitive data if needed
UserSchema.pre('save', function(next) {
  // Update lastSeen if status is being set to online
  if (this.isModified('status') && this.status === 'online') {
    this.lastSeen = new Date();
  }
  next();
});

// Create and export the User model
let User: Model<IUser>;

try {
  // Try to retrieve an existing model
  User = mongoose.model<IUser>('User');
} catch {
  // Create a new model if it doesn't exist
  User = mongoose.model<IUser>('User', UserSchema);
}

export default User;