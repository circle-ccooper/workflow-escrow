import { NextResponse } from "next/server";
import { headers } from "next/headers";

function getBaseUrl(requestHeaders: Headers): string {
  const protocol = process.env.NODE_ENV === "development" ? "http" : "https";
  const host = requestHeaders.get("host") || "localhost:3000";
  return `${protocol}://${host}`;
}

async function extractFinalMessage(stream: ReadableStream): Promise<string> {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let jsonContent = "";
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (line.trim() === "") continue;

        try {
          const event = JSON.parse(line);
          if (
            event.event === "thread.message.delta" &&
            event.data.delta.content?.[0]?.text?.value
          ) {
            jsonContent += event.data.delta.content[0].text.value;
          }
        } catch (e) {
          console.error("Error parsing line:", e);
        }
      }
    }

    // Extract JSON from the markdown code block if present
    const jsonMatch = jsonContent.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
    return jsonMatch ? jsonMatch[1] : jsonContent;
  } finally {
    reader.releaseLock();
  }
}

export async function POST(request: Request) {
  try {
    const headersList = headers();
    const baseUrl = getBaseUrl(headersList);

    // 1. Upload the file
    const formData = await request.formData();
    const file = formData.get("file");

    const fileUploadResponse = await fetch(`${baseUrl}/api/contracts/files`, {
      method: "POST",
      body: formData,
    });

    if (!fileUploadResponse.ok) {
      throw new Error("File upload failed");
    }

    // 2. Create a new thread
    const threadResponse = await fetch(`${baseUrl}/api/contracts/threads`, {
      method: "POST",
    });

    if (!threadResponse.ok) {
      throw new Error("Failed to create thread");
    }

    const { threadId } = await threadResponse.json();

    // 3. Send the analysis request message
    const messageResponse = await fetch(
      `${baseUrl}/api/contracts/threads/${threadId}/messages`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: `Please analyze the uploaded document and extract:
                    1. All monetary amounts (with currency), what they are for, and where they appear
                    2. All tasks, deliverables, and obligations (including descriptions, due dates, responsible parties, and details)
                    Format your response as JSON with 'amounts' and 'tasks' arrays.`,
        }),
      }
    );

    if (!messageResponse.ok) {
      throw new Error("Failed to process message");
    }

    // 4. Extract and parse the final message
    const jsonString = await extractFinalMessage(messageResponse.body!);
    const result = JSON.parse(jsonString);

    // 5. Return the parsed JSON result
    return NextResponse.json(result);
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
  return NextResponse.json({
    message: "Send a POST request with a file to analyze contract documents",
  });
}
