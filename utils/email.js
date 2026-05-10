import nodemailer from "nodemailer";
import logger from "./logger.js";

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;
  const { GMAIL_USER, GMAIL_APP_PASSWORD } = process.env;
  if (!GMAIL_USER || !GMAIL_APP_PASSWORD) return null;
  transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user: GMAIL_USER, pass: GMAIL_APP_PASSWORD },
    tls: { rejectUnauthorized: false },
  });
  return transporter;
}

export async function sendEmail({ to, subject, html }) {
  const t = getTransporter();
  if (!t) {
    logger.warn(`Email skipped (GMAIL_USER / GMAIL_APP_PASSWORD not set): "${subject}" → ${to}`);
    return { success: false, error: "Gmail not configured" };
  }
  const FROM = `"${process.env.GMAIL_FROM_NAME || "Doctor Book"}" <${process.env.GMAIL_USER}>`;

  const text = html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();

  try {
    const info = await t.sendMail({ from: FROM, to, subject, html, text });
    logger.info(`Email sent → ${to}: "${subject}" (${info.messageId})`);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    const detail = err.message || "Unknown error";
    logger.error(`Email failed → ${to}: ${detail}`);
    return { success: false, error: detail };
  }
}

// ── Shared HTML wrapper ────────────────────────────────────────────────────────

const base = (content) => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Doctor Book</title>
</head>
<body style="margin:0;padding:0;background:#f0f4f8;font-family:'Segoe UI',Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f4f8;padding:40px 16px">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#0d9488 0%,#0f766e 100%);padding:32px 40px;text-align:center">
              <table cellpadding="0" cellspacing="0" style="margin:0 auto">
                <tr>
                  <td style="background:rgba(255,255,255,0.2);border-radius:10px;padding:8px 20px;display:inline-block">
                    <span style="color:#ffffff;font-weight:800;font-size:1.2rem;letter-spacing:0.04em">
                      Doctor Book
                    </span>
                  </td>
                </tr>
              </table>
              <p style="margin:12px 0 0;color:rgba(255,255,255,0.8);font-size:0.85rem">
                Specialist Appointment Platform
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px">
              ${content}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f8fafc;padding:24px 40px;border-top:1px solid #e2e8f0;text-align:center">
              <p style="margin:0;font-size:0.75rem;color:#94a3b8">
                © Doctor Book · Trusted Specialist Booking &amp; Coordinated Patient Care
              </p>
              <p style="margin:6px 0 0;font-size:0.75rem;color:#94a3b8">
                <a href="mailto:care@doctorbook.com" style="color:#0d9488;text-decoration:none">care@doctorbook.com</a>
                &nbsp;·&nbsp; 080-45309999
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

const infoBox = (color, borderColor, content) =>
  `<table width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0">
    <tr>
      <td style="background:${color};border:1px solid ${borderColor};border-radius:10px;padding:18px 20px">
        ${content}
      </td>
    </tr>
  </table>`;

const divider = () =>
  `<table width="100%" cellpadding="0" cellspacing="0" style="margin:28px 0">
    <tr><td style="border-top:1px solid #e2e8f0"></td></tr>
  </table>`;

// ── Email templates ────────────────────────────────────────────────────────────

export const emailTemplates = {

  applicationReceived: (name) =>
    base(`
      <h2 style="margin:0 0 8px;color:#1e293b;font-size:1.4rem">Application Received 📋</h2>
      <p style="margin:0 0 20px;color:#64748b;font-size:0.95rem">Your journey to join our specialist network has begun.</p>

      <p style="color:#475569;line-height:1.75;margin:0 0 16px">
        Dear <strong style="color:#1e293b">${name}</strong>,
      </p>
      <p style="color:#475569;line-height:1.75;margin:0 0 20px">
        Thank you for applying to join Doctor Book as a verified specialist. We have successfully received your application
        and all supporting documents you uploaded.
      </p>

      ${infoBox("#f0fdf9", "#99f6e4", `
        <p style="margin:0 0 10px;color:#0f766e;font-weight:700;font-size:0.95rem">What happens next?</p>
        <table cellpadding="0" cellspacing="0" width="100%">
          <tr>
            <td style="padding:4px 0;color:#0f766e;font-size:0.88rem">
              ✅ &nbsp;Our admin team will verify your credentials and license number
            </td>
          </tr>
          <tr>
            <td style="padding:4px 0;color:#0f766e;font-size:0.88rem">
              ✅ &nbsp;Uploaded documents will be reviewed for authenticity
            </td>
          </tr>
          <tr>
            <td style="padding:4px 0;color:#0f766e;font-size:0.88rem">
              ✅ &nbsp;You will receive an email notification once the review is complete
            </td>
          </tr>
          <tr>
            <td style="padding:4px 0;color:#0f766e;font-size:0.88rem">
              ✅ &nbsp;Review typically takes 1–3 business days
            </td>
          </tr>
        </table>
      `)}

      <p style="color:#475569;line-height:1.75;margin:0">
        If you have any questions or need to update your submitted information, please contact us at
        <a href="mailto:care@doctorbook.com" style="color:#0d9488;font-weight:600">care@doctorbook.com</a>.
      </p>

      ${divider()}

      <p style="color:#94a3b8;font-size:0.8rem;margin:0;text-align:center">
        Please do not reply to this email. Use the support address above for queries.
      </p>
    `),

  approved: (name, email) =>
    base(`
      <h2 style="margin:0 0 8px;color:#1e293b;font-size:1.4rem">🎉 Your Account is Approved!</h2>
      <p style="margin:0 0 20px;color:#64748b;font-size:0.95rem">Welcome to the Doctor Book specialist network.</p>

      <p style="color:#475569;line-height:1.75;margin:0 0 16px">
        Dear <strong style="color:#1e293b">Dr. ${name}</strong>,
      </p>
      <p style="color:#475569;line-height:1.75;margin:0 0 20px">
        Congratulations! Your doctor profile has been thoroughly verified and approved by our admin team.
        You can now log in to your dashboard and start managing appointments.
      </p>

      ${infoBox("#f0fdf9", "#99f6e4", `
        <p style="margin:0 0 12px;color:#0f766e;font-weight:700;font-size:0.95rem">Your Login Credentials</p>
        <table cellpadding="0" cellspacing="0" width="100%">
          <tr>
            <td style="padding:3px 0;color:#0f766e;font-size:0.9rem">
              <strong>Email:</strong> &nbsp;${email}
            </td>
          </tr>
          <tr>
            <td style="padding:3px 0;color:#0f766e;font-size:0.9rem">
              <strong>Password:</strong> &nbsp;<em>The password you set during registration</em>
            </td>
          </tr>
        </table>
      `)}

      ${infoBox("#f8fafc", "#e2e8f0", `
        <p style="margin:0 0 10px;color:#334155;font-weight:700;font-size:0.9rem">You can now:</p>
        <table cellpadding="0" cellspacing="0" width="100%">
          <tr><td style="padding:3px 0;color:#475569;font-size:0.88rem">🏥 &nbsp;Access your Doctor Dashboard</td></tr>
          <tr><td style="padding:3px 0;color:#475569;font-size:0.88rem">📅 &nbsp;Manage patient appointment requests</td></tr>
          <tr><td style="padding:3px 0;color:#475569;font-size:0.88rem">📝 &nbsp;Update your profile and availability slots</td></tr>
          <tr><td style="padding:3px 0;color:#475569;font-size:0.88rem">🔍 &nbsp;Appear in patient search results</td></tr>
        </table>
      `)}

      <table cellpadding="0" cellspacing="0" style="margin:24px 0">
        <tr>
          <td style="background:#0d9488;border-radius:8px;padding:12px 28px;text-align:center">
            <a href="${process.env.CLIENT_URL || "http://localhost:5173"}/login"
               style="color:#ffffff;font-weight:700;font-size:0.95rem;text-decoration:none">
              Log in to Your Dashboard →
            </a>
          </td>
        </tr>
      </table>

      <p style="color:#475569;line-height:1.75;margin:0">
        Welcome aboard, Doctor! We are proud to have you in our network.
      </p>
    `),

  rejected: (name, reason) =>
    base(`
      <h2 style="margin:0 0 8px;color:#1e293b;font-size:1.4rem">Application Status Update</h2>
      <p style="margin:0 0 20px;color:#64748b;font-size:0.95rem">An update regarding your Doctor Book application.</p>

      <p style="color:#475569;line-height:1.75;margin:0 0 16px">
        Dear <strong style="color:#1e293b">${name}</strong>,
      </p>
      <p style="color:#475569;line-height:1.75;margin:0 0 20px">
        Thank you for your interest in joining Doctor Book. After a thorough review of your application and submitted
        documents, we regret to inform you that we are unable to approve your application at this time.
      </p>

      ${reason ? infoBox("#fff5f5", "#fecaca", `
        <p style="margin:0 0 8px;color:#dc2626;font-weight:700;font-size:0.9rem">Reason for rejection:</p>
        <p style="margin:0;color:#b91c1c;font-size:0.88rem;line-height:1.6">${reason}</p>
      `) : ""}

      ${infoBox("#fefce8", "#fde68a", `
        <p style="margin:0 0 8px;color:#92400e;font-weight:700;font-size:0.9rem">Next steps:</p>
        <table cellpadding="0" cellspacing="0" width="100%">
          <tr><td style="padding:3px 0;color:#78350f;font-size:0.88rem">• Review the reason above and address any issues</td></tr>
          <tr><td style="padding:3px 0;color:#78350f;font-size:0.88rem">• Gather any additional required documentation</td></tr>
          <tr><td style="padding:3px 0;color:#78350f;font-size:0.88rem">• Contact our support team to discuss reapplication</td></tr>
        </table>
      `)}

      <p style="color:#475569;line-height:1.75;margin:0">
        If you believe this decision was made in error or you would like to provide additional information,
        please contact our support team at
        <a href="mailto:care@doctorbook.com" style="color:#0d9488;font-weight:600">care@doctorbook.com</a>.
      </p>
    `),

  infoRequested: (name, message) =>
    base(`
      <h2 style="margin:0 0 8px;color:#1e293b;font-size:1.4rem">Additional Information Required</h2>
      <p style="margin:0 0 20px;color:#64748b;font-size:0.95rem">Our team needs a little more from you to continue.</p>

      <p style="color:#475569;line-height:1.75;margin:0 0 16px">
        Dear <strong style="color:#1e293b">${name}</strong>,
      </p>
      <p style="color:#475569;line-height:1.75;margin:0 0 20px">
        Our admin team is actively reviewing your Doctor Book application. To complete the verification process,
        we need some additional information or documents from you.
      </p>

      ${infoBox("#fefce8", "#fde68a", `
        <p style="margin:0 0 8px;color:#92400e;font-weight:700;font-size:0.9rem">Information or documents needed:</p>
        <p style="margin:0;color:#78350f;font-size:0.88rem;line-height:1.7">${message}</p>
      `)}

      ${infoBox("#f0fdf9", "#99f6e4", `
        <p style="margin:0 0 8px;color:#0f766e;font-weight:700;font-size:0.9rem">How to respond:</p>
        <table cellpadding="0" cellspacing="0" width="100%">
          <tr><td style="padding:3px 0;color:#0f766e;font-size:0.88rem">• Reply to this email with the requested details</td></tr>
          <tr><td style="padding:3px 0;color:#0f766e;font-size:0.88rem">• Or email us at <strong>care@doctorbook.com</strong></td></tr>
          <tr><td style="padding:3px 0;color:#0f766e;font-size:0.88rem">• Your application remains active while we await your response</td></tr>
        </table>
      `)}

      <p style="color:#475569;line-height:1.75;margin:0">
        We look forward to hearing from you. Thank you for your patience.
      </p>
    `),

  forgotPassword: (name, resetUrl) =>
    base(`
      <h2 style="margin:0 0 8px;color:#1e293b;font-size:1.4rem">Reset Your Password</h2>
      <p style="margin:0 0 20px;color:#64748b;font-size:0.95rem">We received a request to reset your Doctor Book password.</p>

      <p style="color:#475569;line-height:1.75;margin:0 0 16px">
        Dear <strong style="color:#1e293b">${name}</strong>,
      </p>
      <p style="color:#475569;line-height:1.75;margin:0 0 20px">
        Click the button below to set a new password. This link is valid for <strong>1 hour</strong>.
      </p>

      <table cellpadding="0" cellspacing="0" style="margin:24px 0">
        <tr>
          <td style="background:#0d9488;border-radius:8px;padding:12px 28px;text-align:center">
            <a href="${resetUrl}" style="color:#ffffff;font-weight:700;font-size:0.95rem;text-decoration:none">
              Reset Password →
            </a>
          </td>
        </tr>
      </table>

      ${infoBox("#fefce8", "#fde68a", `
        <p style="margin:0;color:#92400e;font-size:0.88rem;line-height:1.6">
          If you did not request a password reset, you can safely ignore this email.
          Your password will remain unchanged.
        </p>
      `)}

      <p style="color:#94a3b8;font-size:0.8rem;margin:16px 0 0;text-align:center">
        This link expires in 1 hour. If it has expired, request a new one from the login page.
      </p>
    `),
};
