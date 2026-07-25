/**
 * Transactional email via Azure Communication Services (ACS) Email. Server-only.
 * Two uses: magic-link delivery (called from the Auth.js provider) and internal
 * notifications to the team. Copy follows the brand voice. No em dashes.
 */
import "server-only";
import { EmailClient } from "@azure/communication-email";

import { env } from "@/lib/env";

const client = new EmailClient(env.ACS_CONNECTION_STRING);

/** Queue one email through ACS. Throws if ACS rejects the request. */
async function send(opts: {
  to: string;
  subject: string;
  html: string;
  text: string;
}): Promise<void> {
  await client.beginSend({
    senderAddress: env.EMAIL_FROM,
    content: { subject: opts.subject, html: opts.html, plainText: opts.text },
    recipients: { to: [{ address: opts.to }] },
  });
}

const shell = (title: string, body: string) => `
<div style="background:#050508;color:#E8E6E0;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;padding:32px">
  <div style="max-width:520px;margin:0 auto;border:1px solid #181B26;border-radius:8px;padding:28px 24px">
    <div style="font-size:12px;letter-spacing:0.18em;text-transform:uppercase;color:#6A6E7A;margin-bottom:16px">Dirac Robotics</div>
    <h1 style="font-size:18px;font-weight:600;margin:0 0 12px">${title}</h1>
    ${body}
  </div>
</div>`;

/** Called by the Auth.js Resend provider's sendVerificationRequest override. */
export async function sendMagicLink(to: string, url: string): Promise<void> {
  await send({
    to,
    subject: "Confirm your email to vote",
    html: shell(
      "Confirm your email",
      `<p style="font-size:14px;line-height:1.6;color:#C8C5BC;margin:0 0 20px">
        Click below to confirm your email. This verifies your account so your vote counts on the asset leaderboard.
      </p>
      <a href="${url}" style="display:inline-block;background:#E8E6E0;color:#050508;text-decoration:none;font-size:13px;font-weight:600;padding:10px 16px;border-radius:6px">Confirm and continue</a>
      <p style="font-size:12px;line-height:1.6;color:#6A6E7A;margin:20px 0 0">
        If you did not request this, you can ignore this email. The link expires shortly.
      </p>`,
    ),
    text: `Confirm your email to vote on the Dirac asset leaderboard:\n${url}\n\nIf you did not request this, ignore this email.`,
  });
}

export async function notifyNewAssetRequest(input: {
  title: string;
  requesterName: string;
  email: string;
  hasMedia: boolean;
  requestId: string;
}): Promise<void> {
  const link = `${env.SITE_URL}/admin`;
  await send({
    to: env.ADMIN_NOTIFY_EMAIL,
    subject: `New asset request: ${input.title}`,
    html: shell(
      "New asset request",
      `<p style="font-size:14px;line-height:1.7;color:#C8C5BC;margin:0 0 8px">
        <strong>${escapeHtml(input.title)}</strong><br/>
        From ${escapeHtml(input.requesterName)} (${escapeHtml(input.email)})<br/>
        Media attached: ${input.hasMedia ? "yes" : "no"}
      </p>
      <a href="${link}" style="font-size:13px;color:#8ab4ff">Open admin</a>`,
    ),
    text: `New asset request: ${input.title}\nFrom ${input.requesterName} (${input.email})\nMedia: ${input.hasMedia ? "yes" : "no"}\nAdmin: ${link}`,
  });
}

export async function notifyNewLead(input: {
  name: string;
  email: string;
  company?: string | null;
  interest: string;
  sourcePage?: string | null;
}): Promise<void> {
  await send({
    to: env.ADMIN_NOTIFY_EMAIL,
    subject: `New lead (${input.interest}): ${input.name}`,
    html: shell(
      "New lead",
      `<p style="font-size:14px;line-height:1.7;color:#C8C5BC;margin:0">
        ${escapeHtml(input.name)} (${escapeHtml(input.email)})<br/>
        Company: ${escapeHtml(input.company || "n/a")}<br/>
        Interest: ${escapeHtml(input.interest)}<br/>
        Source: ${escapeHtml(input.sourcePage || "n/a")}
      </p>`,
    ),
    text: `New lead: ${input.name} (${input.email})\nCompany: ${input.company || "n/a"}\nInterest: ${input.interest}\nSource: ${input.sourcePage || "n/a"}`,
  });
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
