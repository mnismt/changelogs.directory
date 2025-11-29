import { defineConfig } from 'vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import viteTsConfigPaths from 'vite-tsconfig-paths'
import tailwindcss from '@tailwindcss/vite'
import { nitroV2Plugin } from '@tanstack/nitro-v2-vite-plugin'
import { resolve } from 'path'

const config = defineConfig({
  plugins: [
    // this is the plugin that enables path aliases
    nitroV2Plugin({
      compatibilityDate: 'latest'
    }),
    viteTsConfigPaths({
      projects: ['./tsconfig.json'],
    }),
    tailwindcss(),
    tanstackStart(),
    viteReact(),
  ],
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      'tests': resolve(__dirname, './tests'),
    },
  },
  optimizeDeps: {
    exclude: ['@tanstack/react-start', '@tanstack/start-server-core'],
  },
})

export default config
