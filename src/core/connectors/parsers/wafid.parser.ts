export type ParsedWafidResponse = {
  rawStatus: string;
  details: {
    candidateName?: string;
    centerName?: string;
    examDate?: string;
    resultDate?: string;
  };
};

export function parseWafidHtml(html: string): ParsedWafidResponse {
  const statusMatch = html.match(/Status<\/td>\s*<td[^>]*>([^<]+)<\/td>/i);
  if (!statusMatch) {
    throw new Error("Wafid response did not contain a status row");
  }

  const nameMatch = html.match(/Name<\/td>\s*<td[^>]*>([^<]+)<\/td>/i);
  const centerMatch = html.match(/Center<\/td>\s*<td[^>]*>([^<]+)<\/td>/i);
  const examMatch = html.match(/Exam Date<\/td>\s*<td[^>]*>([^<]+)<\/td>/i);
  const resultMatch = html.match(/Result Date<\/td>\s*<td[^>]*>([^<]+)<\/td>/i);

  return {
    rawStatus: statusMatch[1].trim(),
    details: {
      candidateName: nameMatch?.[1]?.trim(),
      centerName: centerMatch?.[1]?.trim(),
      examDate: examMatch?.[1]?.trim(),
      resultDate: resultMatch?.[1]?.trim(),
    },
  };
}
