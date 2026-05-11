import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.BREVO_SMTP_HOST ?? "smtp-relay.brevo.com",
  port: Number(process.env.BREVO_SMTP_PORT ?? 587),
  secure: false,
  auth: {
    user: process.env.BREVO_SMTP_USER!,
    pass: process.env.BREVO_SMTP_PASS!,
  },
});

export type OTPEmailType =
  | "sign-in"
  | "email-verification"
  | "forget-password"
  | "change-email";

export interface SendOTPEmailParams {
  email: string;
  otp: string;
  type: OTPEmailType;
}

const subjectMap: Record<OTPEmailType, string> = {
  "sign-in": "Your Shyft sign-in code",
  "email-verification": "Verify your Shyft account",
  "forget-password": "Reset your Shyft password",
  "change-email": "Confirm your new email address",
};

const headingMap: Record<OTPEmailType, string> = {
  "sign-in": "Sign in to Shyft",
  "email-verification": "Verify your email",
  "forget-password": "Reset your password",
  "change-email": "Confirm email change",
};

const bodyMap: Record<OTPEmailType, string> = {
  "sign-in": "Use the code below to sign in to your Shyft account.",
  "email-verification":
    "Use the code below to verify your email address and activate your account.",
  "forget-password":
    "Use the code below to reset your Shyft account password.",
  "change-email":
    "Use the code below to confirm your new email address.",
};

export async function sendOTPEmail({ email, otp, type }: SendOTPEmailParams) {
  const subject = subjectMap[type];
  const heading = headingMap[type];
  const body = bodyMap[type];

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${subject}</title>
</head>
<body style="margin:0;padding:0;background:#f4f5f7;font-family:Inter,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f5f7;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="480" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
          <tr>
            <td style="background:#e8620a;padding:28px 40px;">
              <p style="margin:0;font-size:22px;font-weight:700;color:#ffffff;letter-spacing:-0.5px;">Shyft</p>
              <p style="margin:4px 0 0;font-size:12px;color:rgba(255,255,255,0.75);">Work tracked. Time respected.</p>
            </td>
          </tr>
          <tr>
            <td style="padding:40px;">
              <h1 style="margin:0 0 8px;font-size:20px;font-weight:600;color:#1a1a1a;">${heading}</h1>
              <p style="margin:0 0 32px;font-size:14px;color:#6b7280;line-height:1.6;">${body}</p>
              <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:24px;text-align:center;margin-bottom:32px;">
                <p style="margin:0 0 8px;font-size:11px;color:#9ca3af;text-transform:uppercase;letter-spacing:2px;font-weight:600;">Your verification code</p>
                <p style="margin:0;font-size:28px;font-weight:700;color:#1a1a1a;letter-spacing:6px;font-family:'Courier New',Courier,monospace;">${otp}</p>
                <p style="margin:8px 0 0;font-size:11px;color:#9ca3af;">Case-insensitive · Letters &amp; numbers</p>
              </div>
              <p style="margin:0;font-size:13px;color:#9ca3af;line-height:1.6;">This code expires in <strong>10 minutes</strong>. If you didn't request this, you can safely ignore this email.</p>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 40px;border-top:1px solid #f3f4f6;">
              <p style="margin:0;font-size:12px;color:#d1d5db;text-align:center;">© ${new Date().getFullYear()} Shyft. All rights reserved.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  await transporter.sendMail({
    from: `"Shyft" <${process.env.BREVO_FROM_EMAIL ?? "noreply@shyft.app"}>`,
    to: email,
    subject,
    html,
  });
}
