/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  serverExternalPackages: ['better-sqlite3'],
  outputFileTracingIncludes: {
    '/api/crowdsec': ['./node_modules/better-sqlite3/**/*'],
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = [...(Array.isArray(config.externals) ? config.externals : []), 'better-sqlite3']
    }
    return config
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
      { protocol: 'http', hostname: '**' },
    ],
  },
}

module.exports = nextConfig
