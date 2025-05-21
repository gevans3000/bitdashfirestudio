
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'coin-images.coingecko.com',
        port: '',
        pathname: '/coins/images/**',
      },
      {
        protocol: 'https',
        hostname: 'assets.coingecko.com',
        port: '',
        pathname: '/coins/images/**',
      }
    ],
  },
};

export default nextConfig;
