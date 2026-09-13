import { defineConfig } from 'vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import viteTsConfigPaths from 'vite-tsconfig-paths'

// Reflet — dashboard TanStack Start (remplace l'ancien setup Next.js,
// conservé pour référence dans _legacy_next_reference/)
export default defineConfig({
  plugins: [
    viteTsConfigPaths({ projects: ['./tsconfig.json'] }),
    // tanstackStart() intègre et gère Nitro en interne, DOIT venir avant viteReact()
    tanstackStart(),
    viteReact(),
  ],
})
