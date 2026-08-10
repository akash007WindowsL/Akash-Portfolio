const fs = require('fs');
const path = require('path');

const base = __dirname;
const html = fs.readFileSync(path.join(base, 'index.html'), 'utf8');
const matches = [...html.matchAll(/src="(images\/[^"]+)"/g)].map(m => m[1]);
const unique = [...new Set(matches)];

let ok = 0, missing = 0;
unique.forEach(p => {
  if (fs.existsSync(path.join(base, p))) { ok++; }
  else { console.log('MISSING:', p); missing++; }
});
console.log(`\n${ok} OK  |  ${missing} missing  |  ${unique.length} total image refs`);
