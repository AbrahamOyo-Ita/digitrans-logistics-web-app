import { ADMIN_ROLE_IDS } from './roles.js';
import { workspacePath } from './workspace-links.js';

export function notificationHref(notification, user) {
  const role = String(user?.role || '');
  const type = String(notification?.type || '').toLowerCase();
  const title = String(notification?.title || '').toLowerCase();
  const relatedId = String(notification?.related_id || '').trim();
  const admin = ADMIN_ROLE_IDS.includes(role);
  const focus = relatedId ? { focus: relatedId } : {};
  const page = (name, query = focus) => workspacePath(role, name, query);
  switch (type) {
    case 'delivery':
      return page(admin ? 'deliveries' : role === 'rider' ? 'jobs' : 'history');
    case 'assignment':
      return page(admin ? 'deliveries' : role === 'rider' ? 'jobs' : 'history');
    case 'market_run':
      return page('market');
    case 'waybill':
      return page('waybills');
    case 'payment':
      return title.includes('waybill') ? page('waybills') : page('payments');
    case 'finance':
      return page(admin ? 'finance' : role === 'rider' ? 'earnings' : role === 'investor' ? 'withdrawals' : 'payments');
    case 'investment':
      if (title.includes('withdrawal')) return page(admin ? 'investments' : 'withdrawals', admin ? { tab: 'withdrawals', ...focus } : focus);
      if (title.includes('application') || title.includes('payment review')) return page(admin ? 'investments' : 'applications', admin ? { tab: 'applications', ...focus } : focus);
      return page(admin ? 'investments' : 'overview', admin ? { tab: 'opportunities', ...focus } : focus);
    case 'support':
      return page('support', relatedId ? { ticket: relatedId } : {});
    case 'contact_message':
      return admin ? page('contact', focus) : page('notifications', {});
    case 'account':
      if (admin) {
        if (title.includes('student')) return page('students', focus);
        if (title.includes('rider')) return page('riders', focus);
        if (title.includes('vendor')) return page('vendors', focus);
        return page('customers', focus);
      }
      if (role === 'student' && (title.includes('student') || title.includes('document'))) return page('documents', {});
      return page(title.includes('document') ? 'documents' : 'profile', {});
    default:
      return page('notifications', {});
  }
}
