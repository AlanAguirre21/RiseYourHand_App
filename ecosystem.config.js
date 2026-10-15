const path = require('node:path');

module.exports = {
  apps: [
    {
      name: 'manitas-data-capture',
      cwd: path.join(__dirname, 'backend'),
      script: 'src/server.js',
      env: { NODE_ENV: 'production' },
      max_memory_restart: '300M',
      time: true,
    },
  ],
};
