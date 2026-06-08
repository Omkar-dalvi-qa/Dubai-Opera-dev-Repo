import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  reactCompiler: true,

  images: {
    loader: 'custom',
    loaderFile: './src/utils/imageloader.ts',
    qualities: [75, 80],
    deviceSizes: [160, 320, 480, 640, 750, 828, 1080, 1200, 1440, 1600, 1920, 2048, 2304, 2560, 2816, 3072, 3328, 3584, 3840]
  },
  // Use bfcache-compatible cache headers.
  // "no-store" blocks bfcache; "private, no-cache" allows it.
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Cache-Control",
            value: "private, no-cache",
          },
        ],
      },
    ];
  },
};

export default withNextIntl(nextConfig);
