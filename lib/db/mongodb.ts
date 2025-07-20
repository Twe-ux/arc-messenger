import mongoose from 'mongoose';

type ConnectionObject = {
  isConnected?: number;
};

const connection: ConnectionObject = {};

async function connectDB(): Promise<void> {
  // Check if we have a connection to the database or if it's currently connecting
  if (connection.isConnected) {
    console.log('Already connected to MongoDB');
    return;
  }

  try {
    const MONGODB_URI = process.env.MONGODB_URI;
    
    if (!MONGODB_URI) {
      throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
    }

    // Connect to MongoDB
    const db = await mongoose.connect(MONGODB_URI, {
      dbName: process.env.MONGODB_DB_NAME || 'arc-messenger',
      bufferCommands: false,
    });

    connection.isConnected = db.connections[0].readyState;

    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    throw new Error('Failed to connect to MongoDB');
  }
}

export default connectDB;