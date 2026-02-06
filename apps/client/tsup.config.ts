import { defineConfig } from 'tsup';

// Ensure required environment variables are set for release builds
if (!process.env.WG_PUBLIC_NODE_URL) {
  throw new Error('WG_PUBLIC_NODE_URL environment variable is required for release builds. Please set it in .env.prod');
}

// Strip trailing slash from the URL to avoid double slashes when used
const BASE_URL = process.env.WG_PUBLIC_NODE_URL.replace(/\/$/, '');

export default defineConfig({
  entry: ['src/client.ts'],
  splitting: false,
  bundle: true,
  clean: true,
  dts: true,
  outDir: 'dist',
  format: ['cjs', 'esm'],
  target: 'es2020',
  sourcemap: true,
  // Define build-time constants (URL is baked in during production build)
  define: {
    __DEFAULT_BASE_URL__: JSON.stringify(BASE_URL),
  },
});
