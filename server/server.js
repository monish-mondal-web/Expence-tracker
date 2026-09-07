require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

// Route imports
const authRoutes = require('./routes/authRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const budgetRoutes = require('./routes/budgetRoutes');
const expenseRoutes = require('./routes/expenseRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const calendarRoutes = require('./routes/calendarRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const { authenticate } = require('./middleware/auth');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

// Ensure MongoDB connection for serverless invocations
app.use(async (req, res, next) => {
  await connectDB();
  next();
});

// Middleware
app.use(cors());
app.use(express.json());
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'Food Expense Tracker API',
  });
});

// Auth Routes (Public)
app.use('/api/auth', authRoutes);

// Protected/Authenticated Feature Routes
app.use('/api/dashboard', authenticate, dashboardRoutes);
app.use('/api/monthly-budget', authenticate, budgetRoutes);
app.use('/api/expenses', authenticate, expenseRoutes);
app.use('/api/analytics', authenticate, analyticsRoutes);
app.use('/api/calendar', authenticate, calendarRoutes);
app.use('/api/categories', authenticate, categoryRoutes);

// 404 Handler for undefined API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    error: `API route ${req.originalUrl} not found`,
  });
});

// Global Error Handler
app.use(errorHandler);

// Start Server (only in standalone mode, not on Vercel serverless)
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`[Server] Food Expense Tracker API running on port ${PORT}`);
    console.log(`[Server] Environment: ${process.env.NODE_ENV || 'development'}`);
  });
}

// Reload trigger: 2026-09-07T20:47:00
module.exports = app;
