# Quick Deployment Guide for Railway

## Method 1: Deploy via Railway Dashboard (Easiest)

1. **Create a GitHub Repository**
   - Go to GitHub and create a new repository
   - Upload all the files from this project folder

2. **Connect to Railway**
   - Visit https://railway.app
   - Sign up or log in
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Authorize Railway to access your GitHub
   - Select your repository

3. **Automatic Deployment**
   - Railway will automatically detect it's a Node.js project
   - It will install dependencies and start the server
   - You'll get a public URL like: `https://your-app-name.up.railway.app`

## Method 2: Deploy via Railway CLI

1. **Install Railway CLI**
```bash
   npm install -g @railway/cli
```

2. **Login to Railway**
```bash
   railway login
```

3. **Initialize and Deploy**
```bash
   cd railway-project
   railway init
   railway up
```

4. **Generate Domain**
```bash
   railway domain
```

## What Happens During Deployment

Railway will:
1. Detect the `package.json` file
2. Run `npm install` to install Express
3. Execute `npm start` which runs `node server.js`
4. Serve your app on the provided URL

## Important Files

- **server.js**: Express server that serves static files
- **package.json**: Defines dependencies and start script
- **public/index.html**: Your main application
- **public/assets/logo.png**: Your logo image

## After Deployment

- Your app will be live at the Railway-provided URL
- The n8n webhook is already configured in the code
- Test both the link submission and file upload features

## Troubleshooting

**If deployment fails:**
- Check the Railway logs in the dashboard
- Ensure all files are committed to Git
- Verify Node.js version is >= 18.0.0

**If the logo doesn't show:**
- Check that `logo.png` is in the `public/assets/` folder
- Verify the path in index.html is `/assets/logo.png`

**If forms don't work:**
- Verify the n8n webhook URL is correct
- Check browser console for errors
- Ensure CORS is properly configured on n8n side
