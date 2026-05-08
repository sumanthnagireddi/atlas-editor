import { cp, mkdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const outputDir = path.join(rootDir, 'dist', 'web-components');

function shouldCopyRuntimeAsset(sourcePath) {
  return !sourcePath.endsWith('.d.ts') && !sourcePath.endsWith('.map');
}

await rm(outputDir, { recursive: true, force: true });
await mkdir(outputDir, { recursive: true });

await cp(path.join(rootDir, 'packages', 'atlaskit-editor', 'dist'), path.join(outputDir, 'atlaskit-editor'), {
  recursive: true,
  filter: shouldCopyRuntimeAsset
});

await cp(path.join(rootDir, 'packages', 'atlaskit-navigation', 'dist'), path.join(outputDir, 'atlaskit-navigation'), {
  recursive: true,
  filter: shouldCopyRuntimeAsset
});

const editorLoaderSource = `const baseUrl = new URL('.', import.meta.url);

function ensureBrowserProcessShim() {
  const globalScope = globalThis;
  globalScope.process ??= {};
  globalScope.process.env ??= {};
  globalScope.process.env.NODE_ENV ??= 'production';
  globalScope.process.env.CI ??= 'false';
  globalScope.process.env.REACT_SSR ??= 'false';
}

function ensureStylesheet(relativePath) {
  const href = new URL(relativePath, baseUrl).href;
  if (document.querySelector(\`link[href="\${href}"]\`)) {
    return;
  }

  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = href;
  document.head.append(link);
}

async function registerAtlasElements() {
  ensureBrowserProcessShim();
  ensureStylesheet('./atlaskit-editor/atlas-atlaskit-editor.css');

  const { defineAtlaskitEditorElement } = await import(new URL('./atlaskit-editor/atlas-atlaskit-editor.js', baseUrl).href);

  defineAtlaskitEditorElement('atlas-editor');
}

registerAtlasElements().catch((error) => {
  console.error('Unable to bootstrap atlas-editor web component', error);
});
`;

const sideNavLoaderSource = `const baseUrl = new URL('.', import.meta.url);

function ensureBrowserProcessShim() {
  const globalScope = globalThis;
  globalScope.process ??= {};
  globalScope.process.env ??= {};
  globalScope.process.env.NODE_ENV ??= 'production';
  globalScope.process.env.CI ??= 'false';
  globalScope.process.env.REACT_SSR ??= 'false';
}

function ensureStylesheet(relativePath) {
  const href = new URL(relativePath, baseUrl).href;
  if (document.querySelector(\`link[href="\${href}"]\`)) {
    return;
  }

  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = href;
  document.head.append(link);
}

async function registerAtlasSideNav() {
  ensureBrowserProcessShim();
  ensureStylesheet('./atlaskit-navigation/atlas-atlaskit-navigation.css');

  const { defineAtlaskitSideNavElement } = await import(new URL('./atlaskit-navigation/atlas-atlaskit-navigation.js', baseUrl).href);

  defineAtlaskitSideNavElement('atlas-side-nav');
}

registerAtlasSideNav().catch((error) => {
  console.error('Unable to bootstrap atlas-side-nav web component', error);
});
`;

await writeFile(path.join(outputDir, 'atlas-editor.js'), editorLoaderSource, 'utf8');
await writeFile(path.join(outputDir, 'atlas-side-nav.js'), sideNavLoaderSource, 'utf8');

console.log(`Web component bundle prepared at ${outputDir}`);
