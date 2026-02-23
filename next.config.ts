import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactCompiler: true,
  allowedDevOrigins: ['127.0.0.1', 'localhost'],
  turbopack: {
    root: __dirname,
  },
}

export default nextConfig
