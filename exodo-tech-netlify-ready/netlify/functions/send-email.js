const DEFAULT_TO = 'geral@exodotech.com';

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json; charset=utf-8'
};

function json(statusCode, body) {
  return { statusCode, headers, body: JSON.stringify(body) };
}

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function clean(value, limit = 400) {
  return String(value || '').replace(/\s+/g, ' ').trim().slice(0, limit);
}

function parseBody(event) {
  if (!event.body) return {};
  const raw = event.isBase64Encoded
    ? Buffer.from(event.body, 'base64').toString('utf8')
    : event.body;
  if (raw.length > 64 * 1024) throw new Error('Payload too large');
  try {
    return JSON.parse(raw);
  } catch {
    const error = new Error('Invalid JSON body');
    error.statusCode = 400;
    throw error;
  }
}

function normalizeLead(body) {
  const contact = body.contact && typeof body.contact === 'object' ? body.contact : {};
  const lead = {
    name: clean(body.name, 160),
    contact: {
      method: clean(contact.method, 40),
      label: clean(contact.label, 80),
      final: clean(contact.final || contact.value, 220),
      country: clean(contact.country, 8),
      countryCode: clean(contact.countryCode, 12),
      value: clean(contact.value, 180)
    },
    team: clean(body.team, 120),
    niche: clean(body.niche, 180),
    problem: clean(body.problem, 1500),
    diagnosis: clean(body.diagnosis, 4000),
    language: clean(body.language, 8),
    requestedAt: clean(body.requestedAt, 60),
    requestedAtLocal: clean(body.requestedAtLocal, 80),
    source: clean(body.source, 120),
    page: clean(body.page, 300),
    messageText: String(body.messageText || '').slice(0, 8000)
  };

  if (!lead.name || !lead.contact.final || !lead.team || !lead.niche || !lead.problem) {
    const error = new Error('Missing required lead fields');
    error.statusCode = 400;
    throw error;
  }

  return lead;
}

function buildEmail(lead) {
  const subject = `Novo pedido Exodo Tech - ${lead.name}`;
  const text = lead.messageText || [
    'PEDIDO DE PROPOSTA - EXODO TECH',
    '',
    `Nome: ${lead.name}`,
    `Contacto: ${lead.contact.final}`,
    `Metodo preferido: ${lead.contact.label || lead.contact.method}`,
    `Equipa: ${lead.team}`,
    `Area do negocio: ${lead.niche}`,
    `Data/hora: ${lead.requestedAtLocal || lead.requestedAt}`,
    '',
    'Contexto:',
    lead.problem,
    '',
    lead.diagnosis ? `Diagnostico:\n${lead.diagnosis}` : '',
    '',
    `Origem: ${lead.page || lead.source || 'site'}`
  ].filter(Boolean).join('\n');

  const rows = [
    ['Nome', lead.name],
    ['Contacto', lead.contact.final],
    ['Metodo preferido', lead.contact.label || lead.contact.method],
    ['Equipa', lead.team],
    ['Area do negocio', lead.niche],
    ['Idioma', lead.language],
    ['Data/hora', lead.requestedAtLocal || lead.requestedAt],
    ['Origem', lead.page || lead.source]
  ];

  const htmlRows = rows
    .filter(([, value]) => value)
    .map(([label, value]) => `<tr><td style="padding:8px 10px;color:#94a3b8;border-bottom:1px solid #1f2937;">${escapeHtml(label)}</td><td style="padding:8px 10px;color:#fff;border-bottom:1px solid #1f2937;">${escapeHtml(value)}</td></tr>`)
    .join('');

  const html = `
    <div style="margin:0;padding:24px;background:#060E1A;color:#cbd5e1;font-family:Arial,sans-serif;">
      <div style="max-width:680px;margin:0 auto;background:#0A1526;border:1px solid #1f2937;border-radius:14px;overflow:hidden;">
        <div style="padding:22px 24px;border-bottom:1px solid #1f2937;background:linear-gradient(135deg,rgba(14,165,233,.18),rgba(245,158,11,.12));">
          <p style="margin:0 0 6px;color:#0EA5E9;font-size:12px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;">Exodo Tech</p>
          <h1 style="margin:0;color:#fff;font-size:22px;line-height:1.25;">Novo pedido de contacto</h1>
        </div>
        <div style="padding:22px 24px;">
          <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">${htmlRows}</table>
          <h2 style="margin:0 0 8px;color:#F59E0B;font-size:15px;">Contexto do pedido</h2>
          <p style="margin:0 0 18px;white-space:pre-line;line-height:1.65;">${escapeHtml(lead.problem)}</p>
          ${lead.diagnosis ? `<h2 style="margin:0 0 8px;color:#0EA5E9;font-size:15px;">Blueprint gerado no site</h2><p style="margin:0;white-space:pre-line;line-height:1.65;">${escapeHtml(lead.diagnosis)}</p>` : ''}
        </div>
      </div>
    </div>`;

  const replyTo = lead.contact.method === 'email' && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(lead.contact.value)
    ? lead.contact.value
    : undefined;

  return { subject, text, html, replyTo };
}

async function sendWithResend({ to, from, subject, text, html, replyTo }) {
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ from, to, subject, text, html, reply_to: replyTo })
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`Resend ${response.status}: ${details.slice(0, 300)}`);
  }
}

async function sendWithSmtp({ to, from, subject, text, html, replyTo }) {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_SECURE } = process.env;
  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS || !from) {
    const error = new Error('Email provider is not configured');
    error.statusCode = 500;
    throw error;
  }

  const nodemailer = require('nodemailer');
  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: String(SMTP_SECURE || '').toLowerCase() === 'true' || Number(SMTP_PORT) === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS }
  });

  await transporter.sendMail({
    from,
    to,
    subject,
    text,
    html,
    replyTo
  });
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers, body: '' };
  if (event.httpMethod !== 'POST') return json(405, { error: 'Method not allowed' });

  try {
    const body = parseBody(event);
    const lead = normalizeLead(body);
    const email = buildEmail(lead);

    const to = process.env.CONTACT_TO_EMAIL || process.env.MAIL_TO || DEFAULT_TO;
    const from = process.env.MAIL_FROM || process.env.RESEND_FROM || process.env.SMTP_USER || 'Exodo Tech <noreply@exodotech.com>';

    if (process.env.RESEND_API_KEY) {
      await sendWithResend({ to, from, ...email });
    } else {
      await sendWithSmtp({ to, from, ...email });
    }

    return json(200, { ok: true });
  } catch (error) {
    console.error('[send-email]', error);
    return json(error.statusCode || 500, {
      error: error.statusCode === 400 ? error.message : 'Unable to send lead email'
    });
  }
};
