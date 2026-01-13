# Remote Access Guide (Single Tunnel)

This guide explains how to share your local FitWizard development environment using **ngrok**.

We configured Vite to **proxy** backend requests, so you only need to run **one** tunnel (Port 8080).

## Prerequisites

1.  **Install ngrok**: `winget install ngrok`
2.  **Authenticate**: Run `ngrok config add-authtoken <YOUR_TOKEN>` (You have already done this).

## Usage

### 1. Start your App Locally
Run your development server as usual:
```bash
npm run dev
```

### 2. Verify settings
Ensure your `.env.local` has an empty API URL, so it uses the local proxy:
```env
VITE_API_URL=
```

### 3. Start the Tunnel
In a **new terminal**, run:
```bash
ngrok http 8080
```

### 4. Share
Copy the **HTTPS URL** (e.g., `https://random-name.ngrok-free.app`) and send it to your tester.

- Open that URL on your phone.
- The app should load.
- Any API calls (login, plans) will be automatically forwarded to your local backend.
