import { assistantId } from "@/lib/utils/assistant-config";
import { openai } from "@/lib/utils/openAIClient";

export const runtime = "nodejs";

// Send a new message to a thread
interface RequestParams {
  params: {
    threadId: string;
  };
}

interface RequestBody {
  content: string;
}

export async function POST(
  request: Request,
  { params: { threadId } }: RequestParams
): Promise<Response> {
  const { content }: RequestBody = await request.json();

  await openai.beta.threads.messages.create(threadId, {
    role: "user",
    content: content,
  });

  const stream = openai.beta.threads.runs.stream(threadId, {
    assistant_id: assistantId,
  });

  return new Response(stream.toReadableStream());
}
