# Hosting on Railway

Follow these steps to host the TurnKey Review Removal Backend on Railway.

## Prerequisites

1.  A [Railway](https://railway.app/) account.
2.  [Railway CLI](https://docs.railway.app/guides/cli) installed (optional but recommended).
3.  Your code pushed to a GitHub repository.

## Deployment Steps

### 1. Create a New Project on Railway
- Go to [Railway Dashboard](https://railway.app/dashboard).
- Click **"New Project"**.
- Select **"Deploy from GitHub repo"**.
- Choose your repository.

### 2. Configure Environment Variables
In the Railway project settings, go to the **Variables** tab and add the following variables from your `.env` file:

| Variable | Description |
| :--- | :--- |
| `PORT` | `3000` (Railway will automatically assign this, but you can set it) |
| `GOOGLE_CLIENT_ID` | Your Google OAuth Client ID |
| `GOOGLE_CLIENT_SECRET` | Your Google OAuth Client Secret |
| `GOOGLE_REDIRECT_URI` | `https://developers.google.com/oauthplayground` |
| `GOOGLE_REFRESH_TOKEN` | Your Google OAuth Refresh Token |
| `GOOGLE_TEMPLATE_SHEET_ID` | `1w14JwdHm5RXM66XdvkRZHO1Wb2494_FtHAE1buEIwgo` |
| `GOOGLE_DRIVE_FOLDER_ID` | `1z3FixDQFCD4Fpt8ifB63ELO9O7z1nMSh` |
| `OPENAI_API_KEY` | Your OpenAI API Key |
| `GMAIL_USER_EMAIL` | `cases@turnkeyproductmanagent.com` |

### 3. Build and Deploy
Railway will automatically detect the `railway.toml` and `Procfile`. It will:
1.  Run `npm install`.
2.  Run `npm run build` (TypeScript compilation).
3.  Start the server using `npm start`.

### 4. Verify Deployment
- Once the deployment is finished, Railway will provide a public URL (e.g., `https://your-project-production.up.railway.app`).
- Visit the URL to see the application.
- Check the **Deployments** tab for logs if anything goes wrong.

## Troubleshooting

- **Health Check Failure:** If the health check fails, ensure the `PORT` variable is correctly handled by the app (it is).
- **Missing Credentials:** Double-check that all environment variables are added to Railway.
- **Gmail API:** Ensure the Gmail API is enabled in your Google Cloud Console for the project.
