/** @type {import('next').NextConfig} */
const nextConfig = {
    async rewrites() {
        return [
            {
                source: '/api/chat',
                destination: 'http://127.0.0.1:5000/chat',
            },
            {
                source: '/api/:path*',
                destination: 'http://127.0.0.1:5000/:path*',
            },
        ]
    },
    // Add timeout and connection handling
    experimental: {
        proxyTimeout: 120000, // 2 minutes timeout
    },
}

module.exports = nextConfig