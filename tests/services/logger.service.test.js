import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { sendToSlack } from '../../src/services/logger.service.js';

describe('sendToSlack', () => {
  const originalEnv = process.env.SLACK_WEBHOOK_URL;
  const originalFetch = global.fetch;
  const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
  const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

  beforeEach(() => {
    jest.clearAllMocks();
    delete process.env.SLACK_WEBHOOK_URL;
  });

  afterEach(() => {
    process.env.SLACK_WEBHOOK_URL = originalEnv;
    global.fetch = originalFetch;
  });

  it('returns early when the webhook is not configured', async () => {
    await sendToSlack({ statusCode: 500 });

    expect(warnSpy).toHaveBeenCalledWith('[Logger] SLACK_WEBHOOK_URL not configured');
    expect(global.fetch).toBe(originalFetch);
  });

  it('posts the formatted payload when the webhook is configured', async () => {
    process.env.SLACK_WEBHOOK_URL = 'https://slack.test/webhook';
    const fetchMock = jest.fn().mockResolvedValue({ ok: true, status: 200 });
    global.fetch = fetchMock;

    await sendToSlack({
      statusCode: 500,
      method: 'POST',
      path: '/api/error',
      message: 'Boom',
      timestamp: '2026-01-01T00:00:00.000Z',
      ip: '127.0.0.1',
      stack: 'stack-trace',
    });

    expect(fetchMock).toHaveBeenCalledWith(
      'https://slack.test/webhook',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    const payload = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(payload.text).toContain('500');
    expect(payload.blocks[1].text.text).toContain('POST /api/error');
    expect(payload.blocks[3].text.text).toContain('stack-trace');
    expect(errorSpy).not.toHaveBeenCalled();
  });

  it('logs when Slack responds with a non-ok status', async () => {
    process.env.SLACK_WEBHOOK_URL = 'https://slack.test/webhook';
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 503 });

    await sendToSlack({
      statusCode: 500,
      method: 'GET',
      path: '/api/error',
      message: 'Boom',
      timestamp: '2026-01-01T00:00:00.000Z',
    });

    expect(errorSpy).toHaveBeenCalledWith('[Logger] Error Slack webhook: 503');
  });

  it('logs fetch failures', async () => {
    process.env.SLACK_WEBHOOK_URL = 'https://slack.test/webhook';
    global.fetch = jest.fn().mockRejectedValue(new Error('network down'));

    await sendToSlack({
      statusCode: 500,
      method: 'GET',
      path: '/api/error',
      message: 'Boom',
      timestamp: '2026-01-01T00:00:00.000Z',
    });

    expect(errorSpy).toHaveBeenCalledWith('[Logger] Error mandando notificación a slack:', 'network down');
  });
});