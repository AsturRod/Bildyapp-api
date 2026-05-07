import { jest, describe, it, expect, beforeEach } from '@jest/globals';

const sendToSlackMock = jest.fn();

await jest.unstable_mockModule('../../src/services/logger.service.js', () => ({
  sendToSlack: sendToSlackMock,
}));

const { errorHandler } = await import('../../src/middleware/error-handler.js');

const buildRes = () => ({
  status: jest.fn().mockReturnThis(),
  json: jest.fn(),
});

describe('errorHandler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('sends server errors to Slack and returns a 500 response', () => {
    const req = { method: 'GET', path: '/api/test', ip: '127.0.0.1' };
    const res = buildRes();
    const err = new Error('Boom');

    errorHandler(err, req, res, jest.fn());

    expect(sendToSlackMock).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 500,
        message: 'Boom',
        method: 'GET',
        path: '/api/test',
        ip: '127.0.0.1',
      }),
    );
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      status: 'error',
      message: 'Boom',
    });
  });

  it('formats duplicate key errors and preserves extra validation errors', () => {
    const req = { method: 'POST', path: '/api/user', ip: '127.0.0.1' };
    const res = buildRes();

    errorHandler(
      {
        code: 11000,
        keyValue: { email: 'taken@bildyapp.test' },
        errors: { email: 'duplicado' },
      },
      req,
      res,
      jest.fn(),
    );

    expect(sendToSlackMock).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({
      status: 'fail',
      message: 'El valor del campo "email" ya existe',
      errors: { email: 'duplicado' },
    });
  });

  it('maps cast and token errors to the expected status codes', () => {
    const req = { method: 'GET', path: '/api/item/invalid', ip: '127.0.0.1' };

    const castRes = buildRes();
    errorHandler({ name: 'CastError', path: '_id' }, req, castRes, jest.fn());
    expect(castRes.status).toHaveBeenCalledWith(400);
    expect(castRes.json).toHaveBeenCalledWith({
      status: 'fail',
      message: 'Valor no válido para el campo "_id"',
    });

    const jwtRes = buildRes();
    errorHandler({ name: 'JsonWebTokenError' }, req, jwtRes, jest.fn());
    expect(jwtRes.status).toHaveBeenCalledWith(401);
    expect(jwtRes.json).toHaveBeenCalledWith({
      status: 'fail',
      message: 'Token no válido',
    });

    const expiredRes = buildRes();
    errorHandler({ name: 'TokenExpiredError' }, req, expiredRes, jest.fn());
    expect(expiredRes.status).toHaveBeenCalledWith(401);
    expect(expiredRes.json).toHaveBeenCalledWith({
      status: 'fail',
      message: 'Token expirado',
    });
  });
});