import nodemailer from "nodemailer";
import { env } from "../config/env";

let transporter: nodemailer.Transporter | null = null;

const smtpConfigured = Boolean(
  env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS && env.SMTP_FROM,
);

if (smtpConfigured) {
  transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_PORT === 465,
    requireTLS: env.SMTP_PORT === 587,
    connectionTimeout: 30000,
    greetingTimeout: 30000,
    socketTimeout: 30000,
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASS,
    },
  });
}

/**
 * Common helper to dispatch emails via Nodemailer.
 * Development can log email content when SMTP is not configured.
 * Production must always use a configured SMTP transporter.
 */
async function sendMailHelper(options: {
  to: string;
  subject: string;
  text: string;
  html: string;
  logTag: string;
}): Promise<void> {
  // Development-only fallback. Never log OTPs in production.
  if (!transporter) {
    if (env.NODE_ENV === "production") {
      console.error(
        `Cannot send ${options.logTag} email: SMTP is not configured.`,
      );
      throw new Error("Email service is not configured");
    }

    console.log(`\n======================================================`);
    console.log(`📧 [DEV EMAIL ${options.logTag}] To: ${options.to}`);
    console.log(`📝 Subject: ${options.subject}`);
    console.log(`📄 Text:\n${options.text.trim()}`);
    console.log(`======================================================\n`);

    return;
  }

  try {
    await transporter.sendMail({
      from: env.SMTP_FROM,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
    });

    console.log(`${options.logTag} email sent successfully.`);
  } catch (error) {
    const smtpError = error as {
      code?: string;
      command?: string;
      message?: string;
    };

    // Log diagnostic information, never email content or OTP values.
    console.error(`Failed to send ${options.logTag} email via SMTP:`, {
      code: smtpError.code,
      command: smtpError.command,
      message: smtpError.message,
    });

    if (env.NODE_ENV === "production") {
      throw new Error(`Could not send ${options.logTag} email`);
    }
  }
}

/**
 * 1. OTP Verification Email
 */
export async function sendOtpEmail(email: string, otp: string): Promise<void> {
  const subject = "Your CampusLoop Verification Code";

  const text = `Your CampusLoop one-time verification code is: ${otp}
This code will expire in 10 minutes.
If you did not request this code, please ignore this email.`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 500px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
      <h2 style="color: #059669;">CampusLoop Verification</h2>
      <p>Use the 6-digit code below to securely sign in to CampusLoop:</p>
      <div style="font-size: 32px; font-weight: bold; letter-spacing: 4px; padding: 12px 0; color: #1e293b;">
        ${otp}
      </div>
      <p style="color: #64748b; font-size: 14px;">This code is valid for 10 minutes. Never share this code with anyone.</p>
    </div>
  `;

  await sendMailHelper({
    to: email,
    subject,
    text,
    html,
    logTag: "OTP",
  });
}

/**
 * 2. Lost & Found Match Notification Email
 */
export async function sendMatchEmail(
  toEmail: string,
  params: {
    userName: string;
    itemTitle: string;
    matchTitle: string;
    score: number;
    reasons: string[];
    matchUrl?: string;
  },
): Promise<void> {
  const scorePercent = Math.round(params.score * 100);
  const subject = `Possible Item Match Found! (${scorePercent}% match) - CampusLoop`;
  const reasonsText = params.reasons.map((r) => `- ${r}`).join("\n");
  const reasonsHtml = params.reasons.map((r) => `<li>${r}</li>`).join("");
  const viewUrl = params.matchUrl || env.CLIENT_URL;

  const text = `Hi ${params.userName},

We found a potential match for your item "${params.itemTitle}"!

Matched Item: "${params.matchTitle}"
Match Score: ${scorePercent}%

Reasons for match:
${reasonsText}

View details: ${viewUrl}

— The CampusLoop Team`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 560px; margin: auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 8px;">
      <h2 style="color: #059669; margin-top: 0;">🎉 Potential Item Match!</h2>
      <p>Hi <strong>${params.userName}</strong>,</p>
      <p>CampusLoop's auto-matching engine detected a high-probability match for your item <strong>"${params.itemTitle}"</strong>.</p>
      <div style="background-color: #f8fafc; border-left: 4px solid #10b981; padding: 14px 16px; margin: 16px 0; border-radius: 4px;">
        <p style="margin: 0; font-size: 16px; font-weight: 600; color: #0f172a;">Matched Item: ${params.matchTitle}</p>
        <p style="margin: 4px 0 0; color: #059669; font-weight: bold;">Match Confidence: ${scorePercent}%</p>
      </div>
      <p style="font-weight: 600; margin-bottom: 6px;">Why this is a match:</p>
      <ul style="color: #334155; margin-top: 0; padding-left: 20px;">
        ${reasonsHtml}
      </ul>
      <div style="margin-top: 24px;">
        <a href="${viewUrl}" style="background-color: #059669; color: #ffffff; text-decoration: none; padding: 10px 20px; border-radius: 6px; font-weight: 600; display: inline-block;">
          View & Verify Match
        </a>
      </div>
      <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
      <p style="color: #94a3b8; font-size: 12px; margin: 0;">You can update your email notification preferences in your CampusLoop profile settings.</p>
    </div>
  `;

  await sendMailHelper({
    to: toEmail,
    subject,
    text,
    html,
    logTag: "MATCH",
  });
}

/**
 * 3. Ride Passenger Joined Email
 */
export async function sendRideJoinEmail(
  toEmail: string,
  params: {
    creatorName: string;
    passengerName: string;
    origin: string;
    destination: string;
    departureTime?: Date | string;
    availableSeats: number;
    rideUrl?: string;
  },
): Promise<void> {
  const subject = "New Passenger Joined Your Ride! - CampusLoop";

  const timeStr = params.departureTime
    ? new Date(params.departureTime).toLocaleString()
    : "Scheduled time";

  const viewUrl = params.rideUrl || `${env.CLIENT_URL}/rides`;

  const text = `Hi ${params.creatorName},

${params.passengerName} has joined your ride from "${params.origin}" to "${params.destination}".

Departure: ${timeStr}
Seats remaining: ${params.availableSeats}

View ride: ${viewUrl}

— The CampusLoop Team`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 560px; margin: auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 8px;">
      <h2 style="color: #2563eb; margin-top: 0;">🚗 New Passenger Joined!</h2>
      <p>Hi <strong>${params.creatorName}</strong>,</p>
      <p><strong>${params.passengerName}</strong> has just reserved a seat on your ride.</p>
      <div style="background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 14px 16px; margin: 16px 0; border-radius: 4px;">
        <p style="margin: 0; font-weight: 600; color: #1e3a8a;">Route: ${params.origin} → ${params.destination}</p>
        <p style="margin: 4px 0 0; color: #3b82f6;">Departure: ${timeStr}</p>
        <p style="margin: 4px 0 0; color: #1e40af;">Available Seats Left: <strong>${params.availableSeats}</strong></p>
      </div>
      <div style="margin-top: 24px;">
        <a href="${viewUrl}" style="background-color: #2563eb; color: #ffffff; text-decoration: none; padding: 10px 20px; border-radius: 6px; font-weight: 600; display: inline-block;">
          View Ride Details
        </a>
      </div>
      <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
      <p style="color: #94a3b8; font-size: 12px; margin: 0;">Manage your notifications in CampusLoop profile settings.</p>
    </div>
  `;

  await sendMailHelper({
    to: toEmail,
    subject,
    text,
    html,
    logTag: "RIDE_JOIN",
  });
}

/**
 * 4. Chat Message Email Notification
 */
export async function sendMessageEmail(
  toEmail: string,
  params: {
    recipientName: string;
    senderName: string;
    messageSnippet: string;
    chatUrl?: string;
  },
): Promise<void> {
  const subject = `New message from ${params.senderName} - CampusLoop`;
  const viewUrl = params.chatUrl || `${env.CLIENT_URL}/chat`;

  const text = `Hi ${params.recipientName},

You have a new message from ${params.senderName}:

"${params.messageSnippet}"

Reply here: ${viewUrl}

— The CampusLoop Team`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 560px; margin: auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 8px;">
      <h2 style="color: #4f46e5; margin-top: 0;">💬 New Chat Message</h2>
      <p>Hi <strong>${params.recipientName}</strong>,</p>
      <p>You received a new message from <strong>${params.senderName}</strong>:</p>
      <div style="background-color: #f5f3ff; border-left: 4px solid #6366f1; padding: 14px 16px; margin: 16px 0; border-radius: 4px; font-style: italic; color: #312e81;">
        "${params.messageSnippet}"
      </div>
      <div style="margin-top: 24px;">
        <a href="${viewUrl}" style="background-color: #4f46e5; color: #ffffff; text-decoration: none; padding: 10px 20px; border-radius: 6px; font-weight: 600; display: inline-block;">
          Reply on CampusLoop
        </a>
      </div>
      <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
      <p style="color: #94a3b8; font-size: 12px; margin: 0;">To mute chat email notifications, visit your notification preferences.</p>
    </div>
  `;

  await sendMailHelper({
    to: toEmail,
    subject,
    text,
    html,
    logTag: "CHAT_MESSAGE",
  });
}
