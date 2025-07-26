/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
  webpack: (config, { isServer }) => {
    // Disable webpack caching to prevent ENOENT errors
    config.cache = false;
    
    // Add optimization settings for better HMR handling
    config.optimization = {
      ...config.optimization,
      runtimeChunk: 'single',
      moduleIds: 'deterministic',
    };
    
    return config;
  },
};

module.exports = nextConfig;