module.exports = {
  apps: [
    {
      name: 'error-monitor-dev',
      script: './pm2-alerts.js',
      cwd: '/home/ubuntu/14trees-web-monorepo/apps/api/src/scripts/monitoring',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        LOG_DIRECTORY: '/home/ubuntu/.pm2/logs/14trees-api-dev',
        LOG_FILE_PREFIX: '14trees-api-dev',
        CHECK_INTERVAL: 300000,
        NODE_ENV: 'development'
      },
      out_file: '/home/ubuntu/.pm2/logs/error-monitor-dev.log',
      error_file: '/home/ubuntu/.pm2/logs/error-monitor-dev.log'
    },
    {
      name: 'error-monitor-prod',
      script: './pm2-alerts.js',
      cwd: '/home/ubuntu/14trees-web-monorepo/apps/api/src/scripts/monitoring',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        LOG_DIRECTORY: '/home/ubuntu/.pm2/logs/14trees-api-prod',
        LOG_FILE_PREFIX: '14trees-api-prod',
        CHECK_INTERVAL: 300000,
        NODE_ENV: 'production'
      },
      out_file: '/home/ubuntu/.pm2/logs/error-monitor-prod.log',
      error_file: '/home/ubuntu/.pm2/logs/error-monitor-prod.log'
    }
  ]
};