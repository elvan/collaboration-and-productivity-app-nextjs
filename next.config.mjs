/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: true,
    serverComponentsExternalPackages: ['@prisma/client'],
  },
  images: {
    domains: ['avatars.githubusercontent.com', 'lh3.googleusercontent.com'],
  },
  typescript: {
    ignoreBuildErrors: false,
  },
};

export default nextConfig;
