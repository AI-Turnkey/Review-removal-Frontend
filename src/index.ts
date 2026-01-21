import express from 'express';
import path from 'path';
import multer from 'multer';
import { config, validateEnv } from './config/env';
import { handleWebhook } from './controllers/webhookController';

import { eventsHandler } from './services/progress';

// Validate environment variables
validateEnv();

const app = express();

// Configure multer for handling file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
});

// Parse JSON and form data
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, '../public')));

// SSE Endpoint for real-time progress
app.get('/api/events', eventsHandler);

// Main webhook endpoint - processes review data
app.post('/api/webhook', upload.single('data'), handleWebhook);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '2.0.0',
  });
});

// Handle all other routes by serving index.html (SPA support)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public', 'index.html'));
});

// Start server
app.listen(config.port, '0.0.0.0', () => {
  console.log('');
  console.log('🚀 ═══════════════════════════════════════════════════');
  console.log('   TurnKey Review Removal Backend');
  console.log('   ═══════════════════════════════════════════════════');
  console.log(`   Server running on port ${config.port}`);
  console.log(`   Access the app at http://localhost:${config.port}`);
  console.log('   ═══════════════════════════════════════════════════');
  console.log('');
});

export default app;
