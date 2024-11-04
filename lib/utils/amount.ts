export const parseAmount = (amountStr: string): number => {
  const cleanAmount = amountStr
    .replace(/[()]/g, "")
    .replace(/[$€£,\s]/g, "")
    .replace(/−/g, "-");

  // Parse the amount
  const amount = parseFloat(cleanAmount);

  if (Number.isNaN(amount) || amount <= 0) {
    throw new Error(`Invalid amount: ${amountStr}`);
  }

  return amount;
};
