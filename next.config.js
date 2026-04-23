/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Allow base64 data URLs for AI-generated images returned by OpenAI
    dangerouslyAllowSVG: false,
    remotePatterns: [],
  },
};

module.exports = nextConfig;
