
const sendToSlack = async (errorData) => {
  if (!process.env.SLACK_WEBHOOK_URL) {
    console.warn('[Logger] SLACK_WEBHOOK_URL not configured');
    return;
  }

  try {
    const payload = {
      text: ` API Error (${errorData.statusCode})`,
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `* API Error*\n*Status:* ${errorData.statusCode}\n*Environment:* ${process.env.NODE_ENV || 'development'}`,
          },
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*Route:* \`${errorData.method} ${errorData.path}\`\n*Message:* ${errorData.message}`,
          },
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*Timestamp:* ${errorData.timestamp}\n*IP:* ${errorData.ip || 'N/A'}`,
          },
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `\`\`\`${errorData.stack || 'No stack trace'}\`\`\``,
          },
        },
      ],
    };

    const response = await fetch(process.env.SLACK_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

      if (!response.ok) {
        console.error(`[Logger] Error Slack webhook: ${response.status}`);
    }
  } catch (error) {
    
    console.error('[Logger] Error mandando notificación a slack:', error.message);
  }
};

export { sendToSlack };
