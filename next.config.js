/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  serverExternalPackages: ['better-sqlite3', 'maxmind', 'tsdav', 'ical.js', 'rrule', 'digest-fetch'],
  transpilePackages: ['ical.js'],
  outputFileTracingIncludes: {
    '/*': ['./node_modules/better-sqlite3/**/*'],
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
      { protocol: 'http', hostname: '**' },
    ],
  },
}

module.exports = nextConfig
