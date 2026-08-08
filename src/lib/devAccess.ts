// Accounts allowed to open the Developer mode screen.
// Add emails (or domains) here to grant access.
const DEV_EMAILS = ["demo@testphi.app"];

const DEV_DOMAINS = ["testphi.com", "testphi.app"];

export function hasDevAccess(email?: string | null): boolean {
  if (!email) return false;
  const e = email.trim().toLowerCase();
  if (DEV_EMAILS.includes(e)) return true;
  const domain = e.split("@")[1];
  return !!domain && DEV_DOMAINS.includes(domain);
}
