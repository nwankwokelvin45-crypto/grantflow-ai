import { Resend } from "resend";

let _resend: Resend | undefined;
function getResend(): Resend {
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY);
  return _resend;
}
const resend = new Proxy({} as Resend, {
  get(_, prop: string | symbol) {
    return (getResend() as unknown as Record<string | symbol, unknown>)[prop];
  },
});
const FROM = "Grant2Fund'n <noreply@grantflow.ai>";

export async function sendPasswordResetEmail(to: string, resetUrl: string) {
  await resend.emails.send({
    from: FROM,
    to,
    subject: "Reset your Grant2Fund'n password",
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#1B2B4B">
        <div style="background:#1B2B4B;padding:24px 32px;border-radius:12px 12px 0 0">
          <h1 style="color:#C4974A;margin:0;font-size:22px">Grant2Fund'n</h1>
        </div>
        <div style="background:#fff;padding:32px;border-radius:0 0 12px 12px;border:1px solid #e8e4de;border-top:none">
          <h2 style="margin-top:0">Reset your password</h2>
          <p>We received a request to reset your password. Click the button below to choose a new one. This link expires in 1 hour.</p>
          <p style="margin:24px 0">
            <a href="${resetUrl}" style="background:linear-gradient(135deg,#2A3F6B,#1B2B4B);color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;display:inline-block">
              Reset Password →
            </a>
          </p>
          <p style="color:#8B8577;font-size:13px">If you didn't request this, you can safely ignore this email. Your password won't change.</p>
        </div>
      </div>
    `,
  });
}

export async function sendVerificationEmail(to: string, verifyUrl: string) {
  await resend.emails.send({
    from: FROM,
    to,
    subject: "Verify your Grant2Fund'n email",
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#1B2B4B">
        <div style="background:#1B2B4B;padding:24px 32px;border-radius:12px 12px 0 0">
          <h1 style="color:#C4974A;margin:0;font-size:22px">Grant2Fund'n</h1>
        </div>
        <div style="background:#fff;padding:32px;border-radius:0 0 12px 12px;border:1px solid #e8e4de;border-top:none">
          <h2 style="margin-top:0">Verify your email</h2>
          <p>Click below to verify your email address and activate your account.</p>
          <p style="margin:24px 0">
            <a href="${verifyUrl}" style="background:linear-gradient(135deg,#2A3F6B,#1B2B4B);color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;display:inline-block">
              Verify Email →
            </a>
          </p>
          <p style="color:#8B8577;font-size:13px">This link expires in 24 hours.</p>
        </div>
      </div>
    `,
  });
}

export async function sendWelcomeEmail(to: string, name: string) {
  await resend.emails.send({
    from: FROM,
    to,
    subject: "Welcome to Grant2Fund'n",
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#1B2B4B">
        <div style="background:#1B2B4B;padding:24px 32px;border-radius:12px 12px 0 0">
          <h1 style="color:#C4974A;margin:0;font-size:22px">Grant2Fund'n</h1>
        </div>
        <div style="background:#fff;padding:32px;border-radius:0 0 12px 12px;border:1px solid #e8e4de;border-top:none">
          <h2 style="margin-top:0">Welcome, ${name}!</h2>
          <p>Your account is ready. Grant2Fund'n helps nonprofits in BC and Alberta write compelling, compliant grant applications faster with the help of AI.</p>
          <p style="margin:24px 0">
            <a href="${process.env.AUTH_URL}/dashboard"
              style="background:linear-gradient(135deg,#2A3F6B,#1B2B4B);color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;display:inline-block">
              Go to Dashboard →
            </a>
          </p>
          <p style="color:#8B8577;font-size:13px">If you didn't create this account, you can ignore this email.</p>
        </div>
      </div>
    `,
  });
}

export async function sendInviteEmail(
  to: string,
  inviterName: string,
  orgName: string,
  inviteUrl: string
) {
  await resend.emails.send({
    from: FROM,
    to,
    subject: `${inviterName} invited you to ${orgName} on Grant2Fund'n`,
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#1B2B4B">
        <div style="background:#1B2B4B;padding:24px 32px;border-radius:12px 12px 0 0">
          <h1 style="color:#C4974A;margin:0;font-size:22px">Grant2Fund'n</h1>
        </div>
        <div style="background:#fff;padding:32px;border-radius:0 0 12px 12px;border:1px solid #e8e4de;border-top:none">
          <h2 style="margin-top:0">You've been invited!</h2>
          <p><strong>${inviterName}</strong> has invited you to join <strong>${orgName}</strong> on Grant2Fund'n.</p>
          <p>Grant2Fund'n helps nonprofits write compliant, compelling grant applications faster.</p>
          <p style="margin:24px 0">
            <a href="${inviteUrl}"
              style="background:linear-gradient(135deg,#2A3F6B,#1B2B4B);color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;display:inline-block">
              Accept Invitation →
            </a>
          </p>
          <p style="color:#8B8577;font-size:13px">This invitation expires in 7 days. If you were not expecting this, you can ignore this email.</p>
        </div>
      </div>
    `,
  });
}

export async function sendWeeklyDigest(
  to: string,
  name: string,
  upcomingDeadlines: { funderName: string; daysLeft: number }[],
  followUps: { grantTitle: string; daysLeft: number }[]
) {
  const deadlineRows = upcomingDeadlines
    .slice(0, 5)
    .map(
      (d) =>
        `<tr><td style="padding:6px 0;border-bottom:1px solid #e8e4de">${d.funderName}</td>
         <td style="padding:6px 0;border-bottom:1px solid #e8e4de;text-align:right;color:${d.daysLeft <= 14 ? "#DC2626" : "#C4974A"};font-weight:600">${d.daysLeft}d left</td></tr>`
    )
    .join("");

  const followUpRows = followUps
    .slice(0, 5)
    .map(
      (f) =>
        `<tr><td style="padding:6px 0;border-bottom:1px solid #e8e4de">${f.grantTitle}</td>
         <td style="padding:6px 0;border-bottom:1px solid #e8e4de;text-align:right;color:#C4974A;font-weight:600">${f.daysLeft < 0 ? `${Math.abs(f.daysLeft)}d overdue` : `in ${f.daysLeft}d`}</td></tr>`
    )
    .join("");

  await resend.emails.send({
    from: FROM,
    to,
    subject: "Your weekly Grant2Fund'n digest",
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#1B2B4B">
        <div style="background:#1B2B4B;padding:24px 32px;border-radius:12px 12px 0 0">
          <h1 style="color:#C4974A;margin:0;font-size:22px">Grant2Fund'n — Weekly Digest</h1>
        </div>
        <div style="background:#fff;padding:32px;border-radius:0 0 12px 12px;border:1px solid #e8e4de;border-top:none">
          <p>Hi ${name}, here's your weekly summary:</p>
          ${
            deadlineRows
              ? `<h3 style="margin-bottom:8px">Upcoming Funder Deadlines</h3>
                 <table style="width:100%;border-collapse:collapse;font-size:14px">${deadlineRows}</table>`
              : ""
          }
          ${
            followUpRows
              ? `<h3 style="margin:24px 0 8px">Follow-up Reminders</h3>
                 <table style="width:100%;border-collapse:collapse;font-size:14px">${followUpRows}</table>`
              : ""
          }
          <p style="margin:24px 0">
            <a href="${process.env.AUTH_URL}/dashboard"
              style="background:linear-gradient(135deg,#2A3F6B,#1B2B4B);color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;display:inline-block">
              Open Dashboard →
            </a>
          </p>
          <p style="color:#8B8577;font-size:12px">To unsubscribe from weekly digests, update your notification settings in Grant2Fund'n.</p>
        </div>
      </div>
    `,
  });
}
