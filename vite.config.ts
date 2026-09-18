import { defineConfig, type Plugin } from 'vite'
import { devtools } from '@tanstack/devtools-vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { nitro } from 'nitro/vite'

function signovaApiPlugin(): Plugin {
  return {
    name: 'signova-api-middleware',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.url && req.url.startsWith('/api/') && !req.url.startsWith('/api/auth')) {
          try {
            const { handleApiRequest } = await import('./src/server/api-middleware.ts')
            const handled = await handleApiRequest(req, res)
            if (handled) return
          } catch (e) {
            console.error('API middleware error:', e)
          }
        }
        next()
      })
    },
  }
}

const config = defineConfig({
  resolve: { tsconfigPaths: true },
  plugins: [
    signovaApiPlugin(),
    devtools(),
    nitro({ rollupConfig: { external: [/^@sentry\//] } }),
    tailwindcss(),
    tanstackStart(),
    viteReact(),
  ],
})

export default config
