import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  define: {
    'process.env.NODE_ENV': JSON.stringify('production'),
    'process.env.REACT_SSR': 'false',
    'process.env.CI': 'false'
  },
  plugins: [react()],
  build: {
    outDir: 'dist',
    emptyOutDir: false,
    lib: {
      entry: 'src/index.ts',
      name: 'AtlasAtlaskitNavigation',
      fileName: 'atlas-atlaskit-navigation',
      formats: ['es']
    },
    sourcemap: process.env.VITE_BUILD_SOURCEMAP === 'true',
    rollupOptions: {}
  }
});
