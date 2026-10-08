// Auth.js handler — no app-level parse; Auth.js validates credentials.
import { handlers } from "@/core/auth/auth.config";

export const { GET, POST } = handlers;
