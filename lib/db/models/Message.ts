import mongoose, { Schema, Model } from 'mongoose';
import { IMessage } from '@/types';

const MessageSchema = new Schema<IMessage>(
  {
    conversationId: {
      type: Schema.Types.ObjectId,
      ref: 'Conversation',
      required: true,
    },
    senderId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    content: {
      type: String,
      required: true,
      maxlength: [10000, 'Message cannot exceed 10000 characters'],
    },
    type: {
      type: String,
      enum: ['text', 'image', 'file', 'video', 'audio', 'system'],
      default: 'text',
    },
    attachments: [{
      url: {
        type: String,
        required: true,
      },
      type: {
        type: String,
        enum: ['image', 'file', 'video', 'audio'],
        required: true,
      },
      name: {
        type: String,
        required: true,
        maxlength: [255, 'Filename cannot exceed 255 characters'],
      },
      size: {
        type: Number,
        required: true,
        min: [0, 'File size cannot be negative'],
        max: [50 * 1024 * 1024, 'File size cannot exceed 50MB'], // 50MB limit
      },
      mimeType: {
        type: String,
        required: true,
      },
    }],
    status: {
      type: String,
      enum: ['sending', 'sent', 'delivered', 'read', 'failed'],
      default: 'sent',
    },
    readBy: [{
      userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
      readAt: {
        type: Date,
        required: true,
        default: Date.now,
      },
    }],
    replyTo: {
      type: Schema.Types.ObjectId,
      ref: 'Message',
      default: null,
    },
    reactions: [{
      userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
      emoji: {
        type: String,
        required: true,
        maxlength: [10, 'Emoji cannot exceed 10 characters'],
      },
      createdAt: {
        type: Date,
        default: Date.now,
      },
    }],
    editedAt: {
      type: Date,
      default: null,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
    emailMetadata: {
      messageId: String,
      headers: {
        type: Map,
        of: String,
      },
      to: [String],
      cc: [String],
      bcc: [String],
      subject: {
        type: String,
        maxlength: [300, 'Subject cannot exceed 300 characters'],
      },
      inReplyTo: String,
    },
    timestamp: {
      type: Date,
      required: true,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better performance
MessageSchema.index({ conversationId: 1, timestamp: -1 });
MessageSchema.index({ senderId: 1 });
MessageSchema.index({ status: 1 });
MessageSchema.index({ type: 1 });
MessageSchema.index({ deletedAt: 1 });
MessageSchema.index({ 'emailMetadata.messageId': 1 });

// Compound indexes
MessageSchema.index({ conversationId: 1, deletedAt: 1, timestamp: -1 });
MessageSchema.index({ senderId: 1, timestamp: -1 });

// Virtual for checking if message is deleted
MessageSchema.virtual('isDeleted').get(function() {
  return this.deletedAt !== null;
});

// Virtual for checking if message is edited
MessageSchema.virtual('isEdited').get(function() {
  return this.editedAt !== null;
});

// Virtual for getting reaction counts
MessageSchema.virtual('reactionCounts').get(function() {
  const counts: { [emoji: string]: number } = {};
  this.reactions?.forEach(reaction => {
    counts[reaction.emoji] = (counts[reaction.emoji] || 0) + 1;
  });
  return counts;
});

// Instance method to mark as read by user
MessageSchema.methods.markAsReadBy = function(userId: string) {
  const existingRead = this.readBy.find(read => read.userId.toString() === userId);
  if (!existingRead) {
    this.readBy.push({
      userId,
      readAt: new Date(),
    });
    this.status = 'read';
    return this.save();
  }
  return Promise.resolve(this);
};

// Instance method to add reaction
MessageSchema.methods.addReaction = function(userId: string, emoji: string) {
  // Remove existing reaction from this user
  this.reactions = this.reactions?.filter(reaction => 
    reaction.userId.toString() !== userId || reaction.emoji !== emoji
  ) || [];
  
  // Add new reaction
  this.reactions.push({
    userId,
    emoji,
    createdAt: new Date(),
  });
  
  return this.save();
};

// Instance method to remove reaction
MessageSchema.methods.removeReaction = function(userId: string, emoji: string) {
  this.reactions = this.reactions?.filter(reaction => 
    !(reaction.userId.toString() === userId && reaction.emoji === emoji)
  ) || [];
  
  return this.save();
};

// Instance method to edit message content
MessageSchema.methods.editContent = function(newContent: string) {
  this.content = newContent;
  this.editedAt = new Date();
  return this.save();
};

// Instance method to soft delete message
MessageSchema.methods.softDelete = function() {
  this.deletedAt = new Date();
  this.content = 'This message was deleted';
  return this.save();
};

// Static method to find messages for conversation
MessageSchema.statics.findForConversation = function(conversationId: string, options: {
  limit?: number;
  offset?: number;
  before?: Date;
  after?: Date;
} = {}) {
  const query: any = { 
    conversationId,
    deletedAt: null,
  };
  
  if (options.before) {
    query.timestamp = { $lt: options.before };
  }
  
  if (options.after) {
    query.timestamp = { $gt: options.after };
  }
  
  return this.find(query)
    .populate('senderId', 'name email avatar')
    .populate('replyTo', 'content senderId timestamp')
    .sort({ timestamp: -1 })
    .limit(options.limit || 50)
    .skip(options.offset || 0);
};

// Static method to find unread messages for user
MessageSchema.statics.findUnreadForUser = function(userId: string, conversationId?: string) {
  const query: any = {
    senderId: { $ne: userId },
    readBy: { $not: { $elemMatch: { userId } } },
    deletedAt: null,
  };
  
  if (conversationId) {
    query.conversationId = conversationId;
  }
  
  return this.find(query)
    .populate('conversationId', 'title type')
    .populate('senderId', 'name email avatar')
    .sort({ timestamp: -1 });
};

// Static method to search messages
MessageSchema.statics.searchMessages = function(userId: string, query: string, conversationId?: string) {
  const searchRegex = new RegExp(query, 'i');
  const searchQuery: any = {
    content: searchRegex,
    deletedAt: null,
  };
  
  if (conversationId) {
    searchQuery.conversationId = conversationId;
  }
  
  return this.find(searchQuery)
    .populate('conversationId', 'title participants')
    .populate('senderId', 'name email avatar')
    .sort({ timestamp: -1 });
};

// Static method to get message statistics
MessageSchema.statics.getStatistics = function(conversationId: string, timeRange?: { from: Date; to: Date }) {
  const matchStage: any = { 
    conversationId: mongoose.Types.ObjectId(conversationId),
    deletedAt: null,
  };
  
  if (timeRange) {
    matchStage.timestamp = { $gte: timeRange.from, $lte: timeRange.to };
  }
  
  return this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: '$senderId',
        messageCount: { $sum: 1 },
        lastMessage: { $max: '$timestamp' },
        attachmentCount: { $sum: { $size: { $ifNull: ['$attachments', []] } } },
      },
    },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'sender',
      },
    },
    { $unwind: '$sender' },
    {
      $project: {
        senderId: '$_id',
        senderName: '$sender.name',
        messageCount: 1,
        lastMessage: 1,
        attachmentCount: 1,
      },
    },
    { $sort: { messageCount: -1 } },
  ]);
};

// Pre-save middleware
MessageSchema.pre('save', function(next) {
  // Set timestamp if not provided
  if (!this.timestamp) {
    this.timestamp = new Date();
  }
  
  // Validate attachments
  if (this.attachments && this.attachments.length > 0) {
    if (this.type === 'text') {
      this.type = this.attachments[0].type;
    }
  }
  
  next();
});

// Post-save middleware to update conversation
MessageSchema.post('save', async function(doc) {
  try {
    const Conversation = mongoose.model('Conversation');
    await Conversation.findByIdAndUpdate(
      doc.conversationId,
      {
        'lastMessage.content': doc.content,
        'lastMessage.timestamp': doc.timestamp,
        'lastMessage.senderId': doc.senderId,
        'lastMessage.type': doc.type,
      }
    );
  } catch (error) {
    console.error('Error updating conversation last message:', error);
  }
});

// Create and export the Message model
let Message: Model<IMessage>;

try {
  Message = mongoose.model<IMessage>('Message');
} catch {
  Message = mongoose.model<IMessage>('Message', MessageSchema);
}

export default Message;