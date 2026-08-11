import "server-only";

import { GoogleGenAI } from "@google/genai";
import { getServerEnv } from "@/config/server-env";
import { buildCompanyAnalysisPrompt, buildTermExplanationPrompt } from "./prompts";
import { companyAnalysisInputSchema, companyAnalysisSchema, explainRequestSchema, termExplanationSchema } from "./schemas";

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

const companyAnalysisJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: ["assumptions", "application", "currentAnalysis", "strengths", "issues", "recommendations", "actions", "risks", "missingInformation", "learningPoint"],
  properties: {
    assumptions: { type: "string" },
    application: { type: "string" },
    currentAnalysis: { type: "string" },
    strengths: { type: "array", items: { type: "string" }, maxItems: 8 },
    issues: { type: "array", items: { type: "string" }, maxItems: 8 },
    recommendations: { type: "array", items: { type: "string" }, maxItems: 8 },
    actions: { type: "array", items: { type: "string" }, maxItems: 8 },
    risks: { type: "array", items: { type: "string" }, maxItems: 8 },
    missingInformation: { type: "array", items: { type: "string" }, maxItems: 8 },
    learningPoint: { type: "string" },
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

  if (!response.text) throw new Error("AI returned an empty response.");
  return termExplanationSchema.parse(JSON.parse(response.text));
}

export async function generateCompanyAnalysis(input: unknown) {
  const parsedInput = companyAnalysisInputSchema.parse(input);
  const env = getServerEnv();
  const ai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
  const response = await ai.models.generateContent({
    model: env.GEMINI_MODEL,
    contents: buildCompanyAnalysisPrompt(parsedInput),
    config: {
      responseMimeType: "application/json",
      responseJsonSchema: companyAnalysisJsonSchema,
      temperature: 0.2,
    },
  });
  if (!response.text) throw new Error("AI returned an empty response.");
  return companyAnalysisSchema.parse(JSON.parse(response.text));
}
