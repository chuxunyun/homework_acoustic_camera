import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    port: 8502,
    strictPort: true,
    host: '127.0.0.1',
    open: false,
  },
})
