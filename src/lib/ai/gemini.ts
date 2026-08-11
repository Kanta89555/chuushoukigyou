import "server-only";

import { GoogleGenAI } from "@google/genai";
import { getServerEnv } from "@/config/server-env";
import { buildTermExplanationPrompt } from "./prompts";
import { explainRequestSchema, termExplanationSchema } from "./schemas";

const responseJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: ["definition", "details", "example", "relatedTerms", "examPoint"],
  properties: {
    definition: { type: "string" },
    details: { type: "string" },
    example: { type: "string" },
    relatedTerms: { type: "array", items: { type: "string" }, maxItems: 6 },
    examPoint: { type: "string" },
  },
};

export async function generateTermExplanation(input: unknown) {
  const parsedInput = explainRequestSchema.parse(input);
  const env = getServerEnv();
  const ai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
  const response = await ai.models.generateContent({
    model: env.GEMINI_MODEL,
    contents: buildTermExplanationPrompt(parsedInput),
    config: {
      responseMimeType: "application/json",
      responseJsonSchema,
      temperature: 0.2,
    },
  });

  if (!response.text) throw new Error("Gemini returned an empty response.");
  return termExplanationSchema.parse(JSON.parse(response.text));
}
