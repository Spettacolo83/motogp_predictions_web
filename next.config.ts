import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import packageJson from "./package.json" with { type: "json" };

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  output: "standalone",
  serverExternalPackages: ["better-sqlite3"],
  env: {
    NEXT_PUBLIC_APP_VERSION: packageJson.version,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "photos.motogp.com",
      },
    ],
  },
};

export default withNextIntl(nextConfig);
