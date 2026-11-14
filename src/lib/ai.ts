// src/lib/ai.ts
import { createOpenAI } from '@ai-sdk/openai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { generateObject } from 'ai';
import { z } from 'zod';

// 👇 FIXED: Removed the underscores to match your Vercel variables
const openAIKeys = [
  process.env.OPENAI_KEY1,
  process.env.OPENAI_KEY2,
].filter(Boolean) as string[]; 

const geminiKeys = [
  process.env.GEMINI_KEY1,
  process.env.GEMINI_KEY2,
].filter(Boolean) as string[];

// Debug logs
console.log(`🔑 OpenAI Keys loaded: ${openAIKeys.length}`);
console.log(`🔑 Gemini Keys loaded: ${geminiKeys.length}`);

export async function generateWithFallback(params: {
  schema: any;
  messages: any[];
}) {
  // STRICT CHECK: Throw a clear error if no keys exist
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
        model: createGoogleGenerativeAI({ apiKey: key })('gemini-1.5-flash'),
        schema: params.schema,
        messages: params.messages,
      });
    } catch (error: any) {
      console.error("⚠️ Gemini key failed:", error?.message || error);
    }
  }

  throw new Error("All AI providers failed to process the request. Check Vercel logs for details.");
}

export const ExtractedSchema = z.object({
  intent: z.enum(["CANDIDATE", "REQUISITION", "UNKNOWN"]),
  candidate: z.object({
    fullName: z.string().optional(),
    phone: z.string().optional(),
    email: z.string().optional(),
    trade: z.string().optional(),
    location: z.string().optional(),
    nationality: z.string().optional(),
    notes: z.string().optional(),
  }).optional(),
  requisition: z.object({
    clientName: z.string().optional(),
    jobTitle: z.string().optional(),
    roleCategory: z.string().optional(),
    country: z.string().optional(),
    quantity: z.number().optional(),
    location: z.string().optional(),
    notes: z.string().optional(),
  }).optional(),
});