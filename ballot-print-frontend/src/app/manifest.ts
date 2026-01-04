// app/manifest.ts
import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: 'Postal Envelope Print',
        short_name: 'Postal Envelope Print',
        description: 'Postal Service Envelope Printing Application',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        background_color: '#C41C22',
        theme_color: '#ffffff',
        orientation: 'portrait',
        icons: [
            { src: '/icon-192x192.png', sizes: '192x192', type: 'image/png' },
            { src: '/icon-256x256.png', sizes: '256x256', type: 'image/png' },
            { src: '/icon-384x384.png', sizes: '384x384', type: 'image/png' },

            { src: '/icon-512x512.png', sizes: '512x512', type: 'image/png' },
            { src: '/maskable_icon_x192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
            { src: '/maskable_icon_x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
        categories: ['printing', 'utilities'],
    };
}
