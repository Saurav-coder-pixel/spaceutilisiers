require('dotenv').config();
const { handleContactRequest } = require('../server/dist/contact-handler');

export default async function handler(req: any, res: any) {
  if (req.method === 'OPTIONS') {
    const origin = req.headers.origin || '';
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Accept,X-Requested-With');
    res.setHeader('Access-Control-Max-Age', '86400');
    res.status(204).end();
    return;
  }

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('X-Content-Type-Options', 'nosniff');

  if (req.method !== 'POST') {
    res.status(405).json({ success: false, message: 'Method not allowed.' });
    return;
  }

  const body = req.body || {};
  const result = await handleContactRequest(body, {
    headers: req.headers,
    ip:
      (req.headers['x-forwarded-for'] || '').toString().split(',')[0]?.trim() ||
      req.headers['x-real-ip'] ||
      (req.socket && req.socket.remoteAddress) ||
      '',
    protocol: (req.headers['x-forwarded-proto'] || 'https').toString(),
  });

  res.status(result.statusCode).json(result.body);
}
