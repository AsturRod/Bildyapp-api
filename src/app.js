import express from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import expressMongoSanitize from '@exortek/express-mongo-sanitize';
import cors from 'cors';
import userRoutes from './routes/user.routes.js';
import { errorHandler } from './middleware/error-handler.js';
import AppError from './utils/AppError.js';

const app = express();

app.use(helmet());
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));
app.use(cors());

app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true }));

app.use(
  expressMongoSanitize({
    mode: 'auto',
    sanitizeObjects: ['body', 'params', 'query'],
  })
);

app.use('/uploads', express.static('uploads'));

app.use('/api/user', userRoutes);
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

app.use('/{*splat}', (req, _res, next) => {
  next(AppError.notFound(`Ruta ${req.originalUrl} no encontrada`));
});

app.use(errorHandler);

export default app;