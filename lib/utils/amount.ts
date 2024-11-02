export const parseAmount = (amountStr: string): number => {
  // Handle parentheses for negative amounts
  const isNegative = amountStr.startsWith('(') && amountStr.endsWith(')');
  const cleanAmount = amountStr
    .replace(/[()]/g, '')  // Remove parentheses
    .replace(/[$€£,\s]/g, "")  // Remove currency symbols and formatting
    .replace(/−/g, '-');  // Replace minus sign variants

  // Parse the amount
  const amount = parseFloat(cleanAmount);
  return isNegative ? -Math.abs(amount) : amount;

  if (Number.isNaN(amount) || amount <= 0) {
    throw new Error(`Invalid amount: ${amountStr}`);
  }

  return amount;
};
