// Fails on high or critical advisories in an `npm audit --json` report, unless they are in .npm-audit-allowlist.json.
// Usage: node scripts/check-npm-audit.mjs <report.json>
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const report = JSON.parse(readFileSync(process.argv[2], 'utf8'));
const allowlist = JSON.parse(readFileSync(join(root, '.npm-audit-allowlist.json'), 'utf8'));
const today = new Date().toISOString().slice(0, 10);

const advisories = new Map();
for (const vuln of Object.values(report.vulnerabilities ?? {})) {
  for (const via of vuln.via) {
    if (typeof via === 'object' && ['high', 'critical'].includes(via.severity)) {
      advisories.set(via.url.split('/').pop(), via);
    }
  }
}

let failed = false;
for (const [id, advisory] of advisories) {
  const entry = allowlist.find((e) => e.id === id);
  if (!entry) {
    console.log(`FAIL ${id} (${advisory.severity}) ${advisory.name}: ${advisory.title}`);
    failed = true;
  } else if (entry.review_by < today) {
    console.log(`FAIL ${id} ${advisory.name}: allowlisted until ${entry.review_by}, review it again`);
    failed = true;
  } else {
    console.log(`allowed ${id} ${advisory.name} until ${entry.review_by}: ${entry.reason}`);
  }
}

if (advisories.size === 0) console.log('No high or critical advisories.');
process.exit(failed ? 1 : 0);
