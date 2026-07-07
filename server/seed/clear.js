import mongoose from 'mongoose';
import 'dotenv/config';

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/flowgen';

await mongoose.connect(uri);
await mongoose.connection.dropDatabase();
console.log('✅ Database cleared');
await mongoose.disconnect();
