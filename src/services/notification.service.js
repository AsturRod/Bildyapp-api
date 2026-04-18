import { EventEmitter } from 'node:events';

class NotificationService extends EventEmitter {}

const notificationService = new NotificationService();

notificationService.on('user:registered', (user) => {
  console.log(`[event] user:registered -> ${user?.email ?? 'unknown'}`);
});

notificationService.on('user:verified', (user) => {
  console.log(`[event] user:verified -> ${user.email}`);
});

notificationService.on('user:invited', (user) => {
  console.log(`[event] user:invited -> ${user.email}`);
});

notificationService.on('user:deleted', (user) => {
  console.log(`[event] user:deleted -> ${user.email}`);
});

export default notificationService;