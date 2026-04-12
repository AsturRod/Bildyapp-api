import { EventEmitter } from 'node:events';

class NotificationService extends EventEmitter {}

const notificationService = new NotificationService();

notificationService.on('userregistered', (user) => {
  console.log(`[event] userregistered -> ${user.email}`);
});

notificationService.on('userverified', (user) => {
  console.log(`[event] userverified -> ${user.email}`);
});

notificationService.on('userinvited', (user) => {
  console.log(`[event] userinvited -> ${user.email}`);
});

notificationService.on('userdeleted', (user) => {
  console.log(`[event] userdeleted -> ${user.email}`);
});

export default notificationService;