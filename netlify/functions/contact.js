/* ===================================================================
   SPACE UTILIZERS — Netlify Serverless Contact Function (Self-Contained)
   Handles POST /api/contact → /.netlify/functions/contact
   
   This is fully self-contained to avoid esbuild bundling issues with
   the server/dist/ import chain. All logic is inline.
   =================================================================== */

const nodemailer = require('nodemailer');

// ── Helpers ────────────────────────────────────────────────────────

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function sanitize(input, maxLen) {
  if (typeof input !== 'string') return '';
  let s = input.trim().replace(/\0/g, '');
  if (s.length > maxLen) s = s.slice(0, maxLen);
  return s;
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidPhone(phone) {
  return /^[+]?[\d\s\-()]{8,30}$/.test(phone);
}

function formatTimestamp() {
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

// ── Validation ─────────────────────────────────────────────────────

function validateBody(body) {
  const errors = [];

  const name = sanitize(body.name, 120);
  if (!name) errors.push({ field: 'name', message: 'Full name is required.' });
  else if (name.length < 2) errors.push({ field: 'name', message: 'Name must be at least 2 characters.' });

  const email = sanitize(body.email, 254);
  if (!email) errors.push({ field: 'email', message: 'Email address is required.' });
  else if (!isValidEmail(email)) errors.push({ field: 'email', message: 'Please enter a valid email address.' });

  const phone = sanitize(body.phone, 30);
  if (!phone) errors.push({ field: 'phone', message: 'Phone number is required.' });
  else if (!isValidPhone(phone)) errors.push({ field: 'phone', message: 'Please enter a valid phone number.' });

  const subject = sanitize(body.subject, 150);
  if (!subject) errors.push({ field: 'subject', message: 'Subject / Query type is required.' });
  else if (subject.length < 3) errors.push({ field: 'subject', message: 'Subject must be at least 3 characters.' });

  const message = sanitize(body.message, 5000);
  if (!message) errors.push({ field: 'message', message: 'Message is required.' });
  else if (message.length < 10) errors.push({ field: 'message', message: 'Message must be at least 10 characters.' });

  return errors;
}

// ── Email Templates ────────────────────────────────────────────────

function buildAdminEmail(data, companyName, websiteUrl) {
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
Website URL: ${websiteUrl}
IP Address: ${data.ip || 'N/A'}
═══════════════════════════════════════════
`;

  const html = `<!DOCTYPE html>
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
        <div><strong>Website:</strong> ${escapeHtml(websiteUrl)}</div>
        <div><strong>IP Address:</strong> ${escapeHtml(data.ip || 'N/A')}</div>
      </div>
    </div>
    <div class="footer">
      This email was sent by the <span class="accent">${escapeHtml(companyName)}</span> contact form system.
    </div>
  </div>
</body>
</html>`;

  return { subject, text, html };
}

function buildUserEmail(data, companyName, websiteUrl) {
  const subject = `Thank You for Contacting ${companyName}`;

  const text = `
Dear ${data.name},

Thank you for reaching out to ${companyName}. We have received your message and our team is reviewing your inquiry.

Our design team will get back to you within 24 hours (Monday – Saturday) to discuss your project in detail.

Summary of your submission:
  Subject: ${data.subject}
  Date: ${data.timestamp}

If you have any urgent questions in the meantime, please feel free to call us at +91 98715 43683 or reply to this email.

Warm regards,
The ${companyName} Team
${websiteUrl}
`;

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; background: #f5f0e8; padding: 24px; color: #1a1a1a; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.06); }
    .header { background: linear-gradient(135deg, #14171a 0%, #252a30 100%); padding: 36px 32px; text-align: center; }
    .brand { margin: 0 0 8px; color: #f0ede6; font-family: Georgia, serif; font-size: 24px; font-weight: 600; }
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
    .footer { background: #14171a; padding: 20px 32px; text-align: center; }
    .footer a { color: #d4a25c; text-decoration: none; font-size: 13px; }
    .footer .copyright { color: #7a7770; font-size: 11px; margin-top: 8px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 class="brand">Space <span>Utilizers</span></h1>
      <p class="tagline">Maximize Your Environment, Design Your Potential</p>
    </div>
    <div class="body">
      <h2 class="greeting">Dear <em>${escapeHtml(data.name)}</em>,</h2>
      <p>Thank you for reaching out to <strong>${escapeHtml(companyName)}</strong>. We have received your message and our design team is reviewing your inquiry.</p>
      <p>Our team will get back to you within <strong>24 hours</strong> (Monday – Saturday) to discuss your project in detail.</p>
      <div class="divider"></div>
      <div class="summary-box">
        <div class="summary-title">Your Submission Summary</div>
        <div class="summary-row"><span>Subject</span><span>${escapeHtml(data.subject)}</span></div>
        <div class="summary-row"><span>Submitted</span><span>${escapeHtml(data.timestamp)}</span></div>
      </div>
      <div class="cta-wrap">
        <a href="${websiteUrl}" class="cta">Visit Our Website</a>
      </div>
      <div>
        <p>If you have any urgent questions in the meantime, please call us at <strong>+91 98715 43683</strong> or reply to this email directly.</p>
        <p>Warm regards,<br><strong>The ${escapeHtml(companyName)} Team</strong></p>
      </div>
    </div>
    <div class="footer">
      <a href="${websiteUrl}">${websiteUrl}</a>
      <div class="copyright">© ${new Date().getFullYear()} ${escapeHtml(companyName)}. All rights reserved.</div>
    </div>
  </div>
</body>
</html>`;

  return { subject, text, html };
}

// ── Create Transporter ─────────────────────────────────────────────

function createTransporter() {
  const provider = process.env.EMAIL_PROVIDER || 'smtp';

  // Debug: log SMTP config (values hidden for security)
  console.log('[SMTP Config]', {
    provider,
    host: process.env.SMTP_HOST ? `${process.env.SMTP_HOST.substring(0, 4)}***` : '(NOT SET)',
    port: process.env.SMTP_PORT || '(NOT SET, defaulting to 465)',
    secure: process.env.SMTP_SECURE || '(NOT SET)',
    user: process.env.SMTP_USER ? `${process.env.SMTP_USER.substring(0, 4)}***` : '(NOT SET)',
    pass: process.env.SMTP_PASS ? '***SET***' : '(NOT SET)',
  });

  if (provider === 'resend') {
    return nodemailer.createTransport({
      host: 'smtp.resend.com',
      port: 465,
      secure: true,
      auth: { user: 'resend', pass: process.env.RESEND_API_KEY || '' },
    });
  }

  if (provider === 'sendgrid') {
    return nodemailer.createTransport({
      host: 'smtp.sendgrid.net',
      port: 465,
      secure: true,
      auth: { user: 'apikey', pass: process.env.SENDGRID_API_KEY || '' },
    });
  }

  // Default: SMTP (Gmail with App Password)
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '465', 10),
    secure: (process.env.SMTP_SECURE || 'true') === 'true',
    auth: {
      user: process.env.SMTP_USER || '',
      pass: process.env.SMTP_PASS || '',
    },
  });
}

// ── Main Handler ───────────────────────────────────────────────────

exports.handler = async (event, context) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type,Accept,X-Requested-With',
    'Access-Control-Max-Age': '86400',
    'Content-Type': 'application/json; charset=utf-8',
  };

  // Handle preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: corsHeaders, body: '' };
  }

  // Only allow POST
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: corsHeaders,
      body: JSON.stringify({ success: false, message: 'Method not allowed.' }),
    };
  }

  // Parse body
  let body = {};
  try {
    body = event.body ? JSON.parse(event.body) : {};
  } catch (_e) {
    body = {};
  }

  // Honeypot check
  const honeypot = typeof body.website === 'string' ? body.website.trim() : '';
  if (honeypot) {
    console.warn('[API] Honeypot triggered — request silently dropped.');
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        success: true,
        message: 'Thank you for contacting us. We have received your message and will get back to you shortly.',
      }),
    };
  }

  // Validate
  const errors = validateBody(body);
  if (errors.length > 0) {
    return {
      statusCode: 400,
      headers: corsHeaders,
      body: JSON.stringify({
        success: false,
        message: 'Please fix the errors in the form and try again.',
        errors,
      }),
    };
  }

  // Build submission data
  const headersLower = {};
  for (const k of Object.keys(event.headers || {})) {
    headersLower[k.toLowerCase()] = event.headers[k];
  }

  const ip =
    (headersLower['x-forwarded-for'] || '').toString().split(',')[0]?.trim() ||
    headersLower['x-real-ip'] ||
    headersLower['client-ip'] ||
    '';

  const data = {
    name: sanitize(body.name, 120),
    email: sanitize(body.email, 254).toLowerCase(),
    phone: sanitize(body.phone, 30),
    subject: sanitize(body.subject, 150),
    message: sanitize(body.message, 5000),
    timestamp: formatTimestamp(),
    ip,
  };

  const companyName = process.env.COMPANY_NAME || 'Space Utilizers';
  const adminEmail = process.env.ADMIN_EMAIL || 'sura767848@gmail.com';
  const replyToEmail = process.env.REPLY_TO_EMAIL || adminEmail;
  const fromEmail = process.env.FROM_EMAIL || adminEmail;
  const fromName = process.env.FROM_NAME || companyName;
  const websiteUrl = process.env.WEBSITE_URL || 'https://spaceutilizers.com';

  console.log(`[API] New contact submission: ${data.name} <${data.email}> — ${data.subject}`);

  // Create transporter fresh each invocation (no caching issues in serverless)
  const transporter = createTransporter();

  let adminSent = false;
  let userSent = false;

  // Send admin notification
  try {
    const adminMail = buildAdminEmail(data, companyName, websiteUrl);
    await transporter.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      replyTo: data.email,
      to: adminEmail,
      subject: adminMail.subject,
      text: adminMail.text,
      html: adminMail.html,
    });
    adminSent = true;
    console.log('[EMAIL] Admin notification sent successfully.');
  } catch (err) {
    console.error('[EMAIL] Failed to send admin notification:', err.message || err);
  }

  // Send user confirmation
  try {
    const userMail = buildUserEmail(data, companyName, websiteUrl);
    await transporter.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      replyTo: replyToEmail,
      to: data.email,
      subject: userMail.subject,
      text: userMail.text,
      html: userMail.html,
    });
    userSent = true;
    console.log('[EMAIL] User confirmation sent successfully.');
  } catch (err) {
    console.error('[EMAIL] Failed to send user confirmation:', err.message || err);
  }

  if (!adminSent && !userSent) {
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        success: false,
        message: 'We encountered an issue while sending your message. Please try again in a few moments or email us directly.',
      }),
    };
  }

  return {
    statusCode: 200,
    headers: corsHeaders,
    body: JSON.stringify({
      success: true,
      message: 'Thank you for contacting us. We have received your message and will get back to you shortly.',
      adminNotified: adminSent,
      userConfirmed: userSent,
    }),
  };
};
