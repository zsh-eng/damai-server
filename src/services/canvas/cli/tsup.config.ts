import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  // format: ['esm'],
  platform: 'node',
  bundle: true,
  outDir: 'dist',
  target: 'node20',
  plugins: [
  ],
  define: {
    'process.env.NODE_ENV': '"production"'
  }
})