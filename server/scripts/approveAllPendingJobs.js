import mongoose from 'mongoose';
import 'dotenv/config';

await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/gradlink');
const result = await mongoose.connection.db.collection('jobs').updateMany(
  { status: 'pending' },
  { $set: { status: 'approved', approvedAt: new Date() } }
);
console.log('[FIX] Jobs approved:', result.modifiedCount);
await mongoose.disconnect();
