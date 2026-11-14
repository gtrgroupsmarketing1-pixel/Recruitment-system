import { NextResponse } from "next/server";
import { withMobileScope, MobileAuthError } from "@/core/mobile-auth/with-mobile-scope";
import { generateWithFallback, ExtractedSchema } from "@/lib/ai"; 

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    await withMobileScope(req, async (scope) => {
      // 👇 RECEIVE JSON INSTEAD OF FORMDATA
      const { base64Image, mimeType } = await req.json();
      if (!base64Image) throw new Error("No image provided");

      // Convert base64 back to Uint8Array
      const buffer = Buffer.from(base64Image, "base64");
      const uint8Array = new Uint8Array(buffer);

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
                type: "image", // 👈 Use type "image" with Uint8Array
                image: uint8Array 
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