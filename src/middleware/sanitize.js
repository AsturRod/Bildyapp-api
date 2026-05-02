import expressMongoSanitize from '@exortek/express-mongo-sanitize';

const sanitizeMiddleware = expressMongoSanitize({
	mode: 'auto',
	sanitizeObjects: ['body', 'params', 'query'],
});

export default sanitizeMiddleware;
