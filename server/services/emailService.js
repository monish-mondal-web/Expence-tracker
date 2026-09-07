const nodemailer = require('nodemailer');

const createTransporter = () => {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const user = process.env.SMTP_USER;
  let pass = process.env.SMTP_PASS || '';
  if (pass) {
    pass = pass.replace(/^["']|["']$/g, '');
  }
  const secure = process.env.SMTP_SECURE === 'true' || port === 465;

  if (!host || !user || !pass || user.includes('your_email@gmail.com')) {
    return null; // SMTP not yet fully configured in .env
  }

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user,
      pass,
    },
  });
};

const sendResetCodeEmail = async (toEmail, code, userName = 'User') => {
  const transporter = createTransporter();

  if (!transporter) {
    console.log(`[Email Service] SMTP not configured in .env. Real 6-digit reset code for ${toEmail}: [ ${code} ]`);
    return {
      sent: false,
      reason: 'SMTP credentials not configured in .env yet.',
    };
  }

  let fromName = (process.env.SMTP_FROM_NAME || 'Team MDA').replace(/^["']|["']$/g, '');
  let fromEmail = process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER;
  const fromAddress = process.env.EMAIL_FROM || `"${fromName}" <${fromEmail}>`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background: #F8FAFC; margin: 0; padding: 20px; }
        .container { max-width: 480px; margin: 0 auto; background: #FFFFFF; border-radius: 16px; padding: 32px; border: 1px solid #E2E8F0; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
        .logo { font-size: 20px; font-weight: 800; color: #0F172A; margin-bottom: 20px; letter-spacing: -0.02em; }
        h1 { font-size: 20px; font-weight: 700; color: #0F172A; margin: 0 0 12px; }
        p { font-size: 14px; color: #475569; line-height: 1.5; margin: 0 0 20px; }
        .code-box { background: #F1F5F9; border: 2px dashed #CBD5E1; border-radius: 12px; padding: 18px; text-align: center; margin: 24px 0; }
        .code { font-size: 32px; font-weight: 800; letter-spacing: 6px; color: #0F172A; font-family: monospace; }
        .footer { font-size: 12px; color: #94A3B8; text-align: center; margin-top: 24px; border-top: 1px solid #F1F5F9; padding-top: 16px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="logo">FinFood Tracker</div>
        <h1>Password Reset Verification</h1>
        <p>Hello ${userName},</p>
        <p>We received a request to reset your password. Use the 6-digit verification code below to complete your password reset:</p>
        <div class="code-box">
          <div class="code">${code}</div>
        </div>
        <p style="font-size: 13px; color: #64748B;">This code is valid for <strong>15 minutes</strong>. If you did not request this, you can safely ignore this email.</p>
        <div class="footer">Team MDA — FinFood Expense & Budget Tracker</div>
      </div>
    </body>
    </html>
  `;

  try {
    const info = await transporter.sendMail({
      from: fromAddress,
      to: toEmail,
      subject: `Your FinFood Password Reset Code: ${code}`,
      html,
    });
    console.log(`[Email Service] Password reset email sent to ${toEmail}. Message ID: ${info.messageId}`);
    return { sent: true, messageId: info.messageId };
  } catch (error) {
    console.error(`[Email Service] Failed to send email to ${toEmail}:`, error.message);
    return { sent: false, error: error.message };
  }
};

module.exports = {
  sendResetCodeEmail,
};
