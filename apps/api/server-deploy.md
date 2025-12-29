## DEV ENV
cd /home/ubuntu/14trees-api-dev/apps/api
pm2 start /home/ubuntu/14trees-api-dev/apps/api/dist/apps/api/src/server.js \
  --name 14trees-api-dev \
  --output /home/ubuntu/.pm2/logs/14trees-api-dev/14trees-api-dev-combined.log \
  --error /home/ubuntu/.pm2/logs/14trees-api-dev/14trees-api-dev-combined.log

## PROD ENV
cd /home/ubuntu/14trees-web-monorepo/apps/api
pm2 start /home/ubuntu/14trees-web-monorepo/apps/api/dist/apps/api/src/server.js \
  --name 14trees-api \
  --output /home/ubuntu/.pm2/logs/14trees-api-prod/14trees-api-prod-combined.log \
  --error /home/ubuntu/.pm2/logs/14trees-api-prod/14trees-api-prod-combined.log

## Error monitor DEV ENV
pm2 start ecosystem.config.js --only error-monitor-dev

## Error monitor PROD ENV
pm2 start ecosystem.config.js --only error-monitor-prod
