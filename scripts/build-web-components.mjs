import { cp, mkdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const outputDir = path.join(rootDir, 'dist', 'web-components');

await rm(outputDir, { recursive: true, force: true });
await mkdir(outputDir, { recursive: true });

await cp(path.join(rootDir, 'packages', 'atlaskit-editor', 'dist'), path.join(outputDir, 'atlaskit-editor'), {
  recursive: true
});

await cp(
  path.join(rootDir, 'packages', 'atlaskit-navigation', 'dist'),
  path.join(outputDir, 'atlaskit-navigation'),
  { recursive: true }
);

const loaderSource = `const baseUrl = new URL('.', import.meta.url);

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
  ensureStylesheet('./atlaskit-editor/atlas-atlaskit-editor.css');
  ensureStylesheet('./atlaskit-navigation/atlaskit-navigation.css');

  const [{ defineAtlaskitEditorElement }, { defineAtlaskitNavigationElement }] = await Promise.all([
    import(new URL('./atlaskit-editor/atlas-atlaskit-editor.js', baseUrl).href),
    import(new URL('./atlaskit-navigation/atlas-atlaskit-navigation.js', baseUrl).href)
  ]);

  defineAtlaskitEditorElement('atlas-editor');
  defineAtlaskitNavigationElement('atlas-sidebar');
}

registerAtlasElements();
`;

await writeFile(path.join(outputDir, 'atlas-editor.js'), loaderSource, 'utf8');

console.log(`Web component bundle prepared at ${outputDir}`);
