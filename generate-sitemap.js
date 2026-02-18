/**
 * Auto-generate sitemap.xml from published game folders.
 * Scans top-level directories for index.html (skips archive/, shared/, about/, node_modules/).
 * Run: node generate-sitemap.js
 */
const fs = require('fs');
const path = require('path');

const DOMAIN = 'https://brainsmacks.com';
const ROOT = __dirname;
const SKIP = new Set(['archive', 'shared', 'node_modules', '.git']);

// Always include these
const entries = [
  { loc: '/', priority: '1.0', freq: 'weekly' },
];

// Scan top-level dirs for game folders (must have index.html)
const dirs = fs.readdirSync(ROOT, { withFileTypes: true })
  .filter(d => d.isDirectory() && !SKIP.has(d.name) && !d.name.startsWith('.'))
  .map(d => d.name)
  .sort();

for (const dir of dirs) {
  if (fs.existsSync(path.join(ROOT, dir, 'index.html'))) {
    const isWeekly = dir === 'fivefold'; // weekly rotating content
    entries.push({
      loc: `/${dir}/`,
      priority: dir === 'about' ? '0.5' : '0.8',
      freq: isWeekly ? 'weekly' : 'monthly',
    });
  }
}

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.map(e => `  <url><loc>${DOMAIN}${e.loc}</loc><priority>${e.priority}</priority><changefreq>${e.freq}</changefreq></url>`).join('\n')}
</urlset>
`;

fs.writeFileSync(path.join(ROOT, 'sitemap.xml'), xml);
console.log(`✅ sitemap.xml generated with ${entries.length} URLs:`);
entries.forEach(e => console.log(`   ${DOMAIN}${e.loc}`));
