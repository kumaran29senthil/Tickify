/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.convex.cloud',
      },
      // Add any other domains you use for images
    ],
  },
  // ... other config options
}

module.exports = nextConfig