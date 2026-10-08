import { z } from "zod";
import { handlePostmarkWebhook } from "@/modules/notification/postmark.webhook";

// Webhook with basic-auth verification — Origin check exempt.
const PostmarkWebhook = z
  .object({
    RecordType: z.enum(["Delivery", "Bounce", "Open", "SpamComplaint"]).or(z.string()),
    MessageID: z.string().min(1),
    DeliveredAt: z.string().optional(),
    Type: z.string().optional(),
    Description: z.string().optional(),
    ReceivedAt: z.string().optional(),
  })
  .passthrough();

export async function POST(req: Request) {
  const auth = req.headers.get("authorization");
  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return new Response("Bad request", { status: 400 });
  }
  const parsed = PostmarkWebhook.safeParse(payload);
  if (!parsed.success) {
    return new Response("Bad request", { status: 400 });
  }
  const result = await handlePostmarkWebhook(
    auth,
    parsed.data as {
      RecordType?: string;
      MessageID?: string;
      DeliveredAt?: string;
      Type?: string;
      Description?: string;
      ReceivedAt?: string;
    },
    {
      user: process.env.POSTMARK_WEBHOOK_USER,
      pass: process.env.POSTMARK_WEBHOOK_PASS,
    }
  );
  return new Response(result.body, { status: result.status });
}
