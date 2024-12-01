const baseUrl = process.env.NEXT_PUBLIC_VERCEL_URL
  ? process.env.NEXT_PUBLIC_VERCEL_URL
  : "http://localhost:3000";

export default async function Transaction({
  params,
}: {
  params: { id: string };
}) {
  const response = await fetch(
    `${baseUrl}/api/wallet/transactions/${params.id}`,
  );
  const parsedResponse = await response.json();

  if (parsedResponse.error) {
    return (
      <h2 className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight first:mt-0">
        Invalid transaction
      </h2>
    );
  }

  const transactionCreationTimestamp = new Date(
    parsedResponse.transaction.createDate,
  );
  const creationDate = transactionCreationTimestamp.toLocaleDateString();
  const creationTime = transactionCreationTimestamp.toLocaleTimeString();

  const transactionLastUpdateTimestamp = new Date(
    parsedResponse.transaction.updateDate,
  );
  const lastUpdateDate = transactionLastUpdateTimestamp.toLocaleDateString();
  const lastUpdateTime = transactionLastUpdateTimestamp.toLocaleTimeString();

  return (
    <>
      <h2 className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight mb-4 first:mt-0">
        Transaction details
      </h2>
      <h3 className="scroll-m-20 text-2xl font-semibold tracking-tight">ID</h3>
      <p className="text-sm text-muted-foreground mb-4">
        {parsedResponse.transaction.id}
      </p>
      <h3 className="scroll-m-20 text-2xl font-semibold tracking-tight">
        Amount transferred
      </h3>
      <p className="text-sm text-muted-foreground mb-4">
        {parsedResponse.transaction.amounts[0]}
      </p>
      <h3 className="scroll-m-20 text-2xl font-semibold tracking-tight">
        State
      </h3>
      <p className="text-sm text-muted-foreground mb-4">
        {parsedResponse.transaction.state}
      </p>
      <h3 className="scroll-m-20 text-2xl font-semibold tracking-tight">
        Creation date
      </h3>
      <p className="text-sm text-muted-foreground mb-4">
        {creationDate} {creationTime}
      </p>
      <h3 className="scroll-m-20 text-2xl font-semibold tracking-tight">
        Blockchain
      </h3>
      <p className="text-sm text-muted-foreground mb-4">
        {parsedResponse.transaction.blockchain}
      </p>
      <h3 className="scroll-m-20 text-2xl font-semibold tracking-tight">
        Transaction type
      </h3>
      <p className="text-sm text-muted-foreground mb-4">
        {parsedResponse.transaction.transactionType}
      </p>
      <h3 className="scroll-m-20 text-2xl font-semibold tracking-tight">
        Last updated
      </h3>
      <p className="text-sm text-muted-foreground mb-4">
        {lastUpdateDate} {lastUpdateTime}
      </p>
    </>
  );
}
