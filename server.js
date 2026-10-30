require('dotenv').config();
const http = require('http');
const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');

const PORT = process.env.PORT || 3000;
const ROOT = __dirname;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.svg': 'image/svg+xml'
};

// HTML Escaping to prevent injection in generated emails
function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Nodemailer Transporter for Gmail
function getTransporter() {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD
    ? process.env.GMAIL_APP_PASSWORD.replace(/\s+/g, '')
    : '';

  if (!user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass }
  });
}

// Helper: Build Admin Notification Email HTML
function buildAdminEmailHtml(data) {
  const { name, email, phone, businessAge, challenge, marketingSpend, revenue, paidAds } = data;
  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <title>New Project Inquiry</title>
  </head>
  <body style="margin:0;padding:0;background-color:#09090b;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#f4f4f5;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#09090b;padding:40px 15px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" style="max-width:600px;background-color:#141416;border:1px solid #27272a;border-radius:16px;overflow:hidden;box-shadow:0 12px 40px rgba(0,0,0,0.6);" cellspacing="0" cellpadding="0" border="0">
            <!-- Header -->
            <tr>
              <td style="padding:32px 32px 24px;background:linear-gradient(135deg, #1c1c1f 0%, #121214 100%);border-bottom:1px solid #27272a;">
                <span style="display:inline-block;padding:4px 12px;background:rgba(255,85,0,0.15);border:1px solid rgba(255,85,0,0.3);border-radius:999px;color:#ff5500;font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;">NEW INQUIRY</span>
                <h1 style="margin:16px 0 6px;font-size:24px;font-weight:700;color:#ffffff;line-height:1.2;">Project Lead from ${escapeHtml(name)}</h1>
                <p style="margin:0;font-size:14px;color:#a1a1aa;">Submitted via Folioblox Portfolio Form</p>
              </td>
            </tr>
            <!-- Content -->
            <tr>
              <td style="padding:28px 32px;">
                <h2 style="margin:0 0 16px;font-size:14px;letter-spacing:0.05em;text-transform:uppercase;color:#ff5500;">Contact Details</h2>
                <table width="100%" cellpadding="8" cellspacing="0" style="margin-bottom:24px;border-collapse:collapse;">
                  <tr style="border-bottom:1px solid #27272a;">
                    <td style="color:#71717a;font-size:13px;width:35%;font-weight:600;">Full Name:</td>
                    <td style="color:#ffffff;font-size:14px;font-weight:600;">${escapeHtml(name)}</td>
                  </tr>
                  <tr style="border-bottom:1px solid #27272a;">
                    <td style="color:#71717a;font-size:13px;font-weight:600;">Email Address:</td>
                    <td style="color:#ff5500;font-size:14px;font-weight:600;"><a href="mailto:${escapeHtml(email)}" style="color:#ff5500;text-decoration:none;">${escapeHtml(email)}</a></td>
                  </tr>
                  <tr style="border-bottom:1px solid #27272a;">
                    <td style="color:#71717a;font-size:13px;font-weight:600;">Phone Number:</td>
                    <td style="color:#ffffff;font-size:14px;"><a href="tel:${escapeHtml(phone)}" style="color:#ffffff;text-decoration:none;">${escapeHtml(phone)}</a></td>
                  </tr>
                </table>

                <h2 style="margin:0 0 16px;font-size:14px;letter-spacing:0.05em;text-transform:uppercase;color:#ff5500;">Project & Business Scope</h2>
                <table width="100%" cellpadding="8" cellspacing="0" style="border-collapse:collapse;">
                  <tr style="border-bottom:1px solid #27272a;">
                    <td style="color:#71717a;font-size:13px;width:50%;">Time in Business:</td>
                    <td style="color:#ffffff;font-size:14px;font-weight:600;">${escapeHtml(businessAge || 'Not specified')}</td>
                  </tr>
                  <tr style="border-bottom:1px solid #27272a;">
                    <td style="color:#71717a;font-size:13px;">Biggest Challenge:</td>
                    <td style="color:#ffffff;font-size:14px;font-weight:600;">${escapeHtml(challenge || 'Not specified')}</td>
                  </tr>
                  <tr style="border-bottom:1px solid #27272a;">
                    <td style="color:#71717a;font-size:13px;">Monthly Marketing Spend:</td>
                    <td style="color:#ffffff;font-size:14px;font-weight:600;">${escapeHtml(marketingSpend || 'Not specified')}</td>
                  </tr>
                  <tr style="border-bottom:1px solid #27272a;">
                    <td style="color:#71717a;font-size:13px;">Estimated Annual Revenue:</td>
                    <td style="color:#ffffff;font-size:14px;font-weight:600;">${escapeHtml(revenue || 'Not specified')}</td>
                  </tr>
                  <tr>
                    <td style="color:#71717a;font-size:13px;">Running Paid Ads:</td>
                    <td style="color:#ffffff;font-size:14px;font-weight:600;">${escapeHtml(paidAds || 'Not specified')}</td>
                  </tr>
                </table>

                <div style="margin-top:32px;text-align:center;">
                  <a href="mailto:${escapeHtml(email)}?subject=Re:%20Folioblox%20Project%20Inquiry" style="display:inline-block;background:#ff5500;color:#ffffff;text-decoration:none;font-size:14px;font-weight:700;padding:12px 28px;border-radius:999px;">Reply Directly to ${escapeHtml(name)}</a>
                </div>
              </td>
            </tr>
            <!-- Footer -->
            <tr>
              <td style="padding:20px 32px;background:#0d0d0f;border-top:1px solid #27272a;text-align:center;font-size:12px;color:#71717a;">
                Sent automatically via Folioblox Server at ${new Date().toUTCString()}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
  </html>`;
}

// Helper: Build User Confirmation Email Copy HTML
function buildUserCopyEmailHtml(data) {
  const { name, phone, email, businessAge, challenge, marketingSpend, revenue, paidAds } = data;
  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <title>Inquiry Received — Folioblox</title>
  </head>
  <body style="margin:0;padding:0;background-color:#09090b;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#f4f4f5;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#09090b;padding:40px 15px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" style="max-width:600px;background-color:#141416;border:1px solid #27272a;border-radius:16px;overflow:hidden;box-shadow:0 12px 40px rgba(0,0,0,0.6);" cellspacing="0" cellpadding="0" border="0">
            <!-- Header -->
            <tr>
              <td style="padding:32px 32px 24px;background:linear-gradient(135deg, #1c1c1f 0%, #121214 100%);border-bottom:1px solid #27272a;">
                <span style="display:inline-block;padding:4px 12px;background:rgba(255,85,0,0.15);border:1px solid rgba(255,85,0,0.3);border-radius:999px;color:#ff5500;font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;">CONFIRMATION COPY</span>
                <h1 style="margin:16px 0 8px;font-size:24px;font-weight:700;color:#ffffff;line-height:1.2;">Thank you, ${escapeHtml(name)}!</h1>
                <p style="margin:0;font-size:14px;color:#a1a1aa;line-height:1.5;">We have received your project details and will be in touch with you shortly.</p>
              </td>
            </tr>
            <!-- Content -->
            <tr>
              <td style="padding:28px 32px;">
                <p style="margin:0 0 20px;font-size:14px;line-height:1.6;color:#d4d4d8;">
                  Here is a copy of the inquiry details you submitted for your reference:
                </p>

                <table width="100%" cellpadding="8" cellspacing="0" style="margin-bottom:24px;border-collapse:collapse;background:#0d0d0f;border-radius:10px;padding:12px;border:1px solid #27272a;">
                  <tr style="border-bottom:1px solid #1f1f23;">
                    <td style="color:#71717a;font-size:13px;width:45%;">Name:</td>
                    <td style="color:#ffffff;font-size:13px;font-weight:600;">${escapeHtml(name)}</td>
                  </tr>
                  <tr style="border-bottom:1px solid #1f1f23;">
                    <td style="color:#71717a;font-size:13px;">Email:</td>
                    <td style="color:#ffffff;font-size:13px;">${escapeHtml(email)}</td>
                  </tr>
                  <tr style="border-bottom:1px solid #1f1f23;">
                    <td style="color:#71717a;font-size:13px;">Phone:</td>
                    <td style="color:#ffffff;font-size:13px;">${escapeHtml(phone)}</td>
                  </tr>
                  <tr style="border-bottom:1px solid #1f1f23;">
                    <td style="color:#71717a;font-size:13px;">Time in Business:</td>
                    <td style="color:#ffffff;font-size:13px;">${escapeHtml(businessAge || 'N/A')}</td>
                  </tr>
                  <tr style="border-bottom:1px solid #1f1f23;">
                    <td style="color:#71717a;font-size:13px;">Scaling Challenge:</td>
                    <td style="color:#ffffff;font-size:13px;">${escapeHtml(challenge || 'N/A')}</td>
                  </tr>
                  <tr style="border-bottom:1px solid #1f1f23;">
                    <td style="color:#71717a;font-size:13px;">Monthly Marketing Spend:</td>
                    <td style="color:#ffffff;font-size:13px;">${escapeHtml(marketingSpend || 'N/A')}</td>
                  </tr>
                  <tr style="border-bottom:1px solid #1f1f23;">
                    <td style="color:#71717a;font-size:13px;">Estimated Annual Revenue:</td>
                    <td style="color:#ffffff;font-size:13px;">${escapeHtml(revenue || 'N/A')}</td>
                  </tr>
                  <tr>
                    <td style="color:#71717a;font-size:13px;">Running Paid Ads:</td>
                    <td style="color:#ffffff;font-size:13px;">${escapeHtml(paidAds || 'N/A')}</td>
                  </tr>
                </table>

                <p style="margin:0 0 10px;font-size:13px;color:#a1a1aa;line-height:1.6;">
                  If you need to share any additional details or files, you can reply directly to this email.
                </p>
              </td>
            </tr>
            <!-- Footer -->
            <tr>
              <td style="padding:20px 32px;background:#0d0d0f;border-top:1px solid #27272a;text-align:center;font-size:12px;color:#71717a;">
                Folioblox — Shaping experiences that make life simpler.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
  </html>`;
}

// Contact Form API Handler
function handleContactForm(req, res) {
  let body = '';
  req.on('data', chunk => {
    body += chunk;
    if (body.length > 1e6) {
      // 1MB flood protection
      req.connection.destroy();
    }
  });

  req.on('end', async () => {
    try {
      const data = JSON.parse(body || '{}');
      const { name, email, phone, businessAge, challenge, marketingSpend, revenue, paidAds } = data;

      // Validation
      if (!name || !name.trim()) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ success: false, error: 'Please provide your name.' }));
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!email || !emailRegex.test(email.trim())) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ success: false, error: 'Please provide a valid email address.' }));
      }

      if (!phone || !phone.trim()) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ success: false, error: 'Please provide your phone number.' }));
      }

      const transporter = getTransporter();
      if (!transporter) {
        console.error('Nodemailer Error: GMAIL_USER or GMAIL_APP_PASSWORD is not configured in .env');
        res.writeHead(500, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({
          success: false,
          error: 'Email service is not yet configured. Please set GMAIL_USER and GMAIL_APP_PASSWORD in the .env file.'
        }));
      }

      const adminRecipient = process.env.NOTIFICATION_EMAIL || process.env.GMAIL_USER;

      // 1. Notification to the site owner
      const adminMailOptions = {
        from: `"Folioblox Inquiries" <${process.env.GMAIL_USER}>`,
        to: adminRecipient,
        replyTo: `${name.trim()} <${email.trim()}>`,
        subject: `🚀 New Project Inquiry: ${name.trim()}`,
        html: buildAdminEmailHtml(data),
        text: `New Project Inquiry from ${name}\n\nEmail: ${email}\nPhone: ${phone}\nTime in Business: ${businessAge}\nBiggest Challenge: ${challenge}\nMarketing Spend: ${marketingSpend}\nEstimated Revenue: ${revenue}\nRunning Paid Ads: ${paidAds}`
      };

      // 2. Confirmation copy to the user
      const userMailOptions = {
        from: `"Sanjay | Folioblox" <${process.env.GMAIL_USER}>`,
        to: email.trim(),
        subject: `✨ We received your inquiry — Folioblox (Copy)`,
        html: buildUserCopyEmailHtml(data),
        text: `Hi ${name},\n\nThank you for reaching out! We received your project details.\n\nSummary of your inquiry:\n- Time in Business: ${businessAge}\n- Challenge: ${challenge}\n- Marketing Spend: ${marketingSpend}\n- Annual Revenue: ${revenue}\n- Paid Ads: ${paidAds}\n\nWe will be in touch with you shortly.\n\nBest regards,\nFolioblox Team`
      };

      // Send both concurrently
      await Promise.all([
        transporter.sendMail(adminMailOptions),
        transporter.sendMail(userMailOptions)
      ]);

      console.log(`[Email Sent] Successfully delivered notification to ${adminRecipient} and copy to ${email}`);

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: true,
        message: 'Thank you! Your message has been sent, and a confirmation copy was delivered to your email.'
      }));
    } catch (err) {
      console.error('[Nodemailer Send Error]:', err);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: false,
        error: err.message || 'Failed to send email. Please check your SMTP settings.'
      }));
    }
  });
}

// HTTP Server
const server = http.createServer((req, res) => {
  // CORS Headers for cross-origin requests (e.g. from custom domain or dev servers)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // API Endpoints
  const parsedUrl = req.url.split('?')[0];

  if (req.method === 'POST' && parsedUrl === '/api/contact') {
    return handleContactForm(req, res);
  }

  if (req.method === 'GET' && parsedUrl === '/api/health') {
    const isConfigured = Boolean(process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({
      status: 'ok',
      nodemailer_configured: isConfigured,
      user: process.env.GMAIL_USER ? process.env.GMAIL_USER.replace(/(.{2})(.*)(@.*)/, '$1***$3') : null
    }));
  }

  // Static File Serving
  let decodedUrl = decodeURIComponent(parsedUrl);
  if (decodedUrl === '/' || decodedUrl === '') {
    decodedUrl = '/index.html';
  }

  const filePath = path.join(ROOT, decodedUrl);

  // Security: prevent directory traversal outside ROOT
  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('403 Forbidden');
    return;
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 Not Found');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    const headers = {
      'Content-Type': contentType,
      'Content-Length': stats.size
    };

    // Aggressive caching for static image assets
    if (ext === '.jpg' || ext === '.jpeg' || ext === '.png' || ext === '.webp') {
      headers['Cache-Control'] = 'public, max-age=31536000, immutable';
    } else {
      headers['Cache-Control'] = 'no-cache';
    }

    res.writeHead(200, headers);

    if (req.method === 'HEAD') {
      res.end();
      return;
    }

    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
  });
});

function startServer(port) {
  server.listen(port, () => {
    console.log(`\n========================================`);
    console.log(`🚀 Folioblox Server with Nodemailer Running:`);
    console.log(`👉 Local:   http://localhost:${port}`);
    console.log(`✉️  Form API: POST http://localhost:${port}/api/contact`);
    console.log(`========================================\n`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.log(`Port ${port} in use, trying ${port + 1}...`);
      startServer(port + 1);
    } else {
      console.error('Server error:', err);
    }
  });
}

startServer(PORT);
