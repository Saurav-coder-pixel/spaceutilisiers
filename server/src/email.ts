/* ===================================================================
   SPACE UTILIZERS — Core Email Module
   Handles:
   - Admin notification email (new contact form submission)
   - User confirmation email (auto-reply thank-you)
   - Supports Nodemailer (SMTP), Resend API, or SendGrid API
   =================================================================== */

import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';

export interface ContactSubmission {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  timestamp: string;
  ip?: string;
  websiteUrl?: string;
}

export interface EmailProviderConfig {
  provider: 'smtp' | 'resend' | 'sendgrid';
}

const COMPANY_NAME = process.env.COMPANY_NAME || 'Space Utilisers';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'sura767848@gmail.com';
const REPLY_TO_EMAIL = process.env.REPLY_TO_EMAIL || ADMIN_EMAIL;
const FROM_EMAIL = process.env.FROM_EMAIL || `no-reply@spaceutilizers.com`;
const FROM_NAME = process.env.FROM_NAME || COMPANY_NAME;
const WEBSITE_URL = process.env.WEBSITE_URL || 'https://spaceutilizers.com';

let transporter: Transporter | null = null;

function getTransporter(): Transporter {
  if (transporter) return transporter;

  const provider: string = process.env.EMAIL_PROVIDER || 'smtp';

  if (provider === 'resend') {
    transporter = nodemailer.createTransport({
      host: 'smtp.resend.com',
      port: 465,
      secure: true,
      auth: {
        user: 'resend',
        pass: process.env.RESEND_API_KEY || '',
      },
    });
    return transporter;
  }

  if (provider === 'sendgrid') {
    transporter = nodemailer.createTransport({
      host: 'smtp.sendgrid.net',
      port: 465,
      secure: true,
      auth: {
        user: 'apikey',
        pass: process.env.SENDGRID_API_KEY || '',
      },
    });
    return transporter;
  }

  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || '',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER || '',
      pass: process.env.SMTP_PASS || '',
    },
  });

  return transporter;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function buildAdminEmail(data: ContactSubmission): { subject: string; text: string; html: string } {
  const subject = `New Contact Form Submission – ${data.name}`;

  const text = `
New Contact Form Submission
═══════════════════════════════════════════

Full Name: ${data.name}
Email Address: ${data.email}
Phone Number: ${data.phone}
Subject / Query Type: ${data.subject}

Message:
${data.message}

───────────────────────────────────────────
Date & Time: ${data.timestamp}
Website URL: ${data.websiteUrl || WEBSITE_URL}
IP Address: ${data.ip || 'N/A'}
═══════════════════════════════════════════
`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; background: #f5f0e8; padding: 24px; color: #1a1a1a; }
    .container { max-width: 620px; margin: 0 auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.06); }
    .header { background: linear-gradient(135deg, #14171a 0%, #252a30 100%); padding: 28px 32px; }
    .header h1 { margin: 0; color: #d4a25c; font-family: Georgia, serif; font-size: 22px; font-weight: 600; }
    .header p { margin: 6px 0 0; color: #b0ada6; font-size: 13px; }
    .body { padding: 28px 32px; }
    .label { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; color: #7a7770; margin-bottom: 4px; }
    .value { font-size: 15px; color: #1a1a1a; margin-bottom: 18px; line-height: 1.5; word-break: break-word; }
    .value a { color: #c4923e; }
    .divider { height: 1px; background: #eee6d8; margin: 22px 0; }
    .message-box { background: #faf8f5; border-left: 3px solid #d4a25c; padding: 16px 18px; border-radius: 0 4px 4px 0; white-space: pre-wrap; line-height: 1.6; color: #333; }
    .meta { font-size: 12px; color: #8a8680; line-height: 1.8; }
    .footer { background: #14171a; padding: 18px 32px; text-align: center; font-size: 12px; color: #7a7770; }
    .accent { color: #d4a25c; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>New Contact Inquiry</h1>
      <p>A visitor has submitted a message through the website</p>
    </div>
    <div class="body">
      <div class="label">Full Name</div>
      <div class="value"><strong>${escapeHtml(data.name)}</strong></div>

      <div class="label">Email Address</div>
      <div class="value"><a href="mailto:${escapeHtml(data.email)}">${escapeHtml(data.email)}</a></div>

      <div class="label">Phone Number</div>
      <div class="value">${escapeHtml(data.phone)}</div>

      <div class="label">Subject / Query Type</div>
      <div class="value accent"><strong>${escapeHtml(data.subject)}</strong></div>

      <div class="divider"></div>

      <div class="label">Message</div>
      <div class="message-box">${escapeHtml(data.message)}</div>

      <div class="divider"></div>

      <div class="meta">
        <div><strong>Date &amp; Time:</strong> ${escapeHtml(data.timestamp)}</div>
        <div><strong>Website:</strong> ${escapeHtml(data.websiteUrl || WEBSITE_URL)}</div>
        <div><strong>IP Address:</strong> ${escapeHtml(data.ip || 'N/A')}</div>
      </div>
    </div>
    <div class="footer">
      This email was sent by the <span class="accent">${escapeHtml(COMPANY_NAME)}</span> contact form system.
    </div>
  </div>
</body>
</html>`;

  return { subject, text, html };
}

function buildUserConfirmationEmail(data: ContactSubmission): { subject: string; text: string; html: string } {
  const subject = `Thank You for Contacting ${COMPANY_NAME}`;

  const text = `
Dear ${data.name},

Thank you for reaching out to ${COMPANY_NAME}. We have received your message and our team is reviewing your inquiry.

Our design team will get back to you within 24 hours (Monday – Saturday) to discuss your project in detail.

Summary of your submission:
  Subject: ${data.subject}
  Date: ${data.timestamp}

If you have any urgent questions in the meantime, please feel free to call us at +91 98715 43683 or reply to this email.

Warm regards,
The ${COMPANY_NAME} Team
${WEBSITE_URL}
`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; background: #f5f0e8; padding: 24px; color: #1a1a1a; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.06); }
    .header { background: linear-gradient(135deg, #14171a 0%, #252a30 100%); padding: 36px 32px; text-align: center; }
    .brand { margin: 0 0 8px; color: #f0ede6; font-family: Georgia, serif; font-size: 24px; font-weight: 600; letter-spacing: 0.02em; }
    .brand span { color: #d4a25c; }
    .tagline { color: #b0ada6; font-size: 13px; margin: 0; }
    .body { padding: 32px; line-height: 1.65; color: #333; font-size: 15px; }
    .greeting { font-size: 20px; font-family: Georgia, serif; color: #1a1a1a; margin: 0 0 18px; }
    .greeting em { color: #c4923e; font-style: italic; }
    .divider { height: 1px; background: #eee6d8; margin: 22px 0; }
    .summary-box { background: #faf8f5; border: 1px solid #f0e7d6; border-radius: 6px; padding: 16px 20px; }
    .summary-title { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; color: #7a7770; margin-bottom: 10px; }
    .summary-row { display: flex; justify-content: space-between; padding: 4px 0; font-size: 13px; }
    .summary-row span:first-child { color: #8a8680; }
    .summary-row span:last-child { color: #1a1a1a; font-weight: 500; }
    .cta-wrap { text-align: center; margin: 28px 0 10px; }
    .cta { display: inline-block; padding: 12px 28px; background: linear-gradient(135deg, #d4a25c, #c4923e); color: #14171a; text-decoration: none; border-radius: 4px; font-weight: 600; font-size: 13px; letter-spacing: 0.08em; text-transform: uppercase; }
    .closing { margin-top: 22px; }
    .signoff { font-family: Georgia, serif; color: #1a1a1a; font-size: 16px; }
    .signoff strong { color: #c4923e; }
    .footer { background: #14171a; padding: 20px 32px; text-align: center; }
    .footer a { color: #d4a25c; text-decoration: none; font-size: 13px; }
    .footer .copyright { color: #7a7770; font-size: 11px; margin-top: 8px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 class="brand">Space <span>Utilisers</span></h1>
      <p class="tagline">Maximize Your Environment, Design Your Potential</p>
    </div>
    <div class="body">
      <h2 class="greeting">Dear <em>${escapeHtml(data.name)}</em>,</h2>

      <p>Thank you for reaching out to <strong>${escapeHtml(COMPANY_NAME)}</strong>. We have received your message and our design team is reviewing your inquiry.</p>

      <p>Our team will get back to you within <strong>24 hours</strong> (Monday – Saturday) to discuss your project in detail.</p>

      <div class="divider"></div>

      <div class="summary-box">
        <div class="summary-title">Your Submission Summary</div>
        <div class="summary-row"><span>Subject</span><span>${escapeHtml(data.subject)}</span></div>
        <div class="summary-row"><span>Submitted</span><span>${escapeHtml(data.timestamp)}</span></div>
      </div>

      <div class="cta-wrap">
        <a href="${WEBSITE_URL}" class="cta">Visit Our Website</a>
      </div>

      <div class="closing">
        <p>If you have any urgent questions in the meantime, please call us at <strong>+91 98715 43683</strong> or reply to this email directly.</p>
        <p class="signoff">Warm regards,<br><strong>The ${escapeHtml(COMPANY_NAME)} Team</strong></p>
      </div>
    </div>
    <div class="footer">
      <a href="${WEBSITE_URL}">${WEBSITE_URL}</a>
      <div class="copyright">© ${new Date().getFullYear()} ${escapeHtml(COMPANY_NAME)}. All rights reserved.</div>
    </div>
  </div>
</body>
</html>`;

  return { subject, text, html };
}

export async function sendAdminNotification(data: ContactSubmission): Promise<void> {
  const mail = buildAdminEmail(data);
  const t = getTransporter();

  await t.sendMail({
    from: `"${FROM_NAME}" <${FROM_EMAIL}>`,
    replyTo: data.email,
    to: ADMIN_EMAIL,
    subject: mail.subject,
    text: mail.text,
    html: mail.html,
  });
}

export async function sendUserConfirmation(data: ContactSubmission): Promise<void> {
  const mail = buildUserConfirmationEmail(data);
  const t = getTransporter();

  await t.sendMail({
    from: `"${FROM_NAME}" <${FROM_EMAIL}>`,
    replyTo: REPLY_TO_EMAIL,
    to: data.email,
    subject: mail.subject,
    text: mail.text,
    html: mail.html,
  });
}

export async function sendContactEmails(data: ContactSubmission): Promise<{ admin: boolean; user: boolean }> {
  const result = { admin: false, user: false };

  try {
    await sendAdminNotification(data);
    result.admin = true;
  } catch (err) {
    console.error('[EMAIL] Failed to send admin notification:', err);
  }

  try {
    await sendUserConfirmation(data);
    result.user = true;
  } catch (err) {
    console.error('[EMAIL] Failed to send user confirmation:', err);
  }

  return result;
}

export { COMPANY_NAME, ADMIN_EMAIL, WEBSITE_URL };
