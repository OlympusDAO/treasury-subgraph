import { defineConfig } from 'tsup';

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
    __DEFAULT_BASE_URL__: JSON.stringify(process.env.WG_PUBLIC_NODE_URL || 'http://localhost:9991'),
  },
});
