/**
 * Heuristic intake parser for mobile / WhatsApp-style text.
 * No LLM dependency — returns a structured draft for human confirmation.
 * Swap implementation later for Vercel AI SDK without changing API shape.
 */

export type IntakeIntent = "REQUISITION" | "CANDIDATE" | "UNKNOWN";

export type ParsedRequisition = {
  clientName: string | null;
  jobTitle: string | null;
  roleCategory: string;
  country: string;
  quantity: number | null;
  location: string | null;
  notes: string | null;
};

export type ParsedCandidate = {
  fullName: string | null;
  phone: string | null;
  email: string | null;
  trade: string | null;
  notes: string | null;
};

export type IntakeParseResult = {
  intent: IntakeIntent;
  confidence: number;
  requisition?: ParsedRequisition;
  candidate?: ParsedCandidate;
  rawPreview: string;
};

const COUNTRY_HINTS: Record<string, string> = {
  uae: "AE",
  dubai: "AE",
  "abu dhabi": "AE",
  sharjah: "AE",
  saudi: "SA",
  ksa: "SA",
  riyadh: "SA",
  jeddah: "SA",
  qatar: "QA",
  doha: "QA",
  kuwait: "KW",
  bahrain: "BH",
  oman: "OM",
  muscat: "OM",
};

function detectCountry(text: string): string {
  const lower = text.toLowerCase();
  for (const [hint, code] of Object.entries(COUNTRY_HINTS)) {
    if (lower.includes(hint)) return code;
  }
  const m = text.match(/\b(AE|SA|QA|KW|BH|OM)\b/i);
  return m ? m[1].toUpperCase() : "AE";
}

function extractQuantity(text: string): number | null {
  const patterns = [
    /(\d+)\s*(?:positions?|vacancies|workers?|persons?|nos?\.?|x)\b/i,
    /\bneed(?:s|ed)?\s+(\d+)\b/i,
    /\bqty[:\s]+(\d+)/i,
    /\bquantity[:\s]+(\d+)/i,
  ];
  for (const re of patterns) {
    const m = text.match(re);
    if (m) {
      const n = Number(m[1]);
      if (n > 0 && n < 10000) return n;
    }
  }
  return null;
}

function extractPhone(text: string): string | null {
  const m = text.match(
    /(?:\+?\d{1,3}[\s-]?)?(?:\(?\d{2,4}\)?[\s-]?)?\d{3,4}[\s-]?\d{3,4}/
  );
  return m ? m[0].replace(/\s+/g, " ").trim() : null;
}

function extractEmail(text: string): string | null {
  const m = text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
  return m ? m[0] : null;
}

function extractClientName(text: string): string | null {
  const patterns = [
    /(?:client|company|employer)\s*[:\-]\s*(.+)/i,
    /(?:for|from)\s+([A-Z][A-Za-z0-9 &.]{2,40})/,
  ];
  for (const re of patterns) {
    const m = text.match(re);
    if (m) return m[1].trim().split(/[\n,]/)[0].trim().slice(0, 80);
  }
  return null;
}

function extractJobTitle(text: string): string | null {
  const patterns = [
    /(?:job\s*title|position|role|trade)\s*[:\-]\s*(.+)/i,
    /\b(?:need|looking for|require[sd]?)\s+(\d+\s+)?([A-Za-z][A-Za-z /-]{2,40})/i,
  ];
  for (const re of patterns) {
    const m = text.match(re);
    if (m) {
      const title = (m[2] ?? m[1] ?? "").replace(/^\d+\s+/, "").trim();
      if (title.length >= 2) return title.slice(0, 80);
    }
  }
  return null;
}

function extractName(text: string): string | null {
  const patterns = [
    /(?:name|candidate)\s*[:\-]\s*(.+)/i,
    /^([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3})\s*$/m,
  ];
  for (const re of patterns) {
    const m = text.match(re);
    if (m) return m[1].trim().slice(0, 80);
  }
  return null;
}

function roleCategoryFromTitle(title: string | null): string {
  if (!title) return "BC";
  const t = title.toUpperCase();
  if (/ENGINEER|MANAGER|ACCOUNTANT|HR\b|IT\b|DEVELOPER/.test(t)) return "WC";
  if (/DRIVER|WELDER|MASON|HELPER|CLEANER|COOK|ELECTRICIAN|PLUMBER/.test(t))
    return "BC";
  return "BC";
}

export function parseInboundMessage(textRaw: string): IntakeParseResult {
  const text = textRaw.trim().slice(0, 8000);
  const rawPreview = text.slice(0, 200);
  if (!text) {
    return { intent: "UNKNOWN", confidence: 0, rawPreview: "" };
  }

  const lower = text.toLowerCase();
  const looksRequisition =
    /\b(need|vacanc|position|worker|hire|requisition|manpower|job order)\b/.test(
      lower
    ) || extractQuantity(text) !== null;
  const looksCandidate =
    /\b(cv|resume|passport|candidate|applicant)\b/.test(lower) ||
    (extractPhone(text) !== null && extractName(text) !== null);

  if (looksRequisition && !looksCandidate) {
    const jobTitle = extractJobTitle(text);
    return {
      intent: "REQUISITION",
      confidence: 0.7,
      requisition: {
        clientName: extractClientName(text),
        jobTitle,
        roleCategory: roleCategoryFromTitle(jobTitle),
        country: detectCountry(text),
        quantity: extractQuantity(text),
        location: null,
        notes: text.slice(0, 500),
      },
      rawPreview,
    };
  }

  if (looksCandidate) {
    return {
      intent: "CANDIDATE",
      confidence: 0.65,
      candidate: {
        fullName: extractName(text),
        phone: extractPhone(text),
        email: extractEmail(text),
        trade: extractJobTitle(text),
        notes: text.slice(0, 500),
      },
      rawPreview,
    };
  }

  // Default: treat as requisition draft if any structured signal
  const jobTitle = extractJobTitle(text);
  const qty = extractQuantity(text);
  if (jobTitle || qty) {
    return {
      intent: "REQUISITION",
      confidence: 0.45,
      requisition: {
        clientName: extractClientName(text),
        jobTitle,
        roleCategory: roleCategoryFromTitle(jobTitle),
        country: detectCountry(text),
        quantity: qty,
        location: null,
        notes: text.slice(0, 500),
      },
      rawPreview,
    };
  }

  return { intent: "UNKNOWN", confidence: 0.2, rawPreview };
}
