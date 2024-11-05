import type { EscrowAgreement } from "@/types/database.types"
import type { PostgrestError } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { openai } from "@/lib/utils/openAIClient";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";

interface ImageValidationResult {
  valid: boolean
  confidence: "HIGH" | "MEDIUM" | "LOW"
}

export async function POST(request: Request) {
  const supabase = createSupabaseServerClient();

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "You are not logged in" }, { status: 401 })
  }

  try {
    const formData = await request.formData();
    const imageFile = formData.get("file");

    if (!imageFile || !(imageFile instanceof Blob)) {
      throw new Error("Image file is missing or invalid");
    }

    // "user.id" is required instead of "user.auth_user_id"
    const { data: authUser, error: authUserError } = await supabase
      .from("profiles")
      .select("id")
      .eq("auth_user_id", user.id)
      .single();

    if (authUserError) {
      return NextResponse.json({ error: "Could not retrieve user ID" }, { status: 500 })
    }

    const { data: beneficiaryWallet, error: beneficiaryWalletError } = await supabase
      .schema("public")
      .from("wallets")
      .select("id")
      .eq("profile_id", authUser.id)
      .single();

    if (beneficiaryWalletError) {
      return NextResponse.json({ error: "Could not find the beneficiary wallet ID" }, { status: 500 });
    }

    const { data: agreement, error: fetchError } = await supabase
      .from("escrow_agreements")
      .select()
      .eq("beneficiary_wallet_id", beneficiaryWallet.id)
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

    const timestamp = Date.now();
    const originalFileName = imageFile.name || "uploaded-file";
    const fileName = `${!parsedPromptAnswerContent.valid ? "in" : ""}valid-${timestamp}-${originalFileName}`;
    const filePath = `${agreement.id}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("agreement-documents")
      .upload(filePath, imageFile, {
        contentType: imageFile.type || "application/octet-stream",
        upsert: false,
      });

    if (uploadError) {
      throw new Error(`Failed to upload file: ${uploadError.message}`);
    }

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
