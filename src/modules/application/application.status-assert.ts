import type { ApplicationStatus } from "@prisma/client";
import type { Status } from "./application.state-machine";

/**
 * Compile-time assertion: Prisma ApplicationStatus and state-machine Status
 * must stay identical. Nothing imports this file; typecheck fails if they diverge.
 */
type _PrismaSubsetOfStatus = ApplicationStatus extends Status ? true : never;
type _StatusSubsetOfPrisma = Status extends ApplicationStatus ? true : never;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _assertPrismaMatchesState: [
  _PrismaSubsetOfStatus,
  _StatusSubsetOfPrisma,
] = [true, true];
