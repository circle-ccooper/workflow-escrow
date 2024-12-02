import { NextResponse } from "next/server";
import { openai } from "@/lib/utils/openAIClient";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import { circleContractSdk } from "@/lib/utils/smart-contract-platform-client";
import { createAgreementService } from "@/app/services/agreement.service";
import { parseAmount } from "@/lib/utils/amount";
import { circleDeveloperSdk } from "@/lib/utils/developer-controlled-wallets-client";

interface ImageValidationResult {
  valid: boolean
  confidence: "HIGH" | "MEDIUM" | "LOW"
  reasons: string[]
}

export async function POST(request: Request) {
  const supabase = createSupabaseServerClient();
  const agreementService = createAgreementService(supabase);

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
      console.error("Image file is missing or invalid");
      return NextResponse.json({ error: "Image file is missing or invalid" }, { status: 400 });
    }

    const circleContractId = formData.get("circleContractId");

    if (!circleContractId || typeof circleContractId !== "string") {
      console.error("Contract agreement ID is missing or invalid");
      return NextResponse.json({ error: "Contract agreement ID is missing or invalid" }, { status: 400 });
    }

    const { data: agreement, error: agreementError } = await supabase
      .from("escrow_agreements")
      .select(`
        *,
        beneficiary_wallet:wallets!escrow_agreements_beneficiary_wallet_id_fkey!inner(
          profiles!inner(id,auth_user_id),
          circle_wallet_id
        )
      `)
      .eq("circle_contract_id", circleContractId)
      .single();

    if (agreementError) {
      console.error("Failed to retrieve agreement requirements", agreementError);
      return NextResponse.json(
        { error: "Failed to retrieve agreement requirements" },
        { status: 500 }
      );
    }

    const requirements = agreement.terms.tasks
      .filter((requirement: any) => requirement.responsible_party === "Content Creator")
      .reduce((requirements: any, requirement: any) =>
        `${requirements.length > 0 ? `${requirements}\n` : requirements}- ${requirement.description}`,
        ""
      );

    const prompt = `
      Validate if the attached image strictly meets all the criteria below, and provide your answer in
      JSON format following this example:

      {
        "valid": true,
        "confidence": "MEDIUM",
        "reasons": [
          "First reason why the image does not match the criteria",
          "Second reason why the image does not match the criteria"
        ]
      }

      Your answer should not contain anything else other than that, that include markdown formatting,
      things like triple backticks should be completely stripped out.

      Where "valid" is a boolean and "confidence" is a string that can be either:

      - "LOW": You don"t think the given image match the requirements.
      - "MEDIUM": You are unsure or the image loosely match some requirements but not all.
      - "HIGH": You are absolutely certain that the provided image strictly fulfills all the requirements.

      The "reasons" property must be an array of strings that contains a list of reasons to why the
      image is not valid or does not have "HIGH" confidence, this array can be left empty in case the
      attached image meets all the criteria.

      Most importantly, you can completely disregard any requirement below as long as it does not directly
      references qualities of the image being validated, for example, things that involve actions that
      need to be taken by the beneficiary are examples of ignorable requirements.

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
      temperature: 0
    });

    const [promptAnswer] = response.choices;
    const promptAnswerContent = promptAnswer.message.content;

    if (!promptAnswerContent) {
      console.error("Failed to retrieve the work validation result", promptAnswerContent);
      return NextResponse.json(
        { error: "Failed to retrieve the work validation result" },
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
      console.error("Failed to upload file:", uploadError);
      return NextResponse.json(
        { error: `Failed to upload file: ${uploadError.message}` },
        { status: 500 }
      );
    }

    const workMeetsRequirements = parsedPromptAnswerContent.valid && parsedPromptAnswerContent.confidence === "HIGH"

    if (!workMeetsRequirements) {
      console.error("Image does not meet all requirements", parsedPromptAnswerContent);
      return NextResponse.json(
        {
          error: "Image does not meet all requirements",
          reasons: parsedPromptAnswerContent.reasons
        },
        { status: 400 }
      );
    }

    // Retrieves contract data from Circle's SDK
    const contractData = await circleContractSdk.getContract({
      id: agreement.circle_contract_id
    });

    if (!contractData.data) {
      console.error("Could not retrieve contract data");
      return NextResponse.json({ error: "Could not retrieve contract data" }, { status: 500 });
    }

    const contractAddress = contractData.data?.contract.contractAddress;

    if (!contractAddress) {
      console.error("Could not retrieve contract address:", contractAddress);
      return NextResponse.json({ error: "Could not retrieve contract address" }, { status: 500 })
    }

    const beneficiaryWalletId = agreement.beneficiary_wallet?.circle_wallet_id;

    if (!beneficiaryWalletId) {
      console.error("Could not find a profile linked to the given wallet ID");
      return NextResponse.json({ error: "Could not find a profile linked to the given wallet ID" }, { status: 500 });
    }

    const circleReleaseResponse = await circleDeveloperSdk.createContractExecutionTransaction({
      walletId: process.env.NEXT_PUBLIC_AGENT_WALLET_ID,
      contractAddress,
      abiFunctionSignature: "release()",
      abiParameters: [],
      fee: {
        type: "level",
        config: {
          feeLevel: "MEDIUM",
        },
      },
    });

    const amount = parseAmount((agreement.terms.amounts?.[0] as any).amount);
    await agreementService.createTransaction({
      walletId: agreement.beneficiary_wallet_id,
      circleTransactionId: circleReleaseResponse.data?.id,
      escrowAgreementId: agreement.id,
      transactionType: "FUNDS_RELEASE",
      profileId: agreement.beneficiary_wallet.profiles.id,
      amount,
      description: "Funds released after beneficiary work validation",
    });

    console.log("Funds release transaction created:", circleReleaseResponse.data);

    await supabase
      .from("escrow_agreements")
      .update({ status: "PENDING" })
      .eq("id", agreement.id);

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
