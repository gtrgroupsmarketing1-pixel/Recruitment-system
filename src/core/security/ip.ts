/** Client IP. x-forwarded-for is trusted only behind the deployment proxy (Session 30). */
export function extractIp(req: Request | { headers: Headers }): string {
  const headers = "headers" in req ? req.headers : (req as Request).headers;
  return (
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    headers.get("x-real-ip")?.trim() ??
    "unknown"
  );
}
