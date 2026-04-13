import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import config from '../config/index.js';
import AppError from '../utils/AppError.js';

export const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return next(AppError.unauthorized('Token de autenticación no proporcionado'));
    }

    const [scheme, token] = authHeader.split(' ');

    if (scheme !== 'Bearer' || !token) {
      return next(AppError.unauthorized('Formato de token no válido'));
    }

    const decoded = jwt.verify(token, config.jwt.accessSecret);

    const user = await User.findById(decoded.id);

    if (!user || user.deleted) {
      return next(AppError.unauthorized('Usuario no autorizado'));
    }

    req.user = user;
    return next();
  } catch (error) {
    return next(error);
  }
};
