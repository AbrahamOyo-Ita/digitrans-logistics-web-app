import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

if(process.env.VERCEL==='1'){
  const apiBase=String(process.env.VITE_API_BASE_URL||'').trim().replace(/\/+$/,'');
  let apiUrl;
  try{apiUrl=new URL(apiBase);}catch{throw new Error('Set VITE_API_BASE_URL to the HTTPS origin of the DigiTrans API in Vercel project settings.');}
  if(apiUrl.protocol!=='https:'||apiUrl.origin!==apiBase||apiUrl.username||apiUrl.password)throw new Error('VITE_API_BASE_URL must be a public HTTPS origin only (for example, https://api.example.com).');
}

export default defineConfig({
  plugins: [react()],
  root: 'client',
  publicDir: '../public',
  build: {
    outDir: '../dist',
    emptyOutDir: true,
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    allowedHosts: ['.e2b.app'],
    proxy: {
      '/api': 'http://localhost:3001',
      '/uploads': 'http://localhost:3001',
    },
  },
});
