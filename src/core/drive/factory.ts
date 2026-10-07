import type { ExternalProvider } from "@prisma/client";
import type { ExternalDriveClient } from "./drive.client";
import { createGoogleDriveClient } from "./google.client";
import { createMicrosoftDriveClient } from "./microsoft.client";

export type DriveClientFactory = (provider: ExternalProvider, accessToken: string) => ExternalDriveClient;

export function defaultDriveClientFactory(provider: ExternalProvider, accessToken: string): ExternalDriveClient {
  if (provider === "GOOGLE_DRIVE") return createGoogleDriveClient(accessToken);
  return createMicrosoftDriveClient(accessToken);
}

let factory: DriveClientFactory = defaultDriveClientFactory;

export function setDriveClientFactory(next: DriveClientFactory | null): void {
  factory = next ?? defaultDriveClientFactory;
}

export function driveClientFor(provider: ExternalProvider, accessToken: string): ExternalDriveClient {
  return factory(provider, accessToken);
}
