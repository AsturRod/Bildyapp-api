import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { setSocketIO, getSocketIO, emitToCompany } from '../../src/services/socket.service.js';

describe('socket.service', () => {
  beforeEach(() => {
    setSocketIO(null);
  });

  it('stores and returns the io instance', () => {
    const ioMock = { to: jest.fn() };

    expect(setSocketIO(ioMock)).toBe(ioMock);
    expect(getSocketIO()).toBe(ioMock);
  });

  it('returns false when io or company id is missing', () => {
    expect(emitToCompany(null, 'event', {})).toBe(false);
    expect(emitToCompany('company-1', 'event', {})).toBe(false);
  });

  it('emits the event to the company room', () => {
    const emitMock = jest.fn();
    const ioMock = {
      to: jest.fn().mockReturnValue({ emit: emitMock }),
    };

    setSocketIO(ioMock);

    expect(emitToCompany('company-1', 'updated', { id: 1 })).toBe(true);
    expect(ioMock.to).toHaveBeenCalledWith('company:company-1');
    expect(emitMock).toHaveBeenCalledWith('updated', { id: 1 });
  });
});