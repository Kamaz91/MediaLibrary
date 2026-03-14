module.exports = {
  apps: [
    {
      name: 'galeria-api',
      script: 'apps/api/build/index.js',
      cwd: __dirname,
      instances: 1,
      autorestart: true,
      watch: false,
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
};
