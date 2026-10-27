import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

export const connectDB = async () => {
  if (!MONGODB_URI) {
    console.error('[DB] MONGODB_URI is not set. Please configure it in your .env file.');
    console.error('[DB] The server will start, but database features will be unavailable.');
    return;
  }

  try {
    const conn = await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`[DB] MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`[DB] MongoDB connection failed: ${error.message}`);
    console.error('[DB] Check your MONGODB_URI and ensure MongoDB is running.');
    // Do not exit — let the server start and report DB errors per request
  }
};

export const isDBConnected = () => mongoose.connection.readyState === 1;
