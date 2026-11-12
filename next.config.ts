import type { NextConfig } from "next";

const allowedDevOrigins = (
  process.env.DEV_ALLOWED_ORIGINS ?? "127.0.0.1,192.168.1.19"
)
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const nextConfig: NextConfig = {
  // The tutorial is commonly opened from another device on the robot team's LAN.
  // Next.js blocks dev-only assets from non-localhost origins unless they are
  // explicitly trusted.
  allowedDevOrigins,
  // Lesson paths are constructed dynamically, including in the grading API.
  outputFileTracingIncludes: {
    "/*": ["./content/**/*"],
  },
};

export default nextConfig;
