import type { NextConfig } from "next";

const API_URL = process.env.API_URL || 'http://127.0.0.1:8000';

const nextConfig: NextConfig = {
  /* config options here */
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${API_URL}/:path*`,
      },
      {
        source: '/execute/:path*',
        destination: `${API_URL}/execute/:path*`,
      },
      {
        source: '/mind/:path*',
        destination: `${API_URL}/mind/:path*`,
      },
      {
        source: '/plx/:path*',
        destination: `${API_URL}/plx/:path*`,
      }
    ]
  }
};

export default nextConfig;
