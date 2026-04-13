class AppError extends Error {
    constructor(message, statusCode = 500, errors = null) {
        super(message);

        this.name = 'AppError';
        this.statusCode = statusCode;
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
        this.errors = errors;

        Error.captureStackTrace(this, this.constructor);
    }

    static badRequest(message = 'Solicitud no válida', errors = null) {
        return new AppError(message, 400, errors);
    }

    static unauthorized(message = 'No autorizado') {
        return new AppError(message, 401);
    }

    static forbidden(message = 'Prohibido') {
        return new AppError(message, 403);
    }

    static notFound(message = 'No encontrado') {
        return new AppError(message, 404);
    }

    static conflict(message = 'Conflicto') {
        return new AppError(message, 409);
    }

    static tooManyRequests(message = 'Demasiadas solicitudes') {
        return new AppError(message, 429);
    }

    static internal(message = 'Error interno del servidor') {
        return new AppError(message, 500);
    }
}

export default AppError;
    