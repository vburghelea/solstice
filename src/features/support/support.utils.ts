export const supportAttachmentConfig = {
  allowedTypes: [
    "application/pdf",
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "text/plain",
    "text/csv",
    "application/octet-stream",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ],
  maxSizeBytes: 10 * 1024 * 1024,
  maxFiles: 3,
};

export const supportAttachmentAccept = supportAttachmentConfig.allowedTypes.join(",");

const isMimeTypeAllowed = (mimeType: string, allowedTypes?: string[]) => {
  if (!allowedTypes || allowedTypes.length === 0) return true;

  const normalizedMime = mimeType.toLowerCase().trim();

  return allowedTypes.some((allowed) => {
    const normalizedAllowed = allowed.toLowerCase().trim();
    if (normalizedMime === normalizedAllowed) return true;
    if (normalizedAllowed.endsWith("/*")) {
      const category = normalizedAllowed.slice(0, -2);
      return normalizedMime.startsWith(`${category}/`);
    }
    return false;
  });
};

export const validateSupportAttachment = (file: {
  fileName: string;
  mimeType: string;
  sizeBytes: number;
}) => {
  if (!isMimeTypeAllowed(file.mimeType, supportAttachmentConfig.allowedTypes)) {
    return {
      valid: false,
      error: `File type "${file.mimeType}" is not allowed.`,
    };
  }

  if (file.sizeBytes > supportAttachmentConfig.maxSizeBytes) {
    const maxMb = Math.round(supportAttachmentConfig.maxSizeBytes / (1024 * 1024));
    const fileMb = Math.round((file.sizeBytes / (1024 * 1024)) * 10) / 10;
    return {
      valid: false,
      error: `File size (${fileMb}MB) exceeds ${maxMb}MB limit.`,
    };
  }

  return { valid: true };
};
