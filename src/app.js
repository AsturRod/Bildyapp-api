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
import { Server } from 'socket.io';
import authenticateSocket from './middleware/socket-auth.js';
import { setSocketIO } from './services/socket.service.js';

const app = express();
let io = null;

app.use(helmet());
app.use(rateLimitMiddleware);
app.use(cors());

app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true }));

app.use(sanitizeMiddleware);

app.use('/uploads', express.static('uploads'));

// Swagger with Authorization support
const swaggerOptions = {
  swaggerOptions: {
    persistAuthorization: true,
  },
};
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, swaggerOptions));
app.get('/api-docs.json', (_req, res) => {
  res.json(swaggerSpec);
});

const healthHandler = (_req, res) => {
  const dbState = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';

  return res.status(200).json({
    status: 'ok',
    db: dbState,
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
};

app.get('/health', healthHandler);
app.get('/api/health', healthHandler);

app.get('/api/debug/force-500', (_req, _res, next) => {
  next(new Error('Forced internal server error for test.http'));
});

app.use('/api', routes);

app.use('/{*splat}', (req, _res, next) => {
  next(AppError.notFound(`Ruta ${req.originalUrl} no encontrada`));
});

app.use(errorHandler);

/**
 * Configura Socket.IO con autenticación JWT y rooms por company
 * @param {http.Server} server - Servidor HTTP
 * @returns {Server} Instancia de Socket.IO
 */
export const setupSocketIO = (server) => {
  io = setSocketIO(new Server(server, {
    cors: {
      origin: process.env.CORS_ORIGIN || '*',
      methods: ['GET', 'POST'],
      credentials: true,
    },
  }));

  // Middleware de autenticación Socket.IO
  io.use(authenticateSocket);

  io.on('connection', (socket) => {
    console.log(`[Socket.IO] Cliente conectado: ${socket.id} (usuario: ${socket.userId}, empresa: ${socket.companyId})`);

    // Unir al socket a un room por compañía
    if (socket.companyId) {
      socket.join(`company:${socket.companyId}`);
      console.log(`[Socket.IO] Socket ${socket.id} unido al room company:${socket.companyId}`);
    }

    socket.on('disconnect', () => {
      console.log(`[Socket.IO] Cliente desconectado: ${socket.id}`);
    });
  });

  return io;
};

/**
 * Obtiene la instancia de Socket.IO
 * @returns {Server|null}
 */
export const getSocketIO = () => io;

export default app;