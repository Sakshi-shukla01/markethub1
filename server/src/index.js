const http = require('http');
const env = require('./config/env');
const connectDB = require('./config/db');
const app = require('./app');
const initSocket = require('./socket');

async function start() {
  await connectDB();

  const server = http.createServer(app);
  const io = initSocket(server);
  app.set('io', io); // make io available to controllers via req.app.get('io')

  server.listen(env.PORT, () => {
    console.log(`\n  MarketHub API running on http://localhost:${env.PORT}`);
    console.log(`  Mode -> email:${env.isEmailConfigured ? 'smtp' : 'demo'} | uploads:${env.isCloudinaryConfigured ? 'cloudinary' : 'local'} | payments:${env.isStripeConfigured ? 'stripe' : 'mock'} | google:${env.isGoogleConfigured ? 'on' : 'off'}\n`);
  });
}

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
