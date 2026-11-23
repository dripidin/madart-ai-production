const { readJson, writeJson } = require('./storage');

const NOTIF_FILE = 'notifications.json';

function formatNotificationContent(type, payload = {}) {
  switch (type) {
    case 'form_submission': {
      const who = payload.name || 'Visitor';
      const email = payload.email || 'no-email';
      const country = payload.country && payload.country !== 'XX' ? ` [${payload.country}]` : '';
      return {
        title: `New Inquiry from ${who}${country}`,
        body: `${payload.projectType || 'General Inquiry'} (${email}): ${(payload.message || '').slice(0, 140)}`,
      };
    }
    case 'task_created':
      return {
        title: `Task Created: ${payload.title || 'Untitled Task'}`,
        body: `Priority: ${payload.priority || 'normal'}${payload.dueDate ? ` · Due ${payload.dueDate}` : ''}`,
      };
    case 'task_due':
      return {
        title: `Task Due: ${payload.title || 'Studio Task'}`,
        body: `Scheduled due date: ${payload.dueDate || 'Today'}`,
      };
    case 'calendar_event':
      return {
        title: `Work Scheduled: ${payload.title || 'New Release'}`,
        body: `Publish date: ${payload.publishAt || payload.start || 'Scheduled'}`,
      };
    case 'invoice_created':
      return {
        title: `Invoice ${payload.invoiceNumber || ''} Created`,
        body: `${payload.clientName || 'Client'} · $${Number(payload.amount || 0).toLocaleString()} (${payload.status || 'Draft'})`,
      };
    default:
      return {
        title: payload.title || 'MadeArt Studio Notification',
        body: payload.message || 'Activity recorded in MadeArt Admin.',
      };
  }
}

async function dispatchNotification(type, payload = {}) {
  const { title, body } = formatNotificationContent(type, payload);

  const item = {
    id: `notif_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    type,
    title,
    body,
    metadata: payload,
    read: false,
    createdAt: new Date().toISOString(),
  };

  const list = readJson(NOTIF_FILE, []);
  const arr = Array.isArray(list) ? list : [];
  arr.unshift(item);
  writeJson(NOTIF_FILE, arr.slice(0, 200));

  return item;
}

module.exports = {
  formatNotificationContent,
  dispatchNotification,
};
