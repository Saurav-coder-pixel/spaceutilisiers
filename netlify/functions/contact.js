require('dotenv').config();
const { handleContactRequest } = require('../../server/dist/contact-handler');

exports.handler = async (event, context) => {
  const headersLower = {};
  const eventHeaders = event.headers || {};
  for (const k of Object.keys(eventHeaders)) {
    headersLower[k.toLowerCase()] = eventHeaders[k];
  }

  const origin = headersLower.origin || '';
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type,Accept,X-Requested-With',
    'Access-Control-Max-Age': '86400',
    'Content-Type': 'application/json; charset=utf-8',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: corsHeaders, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: corsHeaders,
      body: JSON.stringify({ success: false, message: 'Method not allowed.' }),
    };
  }

  let body = {};
  try {
    body = event.body ? JSON.parse(event.body) : {};
  } catch (_e) {
    body = {};
  }

  const ip =
    (headersLower['x-forwarded-for'] || '').toString().split(',')[0]?.trim() ||
    headersLower['x-real-ip'] ||
    event.headers['client-ip'] ||
    '';

  const result = await handleContactRequest(body, {
    headers: event.headers,
    ip,
    protocol: headersLower['x-forwarded-proto'] || 'https',
  });

  return {
    statusCode: result.statusCode,
    headers: corsHeaders,
    body: JSON.stringify(result.body),
  };
};
