const express = require('express');
const path = require('path');
const multer = require('multer');
const FormData = require('form-data');
const fetch = require('node-fetch');

const app = express();
const PORT = process.env.PORT || 3000;

// n8n webhook URL
const N8N_WEBHOOK_URL = 'https://turnkeyproductmanagement.app.n8n.cloud/webhook/review-removal';

// Configure multer for handling file uploads
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

// Parse JSON and form data
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve static files from the 'public' directory
app.use(express.static('public'));

// Proxy endpoint to forward FormData requests to n8n (bypasses CORS)
app.post('/api/webhook', upload.single('data'), async (req, res) => {
  try {
    // Create new FormData to forward to n8n
    const formData = new FormData();
    
    // Add all text fields
    for (const [key, value] of Object.entries(req.body)) {
      formData.append(key, value);
    }
    
    // Add file if present
    if (req.file) {
      formData.append('data', req.file.buffer, {
        filename: req.file.originalname,
        contentType: req.file.mimetype,
      });
    }
    
    // Forward to n8n
    const response = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      body: formData,
      headers: formData.getHeaders(),
    });
    
    const data = await response.text();
    
    // Try to parse as JSON, otherwise return as text
    try {
      const jsonData = JSON.parse(data);
      res.json(jsonData);
    } catch {
      res.send(data);
    }
  } catch (error) {
    console.error('Webhook proxy error:', error);
    res.status(500).json({ error: 'Failed to forward request to n8n', details: error.message });
  }
});

// Handle all routes by serving index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Access the app at http://localhost:${PORT}`);
});
