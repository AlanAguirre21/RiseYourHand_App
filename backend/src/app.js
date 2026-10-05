import express from 'express';
import cors from 'cors';
import userRoutes from './routes/user.routes.js';
import errorHandler from './middlewares/errorHandler.js';

const app = express();

// Global middlewares
app.use(cors({ origin: process.env.FRONTEND_ORIGIN }));
app.use(express.json());

// Routes
app.get('/api/health', (req, res) => res.json({ ok: true }));
app.use('/api/users', userRoutes);

// 404 for unmatched routes
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Centralized error handler (must be last)
app.use(errorHandler);

export default app;