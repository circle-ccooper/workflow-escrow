export async function uploadContractDocument(
    file: File,
    contractData?: {
      walletId?: string;
      contractAddress?: string;
      abiFunctionSignature?: string;
      abiParameters?: any[];
      feeLevel?: string;
    }
  ) {
    const formData = new FormData();
    formData.append("document", file);
    
    if (contractData) {
      formData.append("contractData", JSON.stringify(contractData));
    }
  
    const response = await fetch("/api/contract/process", {
      method: "POST",
      body: formData
    });
  
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to process contract document");
    }
  
    return response.json();
  }
  
  // Example usage:
  /*
  const file = document.querySelector('input[type="file"]').files[0];
  try {
    const result = await uploadContractDocument(file, {
      walletId: "wallet_123",
      contractAddress: "0x1234...",
      abiFunctionSignature: "transfer(address,uint256)",
      abiParameters: ["0xabcd...", "1000000000000000000"]
    });
    
    console.log("Extracted Info:", result.contractInfo);
    console.log("Execution Result:", result.executionResult);
  } catch (error) {
    console.error("Error:", error.message);
  }
  */