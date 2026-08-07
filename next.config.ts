import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The tutorial is commonly opened from another device on the robot team's LAN.
  // Next.js blocks dev-only assets from non-localhost origins unless they are
  // explicitly trusted.
  allowedDevOrigins: ["192.168.1.19"],
};

export default nextConfig;
