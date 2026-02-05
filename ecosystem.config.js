module.exports = {
  apps: [
    {
      name: "gallery-app",
      script: "npm",
      args: "start",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "800M", // Fail-safe restart if memory leaks
      env: {
        NODE_ENV: "production",
      },
    },
  ],
};
