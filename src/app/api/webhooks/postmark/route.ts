import { handlePostmarkWebhook } from "@/modules/notification/postmark.webhook";

export async function POST(req: Request) {
  const auth = req.headers.get("authorization");
  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return new Response("Bad request", { status: 400 });
  }
  if (!payload || typeof payload !== "object") {
    return new Response("Bad request", { status: 400 });
  }
  const result = await handlePostmarkWebhook(
    auth,
    payload as {
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
