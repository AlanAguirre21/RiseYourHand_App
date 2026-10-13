import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'

// Names the production server ("vite preview") answers to, besides localhost and IP addresses.
// Set by ecosystem.config.js: without them, opening the app by the name of the server is blocked
const allowedHosts = (process.env.ALLOWED_HOSTS ?? '').split(',').map(host => host.trim()).filter(Boolean)

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss()
  ],
  server: {
    // Backend (PORT in backend/.env). "vite preview" uses the same proxy
    proxy: { '/api': 'http://localhost:3000' },
  },
  preview: { allowedHosts },
})
