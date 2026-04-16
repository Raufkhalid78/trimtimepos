import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [
        react(),
        VitePWA({
          registerType: 'autoUpdate',
          includeAssets: ['icon.svg'],
          workbox: {
            maximumFileSizeToCacheInBytes: 5 * 1024 * 1024
          },
          manifest: {
            name: "TrimTime",
            short_name: "TrimTime",
            start_url: ".",
            display: "standalone",
            background_color: "#0f172a",
            theme_color: "#f59e0b",
            description: "POS & Management Platform for Barbers & Beauty Salons",
            orientation: "portrait",
            icons: [
              {
                src: "/icon.svg",
                sizes: "any",
                type: "image/svg+xml"
              },
              {
                src: "/icon.svg",
                sizes: "192x192",
                type: "image/svg+xml",
                purpose: "maskable"
              },
              {
                src: "/icon.svg",
                sizes: "512x512",
                type: "image/svg+xml",
                purpose: "maskable"
              }
            ]
          }
        })
      ],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.VITE_SUPABASE_URL': JSON.stringify(env.VITE_SUPABASE_URL),
        'process.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(env.VITE_SUPABASE_ANON_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      build: {
        chunkSizeWarningLimit: 600,
        rollupOptions: {
          output: {
            manualChunks: {
              'vendor-react': ['react', 'react-dom'],
              'vendor-charts': ['recharts'],
              'vendor-motion': ['framer-motion'],
              'vendor-supabase': ['@supabase/supabase-js'],
              'vendor-utils': ['date-fns', 'jspdf', 'react-markdown'],
            }
          }
        }
      }
    };
});
