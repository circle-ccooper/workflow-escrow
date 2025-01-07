export const createRampSession = async (
  rampType: "BUY" | "SELL",
  walletAddress: string,
) => {
  if (!process.env.CIRCLE_BLOCKCHAIN) {
    throw new Error("CIRCLE_BLOCKCHAIN environment variable is not set");
  }

  const response = await fetch("https://api.circle.com/v1/w3s/ramp/sessions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${process.env.CIRCLE_API_KEY}`,
    },
    body: JSON.stringify({
      mode: "QUOTE_SCREEN",
      rampType,
      walletAddress: {
        address: walletAddress,
        blockchain: process.env.CIRCLE_BLOCKCHAIN,
      },
      country: {
        country: "US",
      },
      fiatAmount: {
        currency: "USD",
      },
      cryptoAmount: {
        currency: "USDC",
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Circle API error: ${await response.text()}`);
  }

  const parsedResponse = await response.json();

  if (!parsedResponse.data) {
    throw new Error("Invalid response from Circle API");
  }

  return parsedResponse;
};
