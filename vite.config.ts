import { defineConfig } from 'vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import { nitro } from 'nitro/vite'
import viteReact from '@vitejs/plugin-react'
import viteTsConfigPaths from 'vite-tsconfig-paths'

// Reflet — dashboard TanStack Start (remplace l'ancien setup Next.js,
// conservé pour référence dans _legacy_next_reference/)
export default defineConfig({
  plugins: [
    viteTsConfigPaths({ projects: ['./tsconfig.json'] }),
    // tanstackStart() DOIT venir avant viteReact()
    tanstackStart(),
    nitro(),
    viteReact(),
  ],
})
