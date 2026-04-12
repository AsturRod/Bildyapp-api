const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let status = err.status || 'error';
  let message = err.message || 'Error interno del servidor';
  let errors = err.errors || null;

  if (err.code === 11000) {
    statusCode = 409;
    status = 'fail';
    const field = Object.keys(err.keyValue || {})[0];
    message = field
      ? `El valor del campo "${field}" ya existe`
      : 'Conflicto por clave duplicada';
  }

  if (err.name === 'CastError') {
    statusCode = 400;
    status = 'fail';
    message = `Valor no válido para el campo "${err.path}"`;
  }

  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    status = 'fail';
    message = 'Token no válido';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    status = 'fail';
    message = 'Token expirado';
  }

  return res.status(statusCode).json({
    status,
    message,
    ...(errors && { errors }),
  });
};

export default errorHandler;