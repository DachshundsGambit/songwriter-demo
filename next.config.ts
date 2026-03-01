import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['pg', 'ffmpeg-static', 'fluent-ffmpeg'],
};

export default nextConfig;
