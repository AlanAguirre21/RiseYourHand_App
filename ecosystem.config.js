// pm2 configuration: runs the backend (API) and the frontend (production build).
//
// First deploy, from the project root:
//   1. Create backend/.env from backend/.env.example (PORT must be 3000: the frontend proxies /api there)
//   2. Write in SERVER_NAMES, below, the names the users will type to open the app
//   3. npm ci --prefix backend --omit=dev
//   4. npm ci --prefix frontend
//   5. npm run build --prefix frontend
//   6. pm2 start ecosystem.config.js
//   7. pm2 save              (and "pm2 startup" once, so the apps come back after a reboot)
//
// Update: pull the changes, repeat steps 3 to 5 and run "pm2 reload ecosystem.config.js".
// The app is then served at http://<server>:5173. Only that port has to be open to the users:
// the browser never calls the backend (port 3000) directly.

const path = require('node:path');

const FRONTEND_PORT = 5173;

// Names of the server the app is opened with, e.g. ['mxplanta01', 'levantamano.zf.local'].
// Opening it by IP address or as localhost always works; any other name is rejected unless it is here
const SERVER_NAMES = [];

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
      env: { NODE_ENV: 'production', ALLOWED_HOSTS: SERVER_NAMES.join(',') },
      max_memory_restart: '300M',
      time: true,
    },
  ],
};
