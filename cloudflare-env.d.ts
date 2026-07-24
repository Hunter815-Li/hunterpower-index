/** Minimal local declarations for the Cloudflare bindings supplied by Sites at runtime. */
interface Fetcher {
  fetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response>;
}

declare module "cloudflare:workers" {
  export const env: {
    [key: string]: unknown;
  };
}
