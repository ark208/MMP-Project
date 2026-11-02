import nodemailer from 'nodemailer';
import { env } from '../config/env';

let transporter: nodemailer.Transporter | null = null;

if (env.SMTP_HOST && env.SMTP_USER) {
  transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_PORT === 465,
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASS,
    },
  });
}

export async function sendOtpEmail(email: string, otp: string): Promise<void> {
  const subject = 'Your CampusLoop Verification Code';
  const text = `Your CampusLoop one-time verification code is: ${otp}\nThis code will expire in 10 minutes.\nIf you did not request this code, please ignore this email.`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 500px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; rounded: 8px;">
      <h2 style="color: #059669;">CampusLoop Verification</h2>
      <p>Use the 6-digit code below to securely sign in to CampusLoop:</p>
      <div style="font-size: 32px; font-weight: bold; letter-spacing: 4px; padding: 12px 0; color: #1e293b;">
        ${otp}
      </div>
      <p style="color: #64748b; font-size: 14px;">This code is valid for 10 minutes. Never share this code with anyone.</p>
    </div>
  `;

  // Always log in development mode as requested
  if (env.NODE_ENV !== 'production' || !transporter) {
    console.log(`\n======================================================`);
    console.log(`📧 [DEV EMAIL OTP] Generated OTP for: ${email}`);
    console.log(`🔑 OTP Code: ${otp}`);
    console.log(`⏰ Valid for: 10 minutes`);
    console.log(`======================================================\n`);
  }

  if (transporter) {
    try {
      await transporter.sendMail({
        from: env.SMTP_FROM,
        to: email,
        subject,
        text,
        html,
      });
    } catch (error) {
      console.error('Failed to send email via SMTP transporter:', error);
      // In dev mode, logging to console is sufficient; in prod rethrow if strictly required
      if (env.NODE_ENV === 'production') {
        throw new Error('Could not send verification email');
      }
    }
  }
}

