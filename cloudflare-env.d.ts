/** Minimal local declarations for the Cloudflare bindings supplied by Sites at runtime. */
interface Fetcher {
  fetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response>;
}

type D1Database = any;

declare module "cloudflare:workers" {
  export const env: {
    DB?: D1Database;
    [key: string]: unknown;
  };
}
