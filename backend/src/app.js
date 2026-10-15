import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'node:url';
import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';
import formRoutes from './routes/form.routes.js';
import errorHandler from './middlewares/errorHandler.js';

const app = express();

// Global middlewares
app.use(cors({ origin: process.env.CLIENT_ORIGIN }));
app.use(express.json());

// Routes
app.get('/api/health', (req, res) => res.json({ ok: true }));
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/form', formRoutes);

// 404 for unmatched API routes
app.use('/api', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// In production the frontend build (npm run build --prefix frontend) is served from here too,
// and any other GET returns index.html so the React routes work on reload
if (process.env.NODE_ENV === 'production') {
  const frontendDist = fileURLToPath(new URL('../../frontend/dist', import.meta.url));
  app.use(express.static(frontendDist));
  app.get('/{*path}', (req, res) => res.sendFile('index.html', { root: frontendDist }));
}

// 404 for anything else
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Centralized error handler (must be last)
app.use(errorHandler);

export default app;