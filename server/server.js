import 'dotenv/config';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mongoose from 'mongoose';
import connectDB from './db.js';
import apiRoutes from './routes/index.js';
import { initSockets } from './sockets/index.js';
import { notFound, errorHandler } from './middleware/errorMiddleware.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

async function startServer() {
  const dbConnected = await connectDB();

  const app = express();
  const server = http.createServer(app);

  initSockets(server);

  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
    })
  );

  app.use(
    cors({
      origin: process.env.CLIENT_URL || true,
      credentials: true,
    })
  );

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Return clean 503 if MongoDB secret has not been added yet in dev
  app.use('/api', (req, res, next) => {
    if (req.path === '/health') return next();
    if (!dbConnected && mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        message:
          'Database not connected. Add your MongoDB Atlas connection string as the secret MONGODB_URI in AI Studio Settings.',
      });
    }
    next();
  });

  app.use('/api', apiRoutes);
  app.use(notFound);

  if (process.env.NODE_ENV === 'production') {
    const distDir = path.join(rootDir, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.use(errorHandler);

  const PORT = Number(process.env.PORT) || 3000;
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`FoodStory server running on port ${PORT}`);
  });
}

startServer();
