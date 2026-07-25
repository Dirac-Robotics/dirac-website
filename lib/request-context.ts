import { headers } from "next/headers";

/**
 * Best-effort client IP for rate limiting. On Vercel `x-forwarded-for` is set
 * by the platform. This is a mitigation signal, not a security boundary; IPs
 * can be shared (NAT) or spoofed off-platform, which is why limits are also
 * enforced per account/email.
 */
export async function getClientIp(): Promise<string> {
  const h = await headers();
  const fwd = h.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]!.trim();
  return h.get("x-real-ip")?.trim() || "unknown";
}
