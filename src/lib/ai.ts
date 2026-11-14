// src/lib/ai.ts
import { createOpenAI } from '@ai-sdk/openai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { generateObject } from 'ai';
import { z } from 'zod';

const openAIKeys = [
  process.env.OPENAI_KEY1,
  process.env.OPENAI_KEY2,
].filter(Boolean) as string[]; 

const geminiKeys = [
  process.env.GEMINI_KEY1,
  process.env.GEMINI_KEY2,
].filter(Boolean) as string[];

console.log(`🔑 OpenAI Keys loaded: ${openAIKeys.length}`);
console.log(`🔑 Gemini Keys loaded: ${geminiKeys.length}`);

export async function generateWithFallback(params: {
  schema: any;
  messages: any[];
}) {
  if (openAIKeys.length === 0 && geminiKeys.length === 0) {
    throw new Error("No API keys found. Please check Vercel Environment Variables.");
  }

  // Try OpenAI Keys
  for (const key of openAIKeys) {
    try {
      return await generateObject({
        model: createOpenAI({ apiKey: key })('gpt-4o-mini'),
        schema: params.schema,
        messages: params.messages,
      });
    } catch (error: any) {
      console.error("⚠️ OpenAI key failed:", error?.message || error);
    }
  }

  // Fallback to Gemini Keys
  for (const key of geminiKeys) {
    try {
      return await generateObject({
        // 👇 FIX 1: Added -latest to the model name
        model: createGoogleGenerativeAI({ apiKey: key })('gemini-1.5-pro-latest'),
        schema: params.schema,
        messages: params.messages,
      });
    } catch (error: any) {
      console.error("⚠️ Gemini key failed:", error?.message || error);
    }
  }

  throw new Error("All AI providers failed to process the request. Check Vercel logs for details.");
}

// 👇 FIX 2: Changed all .optional() to .nullable()
export const ExtractedSchema = z.object({
  intent: z.enum(["CANDIDATE", "REQUISITION", "UNKNOWN"]),
  candidate: z.object({
    fullName: z.string().nullable().describe("The full name of the candidate"),
    phone: z.string().nullable().describe("Phone number"),
    email: z.string().nullable().describe("Email address"),
    trade: z.string().nullable().describe("Job title or trade"),
    location: z.string().nullable().describe("Current location"),
    nationality: z.string().nullable().describe("Nationality"),
    notes: z.string().nullable().describe("Any other relevant extracted text"),
  }).nullable(),
  requisition: z.object({
    clientName: z.string().nullable().describe("Client name"),
    jobTitle: z.string().nullable().describe("Job title"),
    roleCategory: z.string().nullable().describe("BC or WC"),
    country: z.string().nullable().describe("Country code"),
    quantity: z.number().nullable().describe("Number of workers needed"),
    location: z.string().nullable().describe("Job location"),
    notes: z.string().nullable().describe("Any other relevant details"),
  }).nullable(),
});