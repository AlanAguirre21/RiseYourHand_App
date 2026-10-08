// pm2 configuration: runs the backend (API) and the frontend (production build).
//
// First deploy, from the project root:
//   1. Create backend/.env from backend/.env.example (PORT must be 3000: the frontend proxies /api there)
//   2. npm ci --prefix backend --omit=dev
//   3. npm ci --prefix frontend
//   4. npm run build --prefix frontend
//   5. pm2 start ecosystem.config.cjs
//   6. pm2 save              (and "pm2 startup" once, so the apps come back after a reboot)
//
// Update: pull the changes, repeat steps 2 to 4 and run "pm2 reload ecosystem.config.cjs".
// The app is then served at http://<server>:5173

const path = require('node:path');

const FRONTEND_PORT = 5173;

module.exports = {
  apps: [
    {
      name: 'levantamano-backend',
      cwd: path.join(__dirname, 'backend'),   
      script: 'src/server.js',
      env: { NODE_ENV: 'production' },
      max_memory_restart: '300M',
      time: true,
    },
    {
      name: 'levantamano-frontend',
      cwd: path.join(__dirname, 'frontend'),
      script: 'node_modules/vite/bin/vite.js',
      args: `preview --host 0.0.0.0 --port ${FRONTEND_PORT} --strictPort`,
      env: { NODE_ENV: 'production' },
      max_memory_restart: '300M',
      time: true,
    },
  ],
};
