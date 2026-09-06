const dns = require('dns');
const mongoose = require('mongoose');

// Configure public DNS servers to prevent Windows querySrv ECONNREFUSED issues with Atlas
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {
  // Ignore in serverless or restricted environments
}

const connectDB = async () => {
  // In serverless environments (like Vercel), reuse existing active connection
  if (mongoose.connection.readyState >= 1) {
    return;
  }

  try {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      throw new Error('MONGODB_URI is not defined in environment variables');
    }

    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000,
    });
    console.log(`[MongoDB Atlas] Connected successfully: ${conn.connection.host}/${conn.connection.name}`);
  } catch (error) {
    console.error(`[MongoDB Atlas] Connection error: ${error.message}`);
    // Fallback to local MongoDB only in local development (not on Vercel)
    if (process.env.MONGODB_URI && !process.env.MONGODB_URI.includes('127.0.0.1') && !process.env.VERCEL) {
      console.log('[MongoDB Fallback] Attempting fallback to local MongoDB instance...');
      try {
        const localConn = await mongoose.connect('mongodb://127.0.0.1:27017/food_expense_tracker', {
          serverSelectionTimeoutMS: 3000,
        });
        console.log(`[MongoDB Fallback] Connected to local MongoDB: ${localConn.connection.host}`);
      } catch (localErr) {
        console.error(`[MongoDB Fallback] Local connection also failed: ${localErr.message}`);
      }
    }
  }
};

module.exports = connectDB;
