/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" }, // article cover images can come from anywhere for now
    ],
  },
};

export default nextConfig;
