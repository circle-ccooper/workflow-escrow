import { AgreementStatus } from "@/types/escrow";

const STATUS_COLORS: Record<AgreementStatus, string> = {
  PENDING: "text-yellow-500 bg-yellow-500/10",
  OPEN: "text-green-500 bg-green-500/10",
  LOCKED: "text-blue-500 bg-blue-500/10",
  CLOSED: "text-destructive bg-destructive/10",
};

export const getStatusColor = (status: AgreementStatus) => {
  return STATUS_COLORS[status] ?? "text-muted-foreground bg-muted";
};

export const formatAmount = (amount: number, currency: string) => {
  if (!Number.isFinite(amount)) {
    throw new Error('Amount must be a valid number');
  }
  if (amount < 0) {
    throw new Error('Amount cannot be negative');
  }
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch (error) {
    throw new Error(`Invalid currency code: ${currency}`);
  }
};
