import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import dts from 'vite-plugin-dts';

export default defineConfig({
  plugins: [
    react(),
    dts({
      tsconfigPath: './tsconfig.json',
      insertTypesEntry: true
    })
  ],
  build: {
    lib: {
      entry: './src/index.ts',
      name: 'AtlasAtlaskitNavigation',
      fileName: () => 'atlas-atlaskit-navigation.js',
      formats: ['es']
    },
    sourcemap: true
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify('production'),
    'process.env.CI': JSON.stringify('false'),
    'process.env.REACT_SSR': JSON.stringify('false')
  }
});
