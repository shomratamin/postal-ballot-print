// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    // If you serve images/APIs from other origins, add them here for caching
    images: { remotePatterns: [{ protocol: 'https', hostname: '**' }] },
};

const withPWA = require('@ducanh2912/next-pwa').default({
    dest: 'public',
    cacheOnFrontEndNav: true,
    aggressiveFrontEndNavCaching: true,
    reloadOnOnline: true,
    swcMinify: true,
    disable: process.env.NODE_ENV === 'development', // keep dev simple
    // Optional: tune caching
    workboxOptions: {
        runtimeCaching: [
            {
                urlPattern: ({ request }) => request.destination === 'document',
                handler: 'NetworkFirst',
                options: { cacheName: 'pages', expiration: { maxEntries: 50, maxAgeSeconds: 7 * 24 * 3600 } },
            },
            {
                urlPattern: ({ request }) => ['style', 'script', 'worker'].includes(request.destination),
                handler: 'StaleWhileRevalidate',
                options: { cacheName: 'assets', expiration: { maxEntries: 100, maxAgeSeconds: 30 * 24 * 3600 } },
            },
            {
                urlPattern: ({ request }) => ['image', 'font'].includes(request.destination),
                handler: 'CacheFirst',
                options: { cacheName: 'static-media', expiration: { maxEntries: 100, maxAgeSeconds: 60 * 24 * 3600 } },
            },
            {
                urlPattern: ({ url }) => url.pathname.startsWith('/api/'),
                handler: 'NetworkFirst',
                options: { cacheName: 'api', networkTimeoutSeconds: 10, expiration: { maxEntries: 50, maxAgeSeconds: 24 * 3600 } },
            },
        ],
    },
});

module.exports = withPWA(nextConfig);






// /** @type {import('next').NextConfig} */
// const withPWA = require("@ducanh2912/next-pwa").default({
//     dest: "public",
//     cacheOnFrontEndNav: true,
//     aggressiveFrontEndNavCaching: true,
//     reloadOnOnline: true,
//     swcMinify: true,
//     disable: false,

// });



// const nextConfig = {
//     // async headers() {
//     //     return [
//     //         {

//     //             source: '/(.*)',
//     //             headers: [
//     //                 { key: 'Access-Control-Allow-Credentials', value: 'true' },
//     //                 { key: 'Access-Control-Allow-Origin', value: '*' }, // allow all origins
//     //                 { key: 'Access-Control-Allow-Methods', value: 'GET,OPTIONS,PATCH,DELETE,POST,PUT' },
//     //                 { key: 'Access-Control-Allow-Headers', value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version' },
//     //             ],
//     //         },
//     //     ]
//     // },
// }



// module.exports = withPWA(nextConfig);
