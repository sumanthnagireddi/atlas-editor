import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { readdir } from 'node:fs/promises';

const rootDir = process.cwd();
const cacheDir = path.join(rootDir, 'node_modules', '.cache');
const manifestPath = path.join(cacheDir, 'atlas-build-manifest.json');

function runNpmScript(args, label) {
  return new Promise((resolve, reject) => {
    const command = process.platform === 'win32' ? 'cmd.exe' : 'npm';
    const commandArgs =
      process.platform === 'win32'
        ? ['/d', '/s', '/c', ['npm', ...args].join(' ')]
        : args;

    const child = spawn(command, commandArgs, {
      cwd: process.cwd(),
      env: process.env,
      stdio: 'pipe'
    });

    const prefix = `[${label}]`;

    child.stdout.on('data', (chunk) => {
      process.stdout.write(`${prefix} ${chunk}`);
    });

    child.stderr.on('data', (chunk) => {
      process.stderr.write(`${prefix} ${chunk}`);
    });

    child.on('error', reject);

    child.on('close', (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`${label} failed with exit code ${code}`));
    });
  });
}

async function loadManifest() {
  try {
    const raw = await readFile(manifestPath, 'utf8');
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

async function saveManifest(manifest) {
  await mkdir(cacheDir, { recursive: true });
  await writeFile(manifestPath, JSON.stringify(manifest, null, 2));
}

async function collectFingerprintEntries(targetPath, entries, relativePrefix = '') {
  const resolvedPath = path.resolve(rootDir, targetPath);
  const fileStat = await stat(resolvedPath);

  if (fileStat.isDirectory()) {
    const children = await readdir(resolvedPath, { withFileTypes: true });
    const sortedChildren = [...children].sort((left, right) => left.name.localeCompare(right.name));

    for (const child of sortedChildren) {
      if (child.name === 'dist' || child.name === 'node_modules') {
        continue;
      }

      const childPath = path.join(targetPath, child.name);
      const childRelativePrefix = path.join(relativePrefix, child.name);
      await collectFingerprintEntries(childPath, entries, childRelativePrefix);
    }

    return;
  }

  entries.push(`${relativePrefix}|${fileStat.size}|${fileStat.mtimeMs}`);
}

async function hashInputs(inputs, additionalValues = []) {
  const entries = [];

  for (const input of inputs) {
    await collectFingerprintEntries(input, entries, input);
  }

  entries.push(...additionalValues);
  entries.sort();

  return createHash('sha256').update(entries.join('\n')).digest('hex');
}

async function outputsExist(outputPaths) {
  const results = await Promise.all(
    outputPaths.map(async (outputPath) => {
      try {
        await stat(path.resolve(rootDir, outputPath));
        return true;
      } catch {
        return false;
      }
    })
  );

  return results.every(Boolean);
}

async function collectNewestInputMtime(targetPath) {
  const resolvedPath = path.resolve(rootDir, targetPath);
  const fileStat = await stat(resolvedPath);

  if (!fileStat.isDirectory()) {
    return fileStat.mtimeMs;
  }

  let newestMtime = fileStat.mtimeMs;
  const children = await readdir(resolvedPath, { withFileTypes: true });

  for (const child of children) {
    if (child.name === 'dist' || child.name === 'node_modules') {
      continue;
    }

    const childMtime = await collectNewestInputMtime(path.join(targetPath, child.name));
    newestMtime = Math.max(newestMtime, childMtime);
  }

  return newestMtime;
}

async function outputsAreFresh(inputs, outputPaths) {
  if (!(await outputsExist(outputPaths))) {
    return false;
  }

  const newestInputMtime = Math.max(
    ...(await Promise.all(inputs.map((input) => collectNewestInputMtime(input))))
  );

  const outputMtims = await Promise.all(
    outputPaths.map(async (outputPath) => stat(path.resolve(rootDir, outputPath)).then((fileStat) => fileStat.mtimeMs))
  );

  return outputMtims.every((outputMtime) => outputMtime >= newestInputMtime);
}

async function runStep({
  manifest,
  stepId,
  label,
  inputs,
  outputs,
  commandArgs,
  additionalFingerprintValues = []
}) {
  const fingerprint = await hashInputs(inputs, additionalFingerprintValues);
  const cachedFingerprint = manifest[stepId];
  const freshOutputs = await outputsAreFresh(inputs, outputs);
  const isCacheHit =
    process.env.ATLAS_FORCE_BUILD !== '1' &&
    ((cachedFingerprint === fingerprint && freshOutputs) || (cachedFingerprint == null && freshOutputs));

  if (isCacheHit) {
    manifest[stepId] = fingerprint;
    console.log(`[${label}] cache hit, skipping`);
    return { fingerprint, skipped: true };
  }

  await runNpmScript(commandArgs, label);
  manifest[stepId] = fingerprint;
  return { fingerprint, skipped: false };
}

const startedAt = performance.now();
const manifest = await loadManifest();

console.log('Starting fast workspace build...');

const [editorRuntime, navigationRuntime] = await Promise.all([
  runStep({
    manifest,
    stepId: 'editor-runtime',
    label: 'editor-runtime',
    inputs: [
      'packages/atlaskit-editor/src',
      'packages/atlaskit-editor/package.json',
      'packages/atlaskit-editor/tsconfig.json',
      'packages/atlaskit-editor/tsconfig.types.json',
      'packages/atlaskit-editor/vite.config.ts'
    ],
    outputs: [
      'packages/atlaskit-editor/dist/atlas-atlaskit-editor.js',
      'packages/atlaskit-editor/dist/atlas-atlaskit-editor.css'
    ],
    commandArgs: ['run', 'build:editor:runtime']
  }),
  runStep({
    manifest,
    stepId: 'navigation-runtime',
    label: 'navigation-runtime',
    inputs: [
      'packages/atlaskit-navigation/src',
      'packages/atlaskit-navigation/package.json',
      'packages/atlaskit-navigation/tsconfig.json',
      'packages/atlaskit-navigation/tsconfig.types.json',
      'packages/atlaskit-navigation/vite.config.ts'
    ],
    outputs: [
      'packages/atlaskit-navigation/dist/atlas-atlaskit-navigation.js',
      'packages/atlaskit-navigation/dist/atlas-atlaskit-navigation.css'
    ],
    commandArgs: ['run', 'build:navigation:runtime']
  })
]);

const [editorTypes, navigationTypes, bundle] = await Promise.all([
  runStep({
    manifest,
    stepId: 'editor-types',
    label: 'editor-types',
    inputs: [
      'packages/atlaskit-editor/src',
      'packages/atlaskit-editor/package.json',
      'packages/atlaskit-editor/tsconfig.types.json'
    ],
    outputs: [
      'packages/atlaskit-editor/dist/index.d.ts',
      'packages/atlaskit-editor/dist/types.d.ts'
    ],
    commandArgs: ['run', 'build:editor:types']
  }),
  runStep({
    manifest,
    stepId: 'navigation-types',
    label: 'navigation-types',
    inputs: [
      'packages/atlaskit-navigation/src',
      'packages/atlaskit-navigation/package.json',
      'packages/atlaskit-navigation/tsconfig.types.json'
    ],
    outputs: [
      'packages/atlaskit-navigation/dist/index.d.ts',
      'packages/atlaskit-navigation/dist/types.d.ts'
    ],
    commandArgs: ['run', 'build:navigation:types']
  }),
  runStep({
    manifest,
    stepId: 'bundle',
    label: 'bundle',
    inputs: [
      'scripts/build-web-components.mjs',
      'packages/atlaskit-editor/dist/atlas-atlaskit-editor.js',
      'packages/atlaskit-editor/dist/atlas-atlaskit-editor.css',
      'packages/atlaskit-navigation/dist/atlas-atlaskit-navigation.js',
      'packages/atlaskit-navigation/dist/atlas-atlaskit-navigation.css'
    ],
    outputs: ['dist/web-components/atlas-editor.js', 'dist/web-components/atlas-side-nav.js'],
    commandArgs: ['run', 'build:bundle'],
    additionalFingerprintValues: [editorRuntime.fingerprint, navigationRuntime.fingerprint]
  })
]);

await runStep({
  manifest,
  stepId: 'angular',
  label: 'angular',
  inputs: [
    'apps/angular-shell/src',
    'apps/angular-shell/package.json',
    'apps/angular-shell/tsconfig.app.json',
    'angular.json',
    'dist/web-components/atlas-editor.js',
    'dist/web-components/atlas-side-nav.js',
    'dist/web-components/atlaskit-editor/atlas-atlaskit-editor.js',
    'dist/web-components/atlaskit-editor/atlas-atlaskit-editor.css',
    'dist/web-components/atlaskit-navigation/atlas-atlaskit-navigation.js',
    'dist/web-components/atlaskit-navigation/atlas-atlaskit-navigation.css'
  ],
  outputs: ['dist/angular-shell/browser/index.html'],
  commandArgs: ['run', 'build:angular'],
  additionalFingerprintValues: [editorTypes.fingerprint, navigationTypes.fingerprint, bundle.fingerprint]
});

await saveManifest(manifest);

const elapsedSeconds = ((performance.now() - startedAt) / 1000).toFixed(1);
console.log(`Workspace build completed in ${elapsedSeconds}s`);
