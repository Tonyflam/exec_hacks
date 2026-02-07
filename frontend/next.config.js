/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
      child_process: false,
      dns: false,
    };

    // The iExec SDK transitively depends on kubo-rpc-client → native-fetch → undici.
    // undici uses private class field syntax (#target in this) that
    // Next.js 14.1's webpack pipeline cannot parse.
    // These are only needed for direct IPFS uploads; the DataProtector SDK
    // routes all operations through iExec's API gateway so stubbing is safe.
    config.resolve.alias = {
      ...config.resolve.alias,
      'undici': false,
      'native-fetch': false,
      'kubo-rpc-client': false,
      'ipfs-utils': false,
    };

    config.externals.push('pino-pretty', 'lokijs', 'encoding');
    return config;
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
      },
    ],
  },
  // Suppress build warnings for unused variables in client components
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
};

module.exports = nextConfig;
