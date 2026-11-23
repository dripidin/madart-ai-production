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
  console.log(`[build-admin] Exported admin dashboard to ${TARGET_ADMIN_DIR}`);
}

main();
