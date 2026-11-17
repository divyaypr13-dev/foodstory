import mongoose from 'mongoose';

export default async function connectDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error(
      'MONGODB_URI is not set. Add your MongoDB Atlas connection string as the secret MONGODB_URI in AI Studio Settings.'
    );
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
    return false;
  }

  try {
    await mongoose.connect(uri);
    console.log('MongoDB connected');
    return true;
  } catch (err) {
    console.error('MongoDB connection failed:', err.message);
    process.exit(1);
  }
}
