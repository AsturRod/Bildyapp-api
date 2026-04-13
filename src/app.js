import express from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import expressMongoSanitize from '@exortek/express-mongo-sanitize';
import cors from 'cors';
import userRoutes from './routes/user.routes.js';
import { errorHandler } from './middleware/error-handler.js';
import AppError from './utils/AppError.js';

const app = express();

// Seguridad general
app.use(helmet());
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));
app.use(cors());

// Parsers
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true }));

// Sanitización NoSQL
app.use(
  expressMongoSanitize({
    mode: 'auto',
    sanitizeObjects: ['body', 'params', 'query'],
  })
);

// Estáticos
app.use('/uploads', express.static('uploads'));

// Rutas
app.use('/api/user', userRoutes);

// 404
app.use('/{*splat}', (req, res, next) => {
  next(AppError.notFound(`Ruta ${req.originalUrl} no encontrada`));
});

// Errores
app.use(errorHandler);

export default app;