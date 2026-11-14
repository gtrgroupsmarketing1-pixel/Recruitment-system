// src/lib/ai.ts
import { createOpenAI } from '@ai-sdk/openai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { generateObject } from 'ai';
import { z } from 'zod';

const openAIKeys = [
  process.env.OPENAI_KEY_1,
  process.env.OPENAI_KEY_2,
].filter(Boolean) as string[]; 

const geminiKeys = [
  process.env.GEMINI_KEY_1,
  process.env.GEMINI_KEY_2,
].filter(Boolean) as string[];

export async function generateWithFallback(params: {
  schema: any;
  messages: any[];
}) {
  // Try OpenAI Keys
  for (const key of openAIKeys) {
    try {
      return await generateObject({
        model: createOpenAI({ apiKey: key })('gpt-4o'),
        schema: params.schema,
        messages: params.messages,
      });
    } catch (error: any) {
      // 👇 Print the EXACT error message to Vercel Logs
      console.error("⚠️ OpenAI key failed:", error?.message || error);
    }
  }

  // Fallback to Gemini Keys
  for (const key of geminiKeys) {
    try {
      return await generateObject({
        model: createGoogleGenerativeAI({ apiKey: key })('gemini-1.5-pro'),
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