import { NextResponse } from "next/server";
import { withMobileScope, MobileAuthError } from "@/core/mobile-auth/with-mobile-scope";
import { generateWithFallback, ExtractedSchema } from "@/lib/ai"; // 👈 Import the new function

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    await withMobileScope(req, async (scope) => {
      const formData = await req.formData();
      const file = formData.get("file") as File;
      if (!file) throw new Error("No image provided");

      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // 👇 Use the new custom fallback function
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
                image: buffer 
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
    return NextResponse.json({ error: "Failed to parse image" }, { status: 500 });
  }
}