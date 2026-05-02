import rateLimit from 'express-rate-limit';

const rateLimitMiddleware = rateLimit({
	windowMs: 15 * 60 * 1000,
	max: 100,
	standardHeaders: true,
	legacyHeaders: false,
	message: {
		status: 'error',
		message: 'Demasiadas peticiones, inténtalo de nuevo más tarde',
	},
});

export default rateLimitMiddleware;
