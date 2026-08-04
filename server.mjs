import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import nodemailer from 'nodemailer';

const app = express();
const port = Number(process.env.PORT || 3001);
const ownerEmail = process.env.OWNER_EMAIL || 'mayankorai1200@gmail.com';
const smtpHost = process.env.SMTP_HOST;
const smtpPort = Number(process.env.SMTP_PORT || 587);
const smtpUser = process.env.SMTP_USER;
const smtpPass = process.env.SMTP_PASS;
const smtpFrom = process.env.SMTP_FROM || ownerEmail;

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use(
  rateLimit({
    windowMs: 60 * 1000,
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'Too many requests. Please try again later.' },
  })
);

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email || '');
}

app.post('/api/contact', async (req, res) => {
  try {
    const email = String(req.body?.email || '').trim().toLowerCase();

    if (!email || !isValidEmail(email)) {
      return res.status(400).json({ message: 'Please enter a valid email address.' });
    }

    if (!smtpHost || !smtpUser || !smtpPass) {
      return res.status(500).json({ message: 'Email service is not configured.' });
    }

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });

    await transporter.sendMail({
      from: smtpFrom,
      to: ownerEmail,
      replyTo: email,
      subject: 'New Contact Request',
      text: `User Email:\n${email}`,
      html: `<p><strong>User Email:</strong> ${email}</p>`,
    });

    return res.status(200).json({ message: 'Contact request sent successfully.' });
  } catch (error) {
    console.error('Contact API error:', error);
    return res.status(500).json({ message: 'Failed to send contact request.' });
  }
});

app.listen(port, () => {
  console.log(`Contact backend listening on http://localhost:${port}`);
});
