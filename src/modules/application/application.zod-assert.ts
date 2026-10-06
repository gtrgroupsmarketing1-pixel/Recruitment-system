import type { z } from "zod";
import type { Status } from "./application.state-machine";
import { ApplicationStatusSchema } from "./application.schema";

/**
 * Compile-time assertion: Zod ApplicationStatusSchema and state-machine Status
 * must stay identical. Nothing imports this file; typecheck fails if they diverge.
 */
type _ZodMatchesStatus = z.infer<typeof ApplicationStatusSchema> extends Status
  ? true
  : never;
type _StatusMatchesZod = Status extends z.infer<typeof ApplicationStatusSchema>
  ? true
  : never;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _check: [_ZodMatchesStatus, _StatusMatchesZod] = [true, true];
