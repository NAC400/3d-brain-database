const path = require('node:path');
const { spawnSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');
const frontend = path.join(root, 'frontend');
const build = path.join(frontend, 'node_modules/react-scripts/scripts/build.js');
const result = spawnSync(process.execPath, [build], {
  cwd: frontend,
  env: { ...process.env, REACT_APP_PAGES_BUILD: 'true' },
  stdio: 'inherit',
});
if (result.error) throw result.error;
if (result.status !== 0) process.exit(result.status || 1);
require('./prepare-pages-assets.cjs');
