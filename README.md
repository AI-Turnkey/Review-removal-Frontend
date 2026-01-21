# TurnKey Product Management

A web application for managing products through link submissions and file uploads.

## Features

- Submit Google Sheets URLs for processing
- Upload XLSX files directly
- Integration with n8n webhooks for backend processing
- Beautiful, responsive UI

## Deployment to Railway

### Prerequisites
- A Railway account (sign up at [railway.app](https://railway.app))
- Git installed on your local machine

### Step-by-Step Deployment

1. **Initialize Git Repository** (if not already done)
```bash
   git init
   git add .
   git commit -m "Initial commit"
```

2. **Connect to Railway**
   - Go to [railway.app](https://railway.app)
   - Click "New Project"
   - Select "Deploy from GitHub repo" or "Deploy from local"
   
3. **If deploying from GitHub:**
   - Push your code to GitHub first
   - Link your GitHub account to Railway
   - Select this repository
   - Railway will automatically detect the Node.js project

4. **If deploying from CLI:**
```bash
   # Install Railway CLI
   npm install -g @railway/cli
   
   # Login to Railway
   railway login
   
   # Initialize Railway project
   railway init
   
   # Deploy
   railway up
```

5. **Environment Variables**
   - No environment variables required for basic setup
   - The webhook URL is already configured in the frontend

6. **Access Your App**
   - Railway will provide you with a public URL
   - Your app will be available at: `https://your-app.railway.app`

## Local Development

1. **Install Dependencies**
```bash
   npm install
```

2. **Run the Server**
```bash
   npm start
```

3. **Access Locally**
   - Open your browser to `http://localhost:3000`

## Project Structure
```
railway-project/
├── public/
│   ├── assets/
│   │   └── logo.png
│   └── index.html
├── server.js
├── package.json
├── .gitignore
└── README.md
```

## Configuration

The n8n webhook URL is configured in `public/index.html`:
```javascript
const N8N_WEBHOOK_URL = 'https://turnkeyproductmanagement.app.n8n.cloud/webhook/review-removal';
```

To change this, edit line 474 in `public/index.html`.

## Tech Stack

- **Frontend**: HTML, CSS, JavaScript
- **Backend**: Node.js with Express
- **Hosting**: Railway
- **Integration**: n8n webhooks

## Support

For issues or questions, please contact the TurnKey team.
