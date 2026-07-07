import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const templatesDir = path.join(__dirname, '../templates/email');

let transporter;

function getTransporter() {
  if (transporter) return transporter;
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_USER || !SMTP_PASS) {
    return null;
  }
  transporter = nodemailer.createTransport({
    host: SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(SMTP_PORT, 10) || 587,
    secure: false,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
  return transporter;
}

function loadTemplate(name) {
  const baseFile = path.join(templatesDir, 'base_template.html');
  const tplFile = path.join(templatesDir, `${name}.html`);
  
  let content = '<p>{{content}}</p>';
  if (fs.existsSync(tplFile)) {
    content = fs.readFileSync(tplFile, 'utf8');
  }

  if (fs.existsSync(baseFile)) {
    const base = fs.readFileSync(baseFile, 'utf8');
    return base.replace('{{bodyContent}}', content);
  }
  
  return content;
}

function render(template, vars) {
  let html = template;
  Object.entries(vars).forEach(([k, v]) => {
    html = html.replaceAll(`{{${k}}}`, String(v ?? ''));
  });
  return html;
}

export async function sendMail({ to, subject, html }) {
  const tx = getTransporter();
  if (!tx) {
    console.log('[email:dev]', { to, subject, html: html?.slice(0, 200) });
    return { skipped: true };
  }
  try {
    await tx.sendMail({
      from: `"FlowGen" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html,
    });
    return { sent: true };
  } catch (error) {
    console.error(`[email:error] Failed to send to ${to}:`, error.message);
    return { error };
  }
}

export async function sendWelcomeEmail(user, org, role, tempPassword) {
  const map = {
    hr: 'welcome_hr',
    employee: 'welcome_employee',
    intern: 'welcome_intern',
    org_admin: 'welcome_employee',
  };
  const tplName = map[role] || 'welcome_employee';
  
  const portalMap = {
    hr: '/hr/login',
    employee: '/team/login',
    intern: '/intern/login',
    org_admin: '/org/login'
  };
  const portalPath = portalMap[role] || '/team/login';
  const baseUrl = process.env.CLIENT_URL || 'http://localhost:5173';

  const html = render(loadTemplate(tplName), {
    userName: user.name,
    orgName: org.name,
    companyEmail: user.companyEmail,
    tempPassword: tempPassword || '—',
    loginUrl: `${baseUrl}${portalPath}`,
  });
  return sendMail({
    to: user.personalEmail || user.companyEmail,
    subject: `Welcome to ${org.name} — FlowGen`,
    html,
  });
}

export async function sendPasswordResetEmail(user, resetToken) {
  const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/auth/forgot-password?token=${resetToken}`;
  const html = render(loadTemplate('password_reset'), {
    userName: user.name,
    resetUrl,
  });
  return sendMail({
    to: user.personalEmail || user.companyEmail,
    subject: 'Reset your FlowGen password',
    html,
  });
}

export async function sendMeetingInviteEmail(meeting, org, participantEmails, icsBuffer) {
  const html = render(loadTemplate('meeting_invite'), {
    title: meeting.title,
    orgName: org.name,
    when: new Date(meeting.scheduledAt).toISOString(),
    duration: String(meeting.duration),
    platform: meeting.platform,
    link: meeting.meetingLink || '',
    agenda: meeting.agenda || meeting.description || '',
  });
  const attachments = icsBuffer
    ? [{ filename: 'invite.ics', content: icsBuffer, contentType: 'text/calendar' }]
    : undefined;
  const tx = getTransporter();
  if (!tx) {
    console.log('[email:dev] meeting invite', participantEmails);
    return;
  }
  try {
    await tx.sendMail({
      from: `"FlowGen" <${process.env.SMTP_USER}>`,
      to: participantEmails.join(','),
      subject: `Meeting: ${meeting.title}`,
      html,
      attachments,
    });
  } catch (error) {
    console.error(`[email:error] Failed to send meeting invite:`, error.message);
  }
}

export async function sendMeetingCancelledEmail(meeting, org, participantEmails) {
  const html = render(loadTemplate('meeting_cancelled'), {
    title: meeting.title,
    orgName: org.name,
  });
  return sendMail({
    to: participantEmails[0],
    subject: `Cancelled: ${meeting.title}`,
    html,
  });
}

export async function sendAlertEmail(user, alert, senderName) {
  const portalMap = {
    hr: '/hr/dashboard',
    employee: '/employee/dashboard',
    intern: '/intern/dashboard',
    org_admin: '/org/dashboard'
  };
  const portalPath = portalMap[user.role] || '/employee/dashboard';
  const baseUrl = process.env.CLIENT_URL || 'http://localhost:5173';

  const html = render(loadTemplate('alert_notification'), {
    priority: alert.priority,
    senderName,
    title: alert.title,
    message: alert.message,
    link: `${baseUrl}${portalPath}`,
  });
  return sendMail({
    to: user.personalEmail || user.companyEmail,
    subject: `[${alert.priority}] ${alert.title}`,
    html,
  });
}

export async function sendOTPEmail(email, otp) {
  console.log(`\n🔑 [OTP Verification] Code for ${email} is: ${otp}\n`);
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px; background-color: #ffffff; color: #1e293b;">
      <h2 style="color: #4f46e5; text-align: center; margin-bottom: 24px;">Verify Your Registration</h2>
      <p>Hello,</p>
      <p>Thank you for choosing FlowGen! Use the following One-Time Password (OTP) to verify your organization registration. This verification code is valid for 10 minutes.</p>
      <div style="text-align: center; margin: 30px 0;">
        <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #4f46e5; background-color: #f8fafc; padding: 12px 24px; border-radius: 8px; border: 1px dashed #cbd5e1; display: inline-block;">${otp}</span>
      </div>
      <p>You have a maximum of <strong>3 attempts</strong> to enter this code. If the code expires or too many attempts fail, you will need to request a new registration code.</p>
      <p>If you did not request this, you can safely ignore this email.</p>
      <p style="color: #64748b; font-size: 12px; margin-top: 40px; border-top: 1px solid #e2e8f0; padding-top: 20px; text-align: center;">© 2026 FlowGen. All rights reserved.</p>
    </div>
  `;
  return sendMail({
    to: email,
    subject: `${otp} is your FlowGen Verification Code`,
    html,
  });
}
