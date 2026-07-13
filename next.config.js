/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ["s3.amazonaws.com"],
  },
  output: "standalone",
  experimental: {
    serverComponentsExternalPackages: ["@prisma/client", "prisma"],
  },
};

module.exports = nextConfig;
