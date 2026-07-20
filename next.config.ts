import type { NextConfig } from "next";

const isCloudBaseStaticExport = process.env.CLOUDBASE_STATIC_EXPORT === "1";

const nextConfig: NextConfig = {
  // CloudBase's static hosting cannot run Next.js route handlers or SSR. The
  // dedicated CloudBase build renders the dashboard once during the build and
  // publishes the generated HTML/assets. Vercel keeps the normal server build.
  ...(isCloudBaseStaticExport ? { output: "export" as const } : {}),
  images: isCloudBaseStaticExport ? { unoptimized: true } : undefined,
};

export default nextConfig;
