import { NextRequest, NextResponse } from "next/server";
import { executeContract } from "@/utils/executeContract";
import OpenAI from "openai";
import { promises as fs } from "fs";
import * as pdfjsLib from "pdfjs-dist";
import mammoth from "mammoth";

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface ContractInfo {
  amount?: string;
  tasks?: string[];
  idempotencyKey?: string;
  entityName?: string;
  walletSetId?: string;
}

async function processDocx(buffer: Buffer): Promise<string> {
  const result = await mammoth.extractRawText({ buffer });
  return result.value;
}

async function processPdf(buffer: Buffer): Promise<string> {
  // Load the PDF document
  const pdf = await pdfjsLib.getDocument(buffer).promise;
  let fullText = "";

  // Process each page
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items.map((item: any) => item.str).join(" ");
    fullText += pageText + "\n";
  }

  return fullText;
}

async function extractContractInfo(content: string): Promise<ContractInfo> {
  const systemPrompt = `
    You are a contract analysis expert. Please extract the following information from the contract:
    1. The total amount/value mentioned in the contract
    2. A list of specific tasks or deliverables mentioned
    
    Format the response as JSON with 'amount' and 'tasks' fields.
  `;

  const response = await openai.chat.completions.create({
    model: "gpt-4", // Using standard GPT-4 instead of Vision
    messages: [
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content: content,
      },
    ],
    max_tokens: 1000,
  });

  try {
    return JSON.parse(response.choices[0].message.content || "{}");
  } catch (error) {
    console.error("Error parsing OpenAI response:", error);
    return {};
  }
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("document") as File;
    const contractData = formData.get("contractData") as string;

    if (!file) {
      return NextResponse.json(
        { error: "Document file is required" },
        { status: 400 }
      );
    }

    // Validate file type
    const fileType = file.name.split(".").pop()?.toLowerCase();
    if (!["pdf", "docx"].includes(fileType || "")) {
      return NextResponse.json(
        { error: "Only PDF and DOCX files are supported" },
        { status: 400 }
      );
    }

    // Process the document
    const buffer = Buffer.from(await file.arrayBuffer());
    let documentContent = "";

    if (fileType === "pdf") {
      documentContent = await processPdf(buffer);
    } else if (fileType === "docx") {
      documentContent = await processDocx(buffer);
    }

    // Extract contract information using OpenAI
    const contractInfo = await extractContractInfo(documentContent);

    // Parse the contract data if provided
    let parsedContractData = {};
    try {
      parsedContractData = JSON.parse(contractData || "{}");
    } catch (error) {
      console.error("Error parsing contract data:", error);
    }

    // Merge extracted info with provided contract data
    const finalContractData = {
      ...parsedContractData,
      extractedInfo: contractInfo,
    };

    // Execute the contract if all required fields are present
    if (
      finalContractData.extractedInfo.amount &&
      finalContractData.extractedInfo.tasks
    ) {
      const executionResult = await executeContract({
        walletId: "wallet_123",
        contractAddress: "0x1234...5678",
        abiFunctionSignature: "transfer(address,uint256)",
        abiParameters: ["0xabcd...efgh", "1000000000000000000"],
        feeLevel: "HIGH",
      });

      return NextResponse.json(
        {
          contractInfo,
          executionResult,
        },
        { status: 201 }
      );
    }

    // If not executing contract, just return the extracted info
    return NextResponse.json(
      {
        contractInfo,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Document processing error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process document" },
      { status: 500 }
    );
  }
}
