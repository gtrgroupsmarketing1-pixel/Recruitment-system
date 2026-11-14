// src/lib/ai.ts
import { createOpenAI } from '@ai-sdk/openai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { generateObject } from 'ai';
import { z } from 'zod';

// ==========================================
// 1. Setup Keys
// ==========================================
const openAIKeys = [
  process.env.OPENAI_KEY_1,
  process.env.OPENAI_KEY_2,
].filter(Boolean) as string[]; 

const geminiKeys = [
  process.env.GEMINI_KEY_1,
  process.env.GEMINI_KEY_2,
].filter(Boolean) as string[];

// ==========================================
// 2. The Custom Resilient Fallback Function
// ==========================================
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
    } catch (error) {
      console.warn("⚠️ OpenAI key failed, trying next...", error);
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
    } catch (error) {
      console.warn("⚠️ Gemini key failed, trying next...", error);
    }
  }

  // If everything fails
  throw new Error("All AI providers failed to process the request.");
}

// ==========================================
// 3. Extraction Schema
// ==========================================
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