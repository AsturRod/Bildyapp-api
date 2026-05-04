import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import routes from './routes/index.js';
import { errorHandler } from './middleware/error-handler.js';
import rateLimitMiddleware from './middleware/rate-limit.js';
import sanitizeMiddleware from './middleware/sanitize.js';
import { swaggerUi, swaggerSpec } from './config/swagger.js';
import AppError from './utils/AppError.js';
import mongoose from 'mongoose';

const app = express();

app.use(helmet());
app.use(rateLimitMiddleware);
app.use(cors());

app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true }));

app.use(sanitizeMiddleware);

app.use('/uploads', express.static('uploads'));

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get('/api-docs.json', (_req, res) => {
  res.json(swaggerSpec);
});

app.get('/health', (_req, res) => {
  const dbState = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';

  return res.status(200).json({
    status: 'ok',
    db: dbState,
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

app.use('/api', routes);

app.use('/{*splat}', (req, _res, next) => {
  next(AppError.notFound(`Ruta ${req.originalUrl} no encontrada`));
});

app.use(errorHandler);

export default app;