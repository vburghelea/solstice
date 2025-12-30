export const normalizeInviteEmail = (email: string) => email.trim().toLowerCase();

export const generateRegistrationInviteToken = async () => {
  const { randomBytes } = await import("node:crypto");
  return randomBytes(32).toString("hex");
};

export const hashRegistrationInviteToken = async (token: string) => {
  const { createHash } = await import("node:crypto");
  return createHash("sha256").update(token).digest("hex");
};

export const resolveInviteExpiry = (expiresAt?: string | null) => {
  if (expiresAt) {
    return new Date(expiresAt);
  }

  const expiry = new Date();
  expiry.setDate(expiry.getDate() + 7);
  return expiry;
};
