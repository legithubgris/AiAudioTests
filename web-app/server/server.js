const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs-extra');
const winston = require('winston');
require('dotenv').config();

// Import routes
const ttsRoutes = require('./routes/tts');
const fileRoutes = require('./routes/files');

// Create Express app
const app = express();
const PORT = process.env.PORT || 5001;

// Setup Winston logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'tts-service' },
  transports: [
    new winston.transports.File({ filename: path.join(__dirname, 'logs', 'error.log'), level: 'error' }),
    new winston.transports.File({ filename: path.join(__dirname, 'logs', 'combined.log') }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ],
});

// Ensure logs and uploads directories exist
fs.ensureDirSync(path.join(__dirname, 'logs'));
fs.ensureDirSync(path.join(__dirname, 'uploads'));

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Add logger to request object
app.use((req, res, next) => {
  req.logger = logger;
  next();
});

// Routes
app.use('/api/tts', ttsRoutes);
app.use('/api/files', fileRoutes);

// Serve static files from the React app build directory
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/build')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/build/index.html'));
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Clear any cached data on startup
logger.info('Clearing any cached data on service restart');

// Start server
app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
  console.log(`Server running on http://localhost:${PORT}`);
});

module.exports = app;
