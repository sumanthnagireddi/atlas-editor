import { spawn } from 'node:child_process';
import { stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

function runNpmScript(args, label) {
  return new Promise((resolve, reject) => {
    const command = process.platform === 'win32' ? 'cmd.exe' : 'npm';
    const commandArgs =
      process.platform === 'win32'
        ? ['/d', '/s', '/c', ['npm', ...args].join(' ')]
        : args;

    const child = spawn(command, commandArgs, {
      cwd: rootDir,
      env: process.env,
      stdio: 'pipe',
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

async function fileExists(relativePath) {
  try {
    await stat(path.join(rootDir, relativePath));
    return true;
  } catch {
    return false;
  }
}

const runtimeReady =
  (await fileExists('dist/web-components/atlas-editor.js')) &&
  (await fileExists('dist/web-components/atlas-side-nav.js'));

if (!runtimeReady) {
  await runNpmScript(['run', 'build:editor'], 'editor');
  await runNpmScript(['run', 'build:navigation'], 'navigation');
  await runNpmScript(['run', 'build:bundle'], 'bundle');
}

await runNpmScript(['run', 'build:angular:compile', '-w', 'packages/angular'], 'angular-compile');
