import db from './db.js';
import { notify } from './auth.js';
import { isEmailConfigured, sendEmail } from './email.js';
import { createContactEnquiryEmailTemplate, createSupportRequestEmailTemplate } from './email-templates.js';
import { logger } from './logger.js';
import { SITE } from '../shared/site.js';

export function resolvePublicOrigin() {
  const raw = String(process.env.APP_URL || SITE.canonicalOrigin).trim();
  try {
    const parsed = new URL(raw);
    if (['http:', 'https:'].includes(parsed.protocol)) return parsed.origin;
  } catch {}
  return SITE.canonicalOrigin;
}

export async function resolveContactRecipientEmail() {
  const envAddress = String(process.env.CONTACT_RECIPIENT_EMAIL || '').trim();
  if (envAddress) return envAddress;
  try {
    const row = await db.prepare("SELECT value FROM public.system_settings WHERE key='public_email'").get();
    const settingEmail = String(row?.value || '').trim();
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(settingEmail)) return settingEmail;
  } catch {}
  return SITE.email;
}

export async function notifyPermissionUsers(permissionKey, title, message, type = 'info', relatedId = null) {
  const rows = await db.prepare(`SELECT DISTINCT u.id FROM public.users u
    LEFT JOIN public.role_permissions rp ON rp.role_id=u.role
    LEFT JOIN public.permissions p ON p.id=rp.permission_id
    WHERE u.status='active' AND (u.role='super_admin' OR p.key=?)`).all(permissionKey);
  await Promise.all(rows.map((row) => notify(row.id, title, message, type, relatedId)));
  return rows.length;
}

export async function dispatchContactEnquiryNotification({ enquiryId, name, email, phone, category, message, requestId }) {
  try {
    await notifyPermissionUsers(
      'support.manage',
      `New enquiry · ${category || 'General'}`,
      `${name} (${email}) sent a message from the website contact page.`,
      'contact_message',
      enquiryId,
    );
  } catch (error) {
    logger.error('contact.admin_notification_failed', { requestId, enquiryId, error });
  }

  if (!isEmailConfigured()) return false;
  try {
    const recipient = await resolveContactRecipientEmail();
    const template = createContactEnquiryEmailTemplate({
      enquiryId,
      name,
      email,
      phone,
      category,
      message,
      baseUrl: resolvePublicOrigin(),
    });
    await sendEmail({
      to: recipient,
      replyTo: email,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });
    return true;
  } catch (error) {
    logger.error('contact.enquiry_email_failed', { requestId, enquiryId, error });
    return false;
  }
}

export async function dispatchSupportTicketNotification({
  ticketId,
  reference,
  requesterName,
  requesterEmail,
  requesterRole,
  category,
  description,
  relatedSummary,
  isReply = false,
  requestId,
}) {
  const title = isReply ? `Support reply · ${reference}` : `New support ticket · ${reference}`;
  const note = isReply
    ? `${requesterName || 'Customer'} replied on ${reference}.`
    : `${requesterName || 'Customer'} opened a ${category || 'general'} support ticket.`;
  try {
    await notifyPermissionUsers('support.manage', title, note, 'support', ticketId);
  } catch (error) {
    logger.error('support.admin_notification_failed', { requestId, ticketId, error });
  }

  if (!isEmailConfigured()) return false;
  try {
    const recipient = await resolveContactRecipientEmail();
    const template = createSupportRequestEmailTemplate({
      ticketId,
      reference,
      requesterName,
      requesterEmail,
      requesterRole,
      category,
      description,
      relatedSummary,
      isReply,
      baseUrl: resolvePublicOrigin(),
    });
    const replyTo = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(requesterEmail || '').trim())
      ? String(requesterEmail).trim().toLowerCase()
      : undefined;
    await sendEmail({
      to: recipient,
      ...(replyTo ? { replyTo } : {}),
      subject: template.subject,
      html: template.html,
      text: template.text,
    });
    return true;
  } catch (error) {
    logger.error('support.email_failed', { requestId, ticketId, error });
    return false;
  }
}
