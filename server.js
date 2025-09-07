const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');

const app = express();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

app.use(cors());
app.use(express.json());

// Add logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] Received ${req.method} request to ${req.url}`);
  console.log('Headers:', req.headers);
  next();
});

// Import and use the convert routes
const convertRoutes = require('./api/convert');
app.use('/api/convert', (req, res, next) => {
  upload.single('image')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      console.error('Multer error:', err);
      return res.status(400).json({ error: 'File upload error', details: err.message });
    } else if (err) {
      console.error('Unknown upload error:', err);
      return res.status(500).json({ error: 'File upload failed', details: err.message });
    }

    if (!req.file) {
      console.error('No file uploaded');
      return res.status(400).json({ error: 'No file uploaded' });
    }

    console.log('File received:', req.file.originalname);
    console.log('File size:', req.file.size, 'bytes');
    console.log('File buffer:', req.file.buffer.length, 'bytes');
    next();
  });
}, convertRoutes);

// Health check route
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    message: 'Express backend server is running',
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Express server error:', err);
  res.status(500).json({ error: 'Internal server error', details: err.message, stack: err.stack });
});

// Use port 3001 to avoid conflicts with Next.js dev server (port 3000)
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Express backend server is running on port ${PORT}`);
  console.log(`Health check available at: http://localhost:${PORT}/health`);
  console.log(`API endpoint available at: http://localhost:${PORT}/api/convert`);
});