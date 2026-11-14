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

      // 👇 1. Convert Buffer to a Base64 Data URL (Crucial for AI SDK)
      const mimeType = file.type || "image/jpeg";
      const base64Image = buffer.toString("base64");
      const dataUrl = `data:${mimeType};base64,${base64Image}`;

      // 👇 2. Use the new custom fallback function
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
                type: "image", 
                image: dataUrl // 👈 3. Pass the Base64 URL, not the raw buffer
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
    
    console.error("[mobile/intake/parse-image]", error);
    
    // 👇 Return the actual error message so the mobile app can display it
    const message = error instanceof Error ? error.message : "Failed to parse image";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}