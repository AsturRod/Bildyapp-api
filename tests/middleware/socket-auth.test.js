import { jest, describe, it, expect, beforeEach } from '@jest/globals';

const verifyMock = jest.fn();
const findByIdMock = jest.fn();

await jest.unstable_mockModule('jsonwebtoken', () => ({
  default: { verify: verifyMock },
}));

await jest.unstable_mockModule('../../src/models/User.js', () => ({
  default: { findById: findByIdMock },
}));

const { default: authenticateSocket } = await import('../../src/middleware/socket-auth.js');

const buildUserQuery = (user) => ({
  select: () => ({
    lean: () => Promise.resolve(user),
  }),
});

describe('authenticateSocket', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.JWT_ACCESS_SECRET = 'test-secret';
  });

  it('rejects sockets without token', async () => {
    const next = jest.fn();
    const socket = { handshake: { auth: {}, headers: {} } };

    await authenticateSocket(socket, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(next.mock.calls[0][0]).toBeInstanceOf(Error);
    expect(next.mock.calls[0][0].message).toBe('Token de autenticación requerido');
  });

  it('accepts token from authorization header and sets the socket user data', async () => {
    const next = jest.fn();
    const socket = {
      handshake: {
        headers: { authorization: 'Bearer socket-token' },
        auth: {},
      },
    };

    verifyMock.mockReturnValue({ id: 'user-1' });
    findByIdMock.mockReturnValue(
      buildUserQuery({
        _id: { toString: () => 'user-1' },
        company: { toString: () => 'company-1' },
        deleted: false,
      }),
    );

    await authenticateSocket(socket, next);

    expect(verifyMock).toHaveBeenCalledWith('socket-token', 'test-secret');
    expect(findByIdMock).toHaveBeenCalledWith('user-1');
    expect(socket.userId).toBe('user-1');
    expect(socket.companyId).toBe('company-1');
    expect(next).toHaveBeenCalledWith();
  });

  it('rejects invalid tokens and deleted users', async () => {
    const invalidNext = jest.fn();
    const invalidSocket = { handshake: { auth: { token: 'bad-token' }, headers: {} } };

    verifyMock.mockImplementation(() => {
      throw new Error('invalid');
    });

    await authenticateSocket(invalidSocket, invalidNext);

    expect(invalidNext).toHaveBeenCalledTimes(1);
    expect(invalidNext.mock.calls[0][0].message).toBe('Token inválido o expirado');

    verifyMock.mockReturnValue({ id: 'user-2' });
    findByIdMock.mockReturnValue(
      buildUserQuery({
        _id: { toString: () => 'user-2' },
        company: null,
        deleted: true,
      }),
    );

    const deletedNext = jest.fn();
    const deletedSocket = { handshake: { auth: { token: 'good-token' }, headers: {} } };

    await authenticateSocket(deletedSocket, deletedNext);

    expect(deletedNext).toHaveBeenCalledTimes(1);
    expect(deletedNext.mock.calls[0][0].message).toBe('Usuario no válido para Socket.IO');
  });
});