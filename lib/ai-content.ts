// lib/ai-content.ts
//
// Uses the Anthropic API to generate social media captions
// for completed jobs. Platform-aware prompting so every post
// feels native to where it's being shared.

import Anthropic from "@anthropic-ai/sdk";

export type Platform = "google_business" | "instagram" | "facebook";

const PLATFORM_INSTRUCTIONS: Record<Platform, string> = {
  google_business:
    "Write a professional Google Business Profile post update. " +
    "2-3 sentences max. Focus on the work done and area served. " +
    "Sound like a proud local business owner. No hashtags.",

  instagram:
    "Write an engaging Instagram caption for a local trade business. " +
    "3-4 sentences. Friendly, confident, and visual — paint a picture of the transformation. " +
    "End with 4-6 relevant local/trade hashtags (e.g. #PressureWashing #CleanDriveway #LocalBusiness).",

  facebook:
    "Write a warm Facebook post for a local business. " +
    "2-3 sentences. Conversational and authentic — like you're talking to your neighbors. " +
    "1-2 relevant hashtags optional at the end.",
};

export async function generateCaption({
  description,
  tradeType,
  businessName,
  location,
  platform,
  amount,
  hasBeforeAfter,
}: {
  description?: string;
  tradeType?: string;
  businessName: string;
  location?: string;
  platform: Platform;
  amount?: string;
  hasBeforeAfter?: boolean;
}): Promise<string> {
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

  const context = [
    `Business: ${businessName}`,
    location ? `Location: ${location}` : null,
    `Trade: ${tradeType ?? "home services"}`,
    description ? `Job description: ${description}` : null,
    amount ? `Job value: ${amount}` : null,
    hasBeforeAfter ? "Before/after photos are included with the post." : null,
  ]
    .filter(Boolean)
    .join("\n");

  const prompt = `You are a marketing assistant helping a local trade business create social media content.

${context}

${PLATFORM_INSTRUCTIONS[platform]}

Return ONLY the post text. No quotes around it, no "Here's the post:", no explanation — just the caption itself.`;

  const message = await anthropic.messages.create({
    model: "claude-haiku-4-5",
    max_tokens: 350,
    messages: [{ role: "user", content: prompt }],
  });

  const block = message.content[0];
  if (block.type !== "text") throw new Error("Unexpected response type from AI");

  return block.text.trim();
}
