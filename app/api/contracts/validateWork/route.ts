import type { EscrowAgreement } from "@/types/database.types"
import { NextResponse } from "next/server";
import { createClient, PostgrestError } from "@supabase/supabase-js";
import { openai } from "@/lib/utils/openAIClient";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

interface ImageValidationResult {
  valid: boolean
  confidence: "HIGH" | "MEDIUM" | "LOW"
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const imageFile = formData.get("file");

    if (!imageFile || !(imageFile instanceof Blob)) {
      throw new Error("Image file is missing or invalid");
    }

    // Retrieve requirements from Supabase
    const { data: agreement, error: fetchError } = await supabase
      .from("escrow_agreements")
      .select("*")
      .limit(1)
      .single() as { data: EscrowAgreement, error: PostgrestError | null };

    if (fetchError || !agreement) {
      throw new Error("Failed to retrieve agreement requirements");
    }

    const requirements = agreement.terms.tasks
      .filter(requirement => requirement.responsible_party === "Content Creator")
      .reduce((requirements, requirement) =>
        `${requirements.length > 0 ? `${requirements}\n` : requirements}- ${requirement.task_description}\n- ${requirement.additional_details}`,
        ""
      );

    const prompt = `
      Validate if the attached image strictly meets all the criteria below and provide your answer in
      JSON format following this example:

      {
        "valid": true,
        "confidence": "HIGH"
      }

      Your answer should not contain anything else other than that.

      Where "valid" is a boolean and "confidence" is a string that can be either:

      - "LOW": You don't think the given image match the requirements.
      - "MEDIUM": You are unsure or the image loosely match some requirements but not all.
      - "HIGH": You are absolutely certain that the provided image strictly fulfills all the requirements.

      Here are the requirements:

      ${requirements}
    `;

    const arrayBuffer = await imageFile.arrayBuffer();
    const base64Image = Buffer.from(arrayBuffer).toString("base64");

    const response = await openai.chat.completions.create({
      model: "chatgpt-4o-latest",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: prompt
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/png;base64,${base64Image}`,
              },
            },
          ],
        },
      ],
    });

    const [promptAnswer] = response.choices;
    const promptAnswerContent = promptAnswer.message.content;

    if (!promptAnswerContent) {
      return NextResponse.json(
        { error: "Failed to validate the work" },
        { status: 500 }
      )
    }

    const parsedPromptAnswerContent: ImageValidationResult = JSON.parse(promptAnswerContent);

    if (!parsedPromptAnswerContent.valid) {
      return NextResponse.json({ error: "Image does not meet all requirements" });
    }

    return NextResponse.json({ message: "Image meets all requirements" });
  } catch (error) {
    console.error("Error validating image:", error);
    return NextResponse.json(
      {
        error: "Failed to validate image",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
