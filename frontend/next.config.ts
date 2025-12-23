import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === 'development';

const nextConfig: NextConfig = {
  output: 'export',
  distDir: 'assets', 
  images: {
    unoptimized: true,
  },

  rewrites: isDev ? async () => {
    return [
      { source: '/api/:path*', destination: 'http://127.0.0.1:8000/api/:path*' },
      { source: '/video-hls/:path*', destination: 'http://127.0.0.1:8000/video-hls/:path*' },
      { source: '/music-hls/:path*', destination: 'http://127.0.0.1:8000/music-hls/:path*' },
      { source: '/video-upload/:path*', destination: 'http://127.0.0.1:8000/video-upload/:path*' },
      { source: '/music-upload/:path*', destination: 'http://127.0.0.1:8000/music-upload/:path*' },
      { source: '/ws/:path*', destination: 'http://127.0.0.1:8000/ws/:path*' },
    ]
  } : undefined, 
}

export default nextConfig;
