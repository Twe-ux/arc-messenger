import mongoose, { Schema, Model } from 'mongoose';
import { IConversation } from '@/types';

const ConversationSchema = new Schema<IConversation>(
  {
    participants: [{
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    }],
    type: {
      type: String,
      enum: ['chat', 'email', 'group'],
      required: true,
      default: 'chat',
    },
    title: {
      type: String,
      trim: true,
      maxlength: [100, 'Title cannot exceed 100 characters'],
    },
    lastMessage: {
      content: {
        type: String,
        required: true,
        maxlength: [1000, 'Message preview cannot exceed 1000 characters'],
      },
      timestamp: {
        type: Date,
        required: true,
        default: Date.now,
      },
      senderId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
      type: {
        type: String,
        enum: ['text', 'image', 'file', 'video', 'audio'],
        default: 'text',
      },
    },
    unreadCount: {
      type: Map,
      of: Number,
      default: {},
    },
    category: {
      type: String,
      enum: ['inbox', 'personal', 'work', 'favorites', 'archived', 'spam'],
      default: 'inbox',
    },
    metadata: {
      emailThreadId: String,
      subject: {
        type: String,
        maxlength: [200, 'Subject cannot exceed 200 characters'],
      },
      labels: [String],
      priority: {
        type: String,
        enum: ['low', 'normal', 'high'],
        default: 'normal',
      },
    },
    isArchived: {
      type: Boolean,
      default: false,
    },
    isMuted: {
      type: Boolean,
      default: false,
    },
    pinnedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better performance
ConversationSchema.index({ participants: 1 });
ConversationSchema.index({ 'lastMessage.timestamp': -1 });
ConversationSchema.index({ category: 1, 'lastMessage.timestamp': -1 });
ConversationSchema.index({ 'metadata.emailThreadId': 1 });
ConversationSchema.index({ type: 1 });
ConversationSchema.index({ isArchived: 1 });
ConversationSchema.index({ pinnedAt: -1 });

// Compound index for user's conversations
ConversationSchema.index({ 
  participants: 1, 
  isArchived: 1, 
  'lastMessage.timestamp': -1 
});

// Virtual for checking if conversation is pinned
ConversationSchema.virtual('isPinned').get(function() {
  return this.pinnedAt !== null;
});

// Instance method to add participant
ConversationSchema.methods.addParticipant = function(userId: string) {
  if (!this.participants.includes(userId)) {
    this.participants.push(userId);
    return this.save();
  }
  return Promise.resolve(this);
};

// Instance method to remove participant
ConversationSchema.methods.removeParticipant = function(userId: string) {
  this.participants = this.participants.filter(id => id.toString() !== userId);
  return this.save();
};

// Instance method to update last message
ConversationSchema.methods.updateLastMessage = function(content: string, senderId: string, type: string = 'text') {
  this.lastMessage = {
    content,
    timestamp: new Date(),
    senderId,
    type,
  };
  return this.save();
};

// Instance method to increment unread count for a user
ConversationSchema.methods.incrementUnreadCount = function(userId: string) {
  const currentCount = this.unreadCount.get(userId) || 0;
  this.unreadCount.set(userId, currentCount + 1);
  return this.save();
};

// Instance method to reset unread count for a user
ConversationSchema.methods.resetUnreadCount = function(userId: string) {
  this.unreadCount.set(userId, 0);
  return this.save();
};

// Instance method to toggle archive status
ConversationSchema.methods.toggleArchive = function() {
  this.isArchived = !this.isArchived;
  return this.save();
};

// Instance method to toggle pin status
ConversationSchema.methods.togglePin = function() {
  this.pinnedAt = this.pinnedAt ? null : new Date();
  return this.save();
};

// Static method to find conversations for a user
ConversationSchema.statics.findForUser = function(userId: string, options: {
  category?: string;
  isArchived?: boolean;
  limit?: number;
  offset?: number;
} = {}) {
  const query: any = { participants: userId };
  
  if (options.category) {
    query.category = options.category;
  }
  
  if (typeof options.isArchived === 'boolean') {
    query.isArchived = options.isArchived;
  }
  
  return this.find(query)
    .populate('participants', 'name email avatar status')
    .sort({ pinnedAt: -1, 'lastMessage.timestamp': -1 })
    .limit(options.limit || 50)
    .skip(options.offset || 0);
};

// Static method to find conversation by participants
ConversationSchema.statics.findByParticipants = function(participantIds: string[]) {
  return this.findOne({
    participants: { $all: participantIds, $size: participantIds.length },
    type: 'chat',
  });
};

// Static method to find email conversation by thread ID
ConversationSchema.statics.findByEmailThread = function(threadId: string) {
  return this.findOne({
    'metadata.emailThreadId': threadId,
    type: 'email',
  });
};

// Static method to search conversations
ConversationSchema.statics.searchConversations = function(userId: string, query: string) {
  const searchRegex = new RegExp(query, 'i');
  return this.find({
    participants: userId,
    $or: [
      { title: searchRegex },
      { 'metadata.subject': searchRegex },
      { 'lastMessage.content': searchRegex },
    ],
  })
  .populate('participants', 'name email avatar')
  .sort({ 'lastMessage.timestamp': -1 });
};

// Pre-save middleware
ConversationSchema.pre('save', function(next) {
  // Ensure at least 2 participants for chat conversations
  if (this.type === 'chat' && this.participants.length < 2) {
    next(new Error('Chat conversations must have at least 2 participants'));
    return;
  }
  
  // Set title for group conversations if not provided
  if (this.type === 'group' && !this.title) {
    this.title = `Group Chat (${this.participants.length} members)`;
  }
  
  next();
});

// Create and export the Conversation model
let Conversation: Model<IConversation>;

try {
  Conversation = mongoose.model<IConversation>('Conversation');
} catch {
  Conversation = mongoose.model<IConversation>('Conversation', ConversationSchema);
}

export default Conversation;