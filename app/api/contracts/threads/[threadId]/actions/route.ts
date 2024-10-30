import { openai } from "@/utils/openAIClient";

// Send a new message to a thread
interface RequestParams {
  params: {
    threadId: string;
  };
}

interface ToolCallOutputs {
  tool_outputs: Array<{
    output: any;
    tool_call_id: string;
  }>;
}

interface RequestBody {
  toolCallOutputs: ToolCallOutputs;
  runId: string;
}

export async function POST(request: Request, { params: { threadId } }: RequestParams) {
  const { toolCallOutputs, runId }: RequestBody = await request.json();

  const stream = openai.beta.threads.runs.submitToolOutputsStream(
    threadId,
    runId,
    toolCallOutputs
  );

  return new Response(stream.toReadableStream());
}
