import { NextResponse } from "next/server";
import { withMobileScope, MobileAuthError } from "@/core/mobile-auth/with-mobile-scope";
import { generateWithFallback, ExtractedSchema } from "@/lib/ai"; 

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    await withMobileScope(req, async (scope) => {
      const formData = await req.formData();
      const file = formData.get("file") as File;
      if (!file) throw new Error("No image provided");

      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // 👇 FIX 1: Extract raw base64 string (no data:image prefix)
      const base64Image = buffer.toString("base64");
      
      // 👇 FIX 2: Force mediaType to image so OpenAI doesn't default to text/plain
      const mimeType = file.type && file.type.startsWith("image/") ? file.type : "image/jpeg";

      const { object } = await generateWithFallback({
        schema: ExtractedSchema,
        messages: [
          {
            role: "user",
            content: [
              { 
                type: "text", 
                text: "Extract the candidate's profile details from this image. If it looks like a job order, set intent to REQUISITION." 
              },
              { 
                // 👇 FIX 3: Use type: "file" instead of "image", and specify mediaType
                type: "file", 
                data: base64Image,
                mediaType: mimeType
              },
            ],
          },
        ],
      });

      return NextResponse.json(object);
    });
  } catch (error) {
    if (error instanceof MobileAuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    
    console.error("[mobile/intake/parse-image] Final Error:", error);
    const message = error instanceof Error ? error.message : "Failed to parse image";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}