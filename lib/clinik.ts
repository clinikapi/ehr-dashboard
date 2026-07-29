// Server-only ClinikAPI client.
//
// The SDK holds your secret API key and therefore must NEVER be imported from
// a client component — the `server-only` import makes that a build error
// instead of a leaked credential. Browser code talks to ClinikAPI exclusively
// through the proxy route (`app/api/clinikapi/route.ts`), which is also what
// the @clinikapi/react widgets expect via their `proxyUrl` prop.
import 'server-only';

import { Clinik } from '@clinikapi/sdk';

let client: Clinik | null = null;

export function isConfigured(): boolean {
  return Boolean(process.env.CLINIKAPI_KEY);
}

export function clinik(): Clinik {
  if (!client) {
    const key = process.env.CLINIKAPI_KEY;
    if (!key) {
      throw new Error(
        'CLINIKAPI_KEY is not set. Copy .env.example to .env.local and add a key from https://dashboard.clinikapi.com',
      );
    }
    client = new Clinik(key, {
      baseUrl: process.env.CLINIKAPI_BASE_URL || undefined,
    });
  }
  return client;
}
