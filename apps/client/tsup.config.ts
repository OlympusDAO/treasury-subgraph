import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['../server/.wundergraph/generated/client.ts'],
  splitting: false,
  bundle: true,
  clean: true,
  dts: true,
  outDir: 'dist',
  format: ['cjs', 'esm'],
});