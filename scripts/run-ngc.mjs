import { access, rm, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const argv = process.argv.slice(2);
const compilerCliDir = new URL('../node_modules/@angular/compiler-cli/', import.meta.url);
const compilerCliPackageUrl = new URL('./package.json', compilerCliDir);
const compilerCliPackagePath = fileURLToPath(compilerCliPackageUrl);
let createdPackageManifest = false;

try {
  await access(compilerCliPackagePath);
} catch {
  await writeFile(compilerCliPackagePath, '{\n  "type": "module"\n}\n', 'utf8');
  createdPackageManifest = true;
}

process.argv = [process.argv[0], 'ngc', ...argv];

try {
  await import(new URL('./bundles/src/bin/ngc.js', compilerCliDir));
} finally {
  if (createdPackageManifest) {
    await rm(compilerCliPackagePath, { force: true });
  }
}
