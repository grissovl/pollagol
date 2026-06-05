import { createRequire } from 'module'
const require = createRequire(import.meta.url)

const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  // Disable SW completely in development to avoid stale-cache issues
  disable: process.env.NODE_ENV === 'development',
  // Remove outdated pre-cached assets on SW update
  cleanupOutdatedCaches: true,
})

/** @type {import('next').NextConfig} */
const nextConfig = {}

export default withPWA(nextConfig)
