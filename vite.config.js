import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import os from 'os'

const interfaces = os.networkInterfaces()
const lanIP = Object.values(interfaces)
  .flat()
  .find((iface) => iface?.family === 'IPv4' && !iface.internal)?.address

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(),tailwindcss()],
  server: {
    host: true, // <- this is important
    port: 5173,
    proxy: {
      '/api': `http://${lanIP}:5000`, // <-- my backend port
    }
  }
})
