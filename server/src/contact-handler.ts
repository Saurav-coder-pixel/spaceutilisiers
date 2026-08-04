/* ===================================================================
   SPACE UTILIZERS — Contact API Handler (Reusable Core Logic)
   - Request validation
   - Input sanitization
   - Email dispatch
   - Works in Express, Vercel Serverless, Netlify Functions
   =================================================================== */

import * as validator from 'validator';
import { sendContactEmails, ContactSubmission } from './email';

export interface ContactRequest {
  name?: string;
  email?: string;
  phone?: string;
  subject?: string;
  message?: string;
  website?: string;
}

export interface ValidationError {
  field: string;
  message: string;
}

export interface HandlerResult {
  statusCode: number;
  body: {
    success: boolean;
    message: string;
    errors?: ValidationError[];
    adminNotified?: boolean;
    userConfirmed?: boolean;
  };
}

const MAX_LEN = {
  name: 120,
  email: 254,
  phone: 30,
  subject: 150,
  message: 5000,
};

function formatTimestamp(): string {
  return new Date().toLocaleString('en-IN', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZone: 'Asia/Kolkata',
  });
}

function getClientIp(reqLike: { headers?: Record<string, string | string[] | undefined>; ip?: string }): string {
  const headers = reqLike.headers || {};
  const forwardedFor = headers['x-forwarded-for'];
  if (typeof forwardedFor === 'string') {
    const first = forwardedFor.split(',')[0];
    if (first) return first.trim();
  }
  const realIp = headers['x-real-ip'];
  if (typeof realIp === 'string' && realIp) return realIp.trim();
  return reqLike.ip || '';
}

function getWebsiteUrl(reqLike: { headers?: Record<string, string | string[] | undefined>; protocol?: string }): string {
  const headers = reqLike.headers || {};
  const host = typeof headers.host === 'string' ? headers.host : '';
  const proto = typeof headers['x-forwarded-proto'] === 'string'
    ? headers['x-forwarded-proto']
    : (reqLike.protocol || 'https');
  return host ? `${proto}://${host}` : process.env.WEBSITE_URL || '';
}

function sanitizeString(input: unknown, maxLen: number): string {
  if (typeof input !== 'string') return '';
  let s = input.trim();
  s = s.replace(/\0/g, '');
  if (s.length > maxLen) s = s.slice(0, maxLen);
  return s;
}

export function validateContactRequest(body: ContactRequest): ValidationError[] {
  const errors: ValidationError[] = [];

  const name = sanitizeString(body.name, MAX_LEN.name);
  if (!name) {
    errors.push({ field: 'name', message: 'Full name is required.' });
  } else if (name.length < 2) {
    errors.push({ field: 'name', message: 'Name must be at least 2 characters.' });
  }

  const email = sanitizeString(body.email, MAX_LEN.email);
  if (!email) {
    errors.push({ field: 'email', message: 'Email address is required.' });
  } else if (!validator.isEmail(email)) {
    errors.push({ field: 'email', message: 'Please enter a valid email address.' });
  }

  const phone = sanitizeString(body.phone, MAX_LEN.phone);
  if (!phone) {
    errors.push({ field: 'phone', message: 'Phone number is required.' });
  } else if (!/^[+]?[\d\s\-()]{8,30}$/.test(phone)) {
    errors.push({ field: 'phone', message: 'Please enter a valid phone number (8-30 digits, +, -, (), spaces allowed).' });
  }

  const subject = sanitizeString(body.subject, MAX_LEN.subject);
  if (!subject) {
    errors.push({ field: 'subject', message: 'Subject / Query type is required.' });
  } else if (subject.length < 3) {
    errors.push({ field: 'subject', message: 'Subject must be at least 3 characters.' });
  }

  const message = sanitizeString(body.message, MAX_LEN.message);
  if (!message) {
    errors.push({ field: 'message', message: 'Message is required.' });
  } else if (message.length < 10) {
    errors.push({ field: 'message', message: 'Message must be at least 10 characters.' });
  }

  return errors;
}

export async function handleContactRequest(
  body: ContactRequest,
  reqMeta: { headers?: Record<string, string | string[] | undefined>; ip?: string; protocol?: string }
): Promise<HandlerResult> {
  const honeypot = typeof body.website === 'string' ? body.website.trim() : '';
  if (honeypot) {
    console.warn('[API] Honeypot triggered — request silently dropped.');
    return {
      statusCode: 200,
      body: {
        success: true,
        message: 'Thank you for contacting us. We have received your message and will get back to you shortly.',
      },
    };
  }

  const validationErrors = validateContactRequest(body);
  if (validationErrors.length > 0) {
    return {
      statusCode: 400,
      body: {
        success: false,
        message: 'Please fix the errors in the form and try again.',
        errors: validationErrors,
      },
    };
  }

  const submission: ContactSubmission = {
    name: sanitizeString(body.name, MAX_LEN.name),
    email: sanitizeString(body.email, MAX_LEN.email).toLowerCase(),
    phone: sanitizeString(body.phone, MAX_LEN.phone),
    subject: sanitizeString(body.subject, MAX_LEN.subject),
    message: sanitizeString(body.message, MAX_LEN.message),
    timestamp: formatTimestamp(),
    ip: getClientIp(reqMeta),
    websiteUrl: getWebsiteUrl(reqMeta),
  };

  console.log(`[API] New contact submission: ${submission.name} <${submission.email}> — ${submission.subject}`);

  try {
    const { admin, user } = await sendContactEmails(submission);

    if (!admin && !user) {
      throw new Error('Both admin and user emails failed to send.');
    }

    return {
      statusCode: 200,
      body: {
        success: true,
        message: 'Thank you for contacting us. We have received your message and will get back to you shortly.',
        adminNotified: admin,
        userConfirmed: user,
      },
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[API] Fatal error sending contact emails:', msg);
    return {
      statusCode: 500,
      body: {
        success: false,
        message: 'We encountered an issue while sending your message. Please try again in a few moments or email us directly.',
      },
    };
  }
}
