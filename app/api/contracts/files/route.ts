import { assistantId } from "@/utils/assistant-config";
import { openai } from "@/utils/openAIClient";

// upload file to assistant's vector store
export async function POST(request: Request) {
  const formData = await request.formData(); // process file as FormData
  const file = formData.get("file") as File; // retrieve the single file from FormData
  if (!file || !(file instanceof File)) {
    return new Response("No file uploaded", { status: 400 });
  }
  const vectorStoreId = await getOrCreateVectorStore(); // get or create vector store
  if (!vectorStoreId) {
    return new Response("Failed to get or create vector store", {
      status: 500,
    });
  }

  // upload using the file stream
  const openaiFile = await openai.files.create({
    file: file,
    purpose: "assistants",
  });

  // add file to vector store
  await openai.beta.vectorStores.files.create(vectorStoreId, {
    file_id: openaiFile.id,
  });
  return new Response();
}

// list files in assistant's vector store
export async function GET() {
  const vectorStoreId = await getOrCreateVectorStore(); // get or create vector store
  if (!vectorStoreId) {
    return new Response("Failed to get or create vector store", {
      status: 500,
    });
  }
  const fileList = await openai.beta.vectorStores.files.list(vectorStoreId);

  const filesArray = await Promise.all(
    fileList.data.map(async (file) => {
      const fileDetails = await openai.files.retrieve(file.id);
      const vectorFileDetails = await openai.beta.vectorStores.files.retrieve(
        vectorStoreId,
        file.id
      );
      return {
        file_id: file.id,
        filename: fileDetails.filename,
        status: vectorFileDetails.status,
      };
    })
  );
  return Response.json(filesArray);
}

// delete file from assistant's vector store
export async function DELETE(request: Request) {
  const body = await request.json();
  const fileId = body.fileId;

  const vectorStoreId = await getOrCreateVectorStore(); // get or create vector store
  if (vectorStoreId) {
    await openai.beta.vectorStores.files.del(vectorStoreId, fileId); // delete file from vector store
  } else {
    return new Response("Failed to get or create vector store", {
      status: 500,
    });
  }

  return new Response();
}

/* Helper functions */

const getOrCreateVectorStore = async () => {
  const assistant = await openai.beta.assistants.retrieve(assistantId);

  // if the assistant already has a vector store, return it
  if (
    (assistant.tool_resources?.file_search?.vector_store_ids ?? []).length > 0
  ) {
    return assistant.tool_resources?.file_search?.vector_store_ids?.[0] ?? null;
  }
  // otherwise, create a new vector store and attatch it to the assistant
  const vectorStore = await openai.beta.vectorStores.create({
    name: "contract-analyst-files",
  });
  await openai.beta.assistants.update(assistantId, {
    tool_resources: {
      file_search: {
        vector_store_ids: [vectorStore.id],
      },
    },
  });
  return vectorStore.id;
};
