import { copyFile, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const outputDir = path.join(rootDir, 'dist', 'web-components');

function sleep(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function copyFileWithRetry(sourcePath, destinationPath, retries = 6) {
  for (let attempt = 0; attempt < retries; attempt += 1) {
    try {
      await copyFile(sourcePath, destinationPath);
      return;
    } catch (error) {
      if (error?.code !== 'EPERM' || attempt === retries - 1) {
        throw error;
      }

      await sleep(150 * (attempt + 1));
    }
  }
}

function extractRelativeRuntimeImports(sourceCode) {
  const matches = new Set();
  const patterns = [
    /import\s+["'](\.\/[^"']+\.(?:js|css))["']/g,
    /from\s+["'](\.\/[^"']+\.(?:js|css))["']/g,
    /import\(\s*["'](\.\/[^"']+\.(?:js|css))["']\s*\)/g,
    /new URL\(\s*["'](\.\/[^"']+\.(?:js|css))["']/g
  ];

  for (const pattern of patterns) {
    for (const match of sourceCode.matchAll(pattern)) {
      matches.add(match[1]);
    }
  }

  return [...matches];
}

async function collectRuntimeGraph(sourceDir, entryFileNames) {
  const filesToCopy = new Set(entryFileNames);
  const pendingJsFiles = entryFileNames.filter((fileName) => fileName.endsWith('.js'));

  while (pendingJsFiles.length > 0) {
    const currentFile = pendingJsFiles.pop();
    const sourcePath = path.join(sourceDir, currentFile);
    const sourceCode = await readFile(sourcePath, 'utf8');
    const relativeImports = extractRelativeRuntimeImports(sourceCode);

    for (const relativeImport of relativeImports) {
      const normalizedImport = path.normalize(relativeImport.replace(/^\.\//, ''));

      if (filesToCopy.has(normalizedImport)) {
        continue;
      }

      filesToCopy.add(normalizedImport);

      if (normalizedImport.endsWith('.js')) {
        pendingJsFiles.push(normalizedImport);
      }
    }
  }

  return [...filesToCopy];
}

async function copyRuntimeGraph(sourceDir, destinationDir, entryFileNames) {
  await mkdir(destinationDir, { recursive: true });
  const runtimeFiles = await collectRuntimeGraph(sourceDir, entryFileNames);

  for (const relativeFilePath of runtimeFiles) {
    const sourcePath = path.join(sourceDir, relativeFilePath);
    const destinationPath = path.join(destinationDir, relativeFilePath);
    await mkdir(path.dirname(destinationPath), { recursive: true });
    await copyFileWithRetry(sourcePath, destinationPath);
  }
}

await rm(outputDir, { recursive: true, force: true });
await mkdir(outputDir, { recursive: true });

await copyRuntimeGraph(
  path.join(rootDir, 'packages', 'atlaskit-editor', 'dist'),
  path.join(outputDir, 'atlaskit-editor'),
  ['atlas-atlaskit-editor.js', 'atlas-atlaskit-editor.css']
);

await copyRuntimeGraph(
  path.join(rootDir, 'packages', 'atlaskit-navigation', 'dist'),
  path.join(outputDir, 'atlaskit-navigation'),
  ['atlas-atlaskit-navigation.js', 'atlas-atlaskit-navigation.css']
);

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
