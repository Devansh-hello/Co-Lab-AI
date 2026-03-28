import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Middleware plugin: sets strict COOP/COEP headers only when
// ?webcontainer is in the URL, so Google OAuth popups still work
// on normal pages. The IDE modal adds ?webcontainer when booting.
function crossOriginHeaders(): Plugin {
  return {
    name: 'cross-origin-headers',
    configureServer(server) {
      server.middlewares.use((_req, res, next) => {
        // Always set COEP credentialless (safe for all pages)
        res.setHeader('Cross-Origin-Embedder-Policy', 'credentialless')
        // same-origin: required for SharedArrayBuffer (WebContainers)
        // Google OAuth uses FedCM/redirect mode instead of popups
        res.setHeader('Cross-Origin-Opener-Policy', 'same-origin')
        next()
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), crossOriginHeaders()],
  server: {
    proxy: {
      // REST API
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      // WebSocket
      '/ws': {
        target: 'ws://localhost:5000',
        ws: true,
        changeOrigin: true,
      },
    },
  },
})
