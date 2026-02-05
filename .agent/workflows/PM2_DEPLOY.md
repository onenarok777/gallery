---
description: How to run the Next.js application with PM2
---

This workflow details how to configure and run your Next.js application using PM2, a production process manager for Node.js.

## Prerequisites

Ensure you have Node.js and NPM installed on your server (VPS).

## 1. Install PM2 Globally

If you haven't installed PM2 yet, run:

```bash
npm install -g pm2
```

## 2. Build the Application

Before running in production, you must build the Next.js app:

```bash
npm run build
```

## 3. Create/Configure PM2 Ecosystem File

Create a file named `ecosystem.config.js` in your project root with the following content. This configuration manages environment variables and script execution.

```javascript
module.exports = {
  apps: [
    {
      name: "my-gallery",
      script: "npm",
      args: "start",
      env: {
        NODE_ENV: "production",
        // Add other environment variables here if not using a .env file
        // PORT: 3000
      },
      // Optional: Limit memory usage (restart if exceeds 1GB)
      // max_memory_restart: "1G"
    },
  ],
};
```

## 4. Start the Application

Start the app using the configuration file:

```bash
pm2 start ecosystem.config.js
```

## 5. Manage the Process

Common PM2 commands:

- **Check status:** `pm2 status`
- **View logs:** `pm2 logs my-gallery`
- **Restart:** `pm2 restart my-gallery`
- **Stop:** `pm2 stop my-gallery`

## 6. Setup Startup Hook (Optional but Recommended)

To ensure your app restarts automatically after a server reboot:

```bash
pm2 startup
```

(Copy and paste the command it outputs)

Then save the current process list:

```bash
pm2 save
```
