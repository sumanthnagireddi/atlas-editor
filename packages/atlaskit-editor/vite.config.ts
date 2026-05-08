import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  define: {
    'process.env.NODE_ENV': JSON.stringify('production'),
    'process.env.REACT_SSR': 'false',
    'process.env.CI': 'false',
    'process.env.ENABLE_PLATFORM_FF': 'false',
    'process.env.STORYBOOK_ENABLE_PLATFORM_FF': 'false'
  },
  plugins: [react()],
  build: {
    outDir: 'dist',
    emptyOutDir: false,
    lib: {
      entry: 'src/index.ts',
      name: 'AtlasAtlaskitEditor',
      fileName: 'atlas-atlaskit-editor',
      formats: ['es']
    },
    sourcemap: process.env.VITE_BUILD_SOURCEMAP === 'true',
    rollupOptions: {}
  }
});
