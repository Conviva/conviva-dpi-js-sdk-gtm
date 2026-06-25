import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 5173,
  },
  define: {
    'import.meta.env.VITE_CONVIVA_CUSTOMER_KEY': JSON.stringify(
      process.env.VITE_CONVIVA_CUSTOMER_KEY ?? '',
    ),
  },
});
