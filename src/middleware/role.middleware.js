import AppError from '../utils/AppError.js';

const roleMiddleware = (...allowedRoles) => {
  return (req, _res, next) => {
    if (!req.user) {
      return next(AppError.unauthorized('Usuario no autenticado'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(AppError.forbidden('Rol no autorizado'));
    }

    return next();
  };
};

export const requireAdmin = () => roleMiddleware('admin');
export const requireGuest = () => roleMiddleware('guest');

export default roleMiddleware;