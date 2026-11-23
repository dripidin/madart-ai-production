const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT_DIR = path.resolve(__dirname, '..');
const ADMIN_DIR = path.join(ROOT_DIR, 'admin-dashboard');
const ADMIN_OUT_DIR = path.join(ADMIN_DIR, 'out');
const TARGET_ADMIN_DIR = path.join(ROOT_DIR, 'admin');
const NEXT_BIN = path.join(
  ADMIN_DIR,
  'node_modules',
  '.bin',
  process.platform === 'win32' ? 'next.cmd' : 'next'
);

function run(cmd, cwd = ROOT_DIR) {
  console.log(`[build-admin] Running: ${cmd}`);
  execSync(cmd, { cwd, stdio: 'inherit' });
}

function flattenWindowsRscSegmentDirs(dir) {
  let fixedCount = 0;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.name === '_next') continue;
    if (entry.name.startsWith('__next.')) {
      const stack = [fullPath];
      while (stack.length > 0) {
        const current = stack.pop();
        for (const child of fs.readdirSync(current, { withFileTypes: true })) {
          const childPath = path.join(current, child.name);
          if (child.isDirectory()) {
            stack.push(childPath);
          } else if (child.isFile()) {
            const rel = path.relative(fullPath, childPath);
            const flatName = `${entry.name}.${rel.split(/[\\/]+/).join('.')}`;
            fs.copyFileSync(childPath, path.join(dir, flatName));
            fixedCount++;
          }
        }
      }
      fs.rmSync(fullPath, { recursive: true, force: true });
    } else {
      fixedCount += flattenWindowsRscSegmentDirs(fullPath);
    }
  }
  return fixedCount;
}

function main() {
  if (!fs.existsSync(NEXT_BIN)) {
    console.log('[build-admin] admin-dashboard dependencies missing; installing...');
    run('npm --prefix admin-dashboard ci --include=dev');
  }

  run('npm --prefix admin-dashboard run build');

  if (!fs.existsSync(ADMIN_OUT_DIR)) {
    throw new Error(`Expected static export output at ${ADMIN_OUT_DIR}, but directory does not exist.`);
  }

  fs.rmSync(TARGET_ADMIN_DIR, { recursive: true, force: true });
  fs.cpSync(ADMIN_OUT_DIR, TARGET_ADMIN_DIR, { recursive: true });

  // Next.js 16 convertSegmentPathToStaticExportFilename only replaces '/', leaving Windows '\' as nested dirs.
  const flattened = flattenWindowsRscSegmentDirs(TARGET_ADMIN_DIR);
  if (flattened > 0) {
    console.log(`[build-admin] Normalized ${flattened} Windows RSC segment files.`);
  }

  console.log(`[build-admin] Exported admin dashboard to ${TARGET_ADMIN_DIR}`);
}

main();
