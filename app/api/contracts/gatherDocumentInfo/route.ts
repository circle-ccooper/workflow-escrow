import { NextResponse } from "next/server";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { DocxLoader } from "@langchain/community/document_loaders/fs/docx";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { OpenAIEmbeddings, ChatOpenAI } from "@langchain/openai";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { createStuffDocumentsChain } from "langchain/chains/combine_documents";

let vectorStore: MemoryVectorStore | null = null;

const FIXED_PROMPT = ChatPromptTemplate.fromTemplate(`
    Analyze this contract document and extract:
    
    1. All monetary amounts with their currency symbols or codes (like $1500, 1500 USD, €2000)
       For each amount include:
       - The full amount with currency
       - What the payment is for
       - Where it appears in the contract
    
    2. All tasks, deliverables, and obligations with:
       - The task description
       - Due dates (if any)
       - Who is responsible
       - Additional details
    
    Return only a clean JSON response with 'amounts' and 'tasks' arrays. Document content: {context}
    `);

// Helper function to determine file type and get appropriate loader
const getDocumentLoader = (file: File, blob: Blob) => {
  const fileType = file.name.toLowerCase().split(".").pop();

  switch (fileType) {
    case "pdf":
      return new PDFLoader(blob);
    case "docx":
      return new DocxLoader(blob);
    default:
      throw new Error(
        "Unsupported file type. Please upload a PDF or DOCX file."
      );
  }
};

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "File is required" }, { status: 400 });
    }

    // Validate file type
    const fileExtension = file.name.toLowerCase().split(".").pop();
    if (!["pdf", "docx"].includes(fileExtension!)) {
      return NextResponse.json(
        { error: "Unsupported file type. Please upload a PDF or DOCX file." },
        { status: 400 }
      );
    }

    // Convert File to Blob
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    const blob = new Blob([uint8Array], {
      type:
        fileExtension === "pdf"
          ? "application/pdf"
          : "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });

    // Load and process the document
    const loader = getDocumentLoader(file, blob);
    const docs = await loader.load();

    // Split the document into chunks
    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });
    const splits = await textSplitter.splitDocuments(docs);

    // Create vector store
    vectorStore = await MemoryVectorStore.fromDocuments(
      splits,
      new OpenAIEmbeddings({
        openAIApiKey: process.env.OPENAI_API_KEY,
      })
    );

    // Set up the chain
    const llm = new ChatOpenAI({
      openAIApiKey: process.env.OPENAI_API_KEY,
      model: "gpt-4o",
      temperature: 0,
    });

    const chain = await createStuffDocumentsChain({
      llm,
      prompt: FIXED_PROMPT,
    });

    // Process the entire document
    const response = await chain.invoke({
      context: splits,
    });

    return NextResponse.json({
      amounts:
        response.match(
          /[\$€£]\s*\d+(?:,\d{3})*(?:\.\d{2})?|\d+(?:,\d{3})*(?:\.\d{2})?\s*(?:USD|EUR|GBP)/g
        ) || [],
      tasks: response.match(/task[^.!?]*[.!?]/gi) || [],
    });
  } catch (error) {
    console.error("Error processing document:", error);
    return NextResponse.json(
      {
        error: "Failed to process document",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    {
      message:
        "Send a POST request with a PDF or DOCX file to analyze contract details",
    },
    { status: 200 }
  );
}
