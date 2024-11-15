import { NextResponse } from "next/server";
import mammoth from "mammoth";
import pdf from "pdf-parse";
import { openai } from "@/lib/utils/openAIClient";

// Configure accepted file types and their processors
const FILE_PROCESSORS = {
  "application/pdf": async (buffer: Buffer) => {
    const data = await pdf(buffer);
    return data.text;
  },
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
    async (buffer: Buffer) => {
      const result = await mammoth.extractRawText({ buffer });
      return result.value;
    },
} as const;

type FileType = keyof typeof FILE_PROCESSORS;

const ANALYSIS_PROMPT = `
  Analyze the following document and extract:

  - All monetary amounts (including their currency), what they are for, and where they appear
  - All tasks, deliverables, and obligations (including descriptions, due dates, responsible parties, and details)

  Your response should include only a JSON object with two properties, an "amounts" array and a "tasks" arrays, each related to their respective data, nothing else other than that should be included alongside your answer, example below:

  {
    "amounts": [
      {
        "amount": "$1.500",
        "currency": "USD",
        "for": "Full compensation for the services provided under this agreement",
        "location": "Section 2.1"
      }
    ],
    "tasks": [
      "Create and deliver one high-quality, professionally photographed image featuring SparkleFizzCo.’s flagship beverage, SparkleFizz Original Citrus.",
      "Deliver one primary image and two social media adaptations optimized for Instagram.",
      "Submit the final image for Brand's approval."
    ]
  }

  Be sure to strictly follow the data structure exemplified above, and to start all sentences with an uppercase letter.

  Below you will find the content for the document to be analyzed:
`;

export async function POST(req: Request) {
  if (!req.body) {
    return NextResponse.json({ error: "No body provided" }, { status: 400 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Check if file type is supported
    if (!(file.type in FILE_PROCESSORS)) {
      return NextResponse.json(
        { error: "Unsupported file type. Please upload a PDF or DOCX file." },
        { status: 400 }
      );
    }

    // Process file
    const buffer = Buffer.from(await file.arrayBuffer());
    const textContent = await FILE_PROCESSORS[file.type as FileType](buffer);

    // Analyze with OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: `${ANALYSIS_PROMPT} ${textContent}`,
        },
      ],
      temperature: 0,
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(completion.choices[0].message.content || "{}");
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error analyzing document:", error);
    return NextResponse.json(
      {
        error: "Failed to analyze document",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: "Send a POST request with a PDF or DOCX file to analyze",
    supportedTypes: Object.keys(FILE_PROCESSORS),
  });
}
