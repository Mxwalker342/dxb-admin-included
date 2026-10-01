import { readdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
for (const folder of ['dist','scripts']) {
  for (const file of readdirSync(folder).filter(f => /\.(m?js)$/.test(f))) {
    const result = spawnSync(process.execPath, ['--check', folder + '/' + file], { stdio: 'inherit' });
    if (result.status) process.exit(result.status);
  }
}
console.log('All JavaScript syntax checks passed.');
