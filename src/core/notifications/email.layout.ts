export function renderEmailHtml(
  contentHtml: string,
  signatureHtml: string | null
): string {
  const signature = signatureHtml
    ? `<div style="margin-top: 24px; padding-top: 12px; border-top: 1px solid #e5e5e5;">${signatureHtml}</div>`
    : "";
  return `<!DOCTYPE html>
<html>
<body style="font-family: -apple-system, 'Segoe UI', sans-serif; font-size: 14px; color: #1a1a1a; max-width: 600px; margin: 0 auto; padding: 24px;">
${contentHtml}
${signature}
</body>
</html>`;
}
