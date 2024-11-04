export const FILE_CONSTANTS = {
  MAX_SIZE_5MB: 5 * 1024 * 1024,
  VALID_TYPES: [
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ],
  BUCKET_NAME: "agreement-documents",
} as const;
