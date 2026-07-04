const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

const ROOT = path.join(__dirname, '..');
const PAGES = ['index', 'team', 'services', 'contact', 'privacy'];

function humanizeKey(key) {
  return key
    .split('_')
    .map((w) => (w.length ? w[0].toUpperCase() + w.slice(1) : w))
    .join(' ');
}

function extractPage(pageId) {
  const html = fs.readFileSync(path.join(ROOT, `${pageId}.html`), 'utf-8');
  const $ = cheerio.load(html, { decodeEntities: false });

  const values = {};
  const schema = [];
  const seen = new Set();

  $('[data-editable]').each((_, el) => {
    const key = $(el).attr('data-editable').split('.').slice(1).join('.');
    const value = $(el).html().trim();
    values[key] = value;
    if (!seen.has(key)) {
      seen.add(key);
      schema.push({ key, label: humanizeKey(key), type: 'text' });
    }
  });

  $('[data-editable-img]').each((_, el) => {
    const key = $(el).attr('data-editable-img').split('.').slice(1).join('.');
    const value = $(el).attr('src');
    values[key] = value;
    if (!seen.has(key)) {
      seen.add(key);
      schema.push({ key, label: humanizeKey(key), type: 'image' });
    }
  });

  $('[data-editable-bg]').each((_, el) => {
    const key = $(el).attr('data-editable-bg').split('.').slice(1).join('.');
    const style = $(el).attr('style') || '';
    const match = style.match(/url\((['"]?)(.*?)\1\)/);
    const value = match ? match[2] : '';
    values[key] = value;
    if (!seen.has(key)) {
      seen.add(key);
      schema.push({ key, label: humanizeKey(key), type: 'image' });
    }
  });

  return { values, schema };
}

const content = {};
const contentSchema = {};

for (const pageId of PAGES) {
  const { values, schema } = extractPage(pageId);
  content[pageId] = values;
  contentSchema[pageId] = schema;
}

fs.writeFileSync(
  path.join(ROOT, 'data', 'content.json'),
  JSON.stringify(content, null, 2)
);
fs.writeFileSync(
  path.join(ROOT, 'config', 'content-schema.json'),
  JSON.stringify(contentSchema, null, 2)
);

console.log('Extracted content for pages:', PAGES.join(', '));
for (const pageId of PAGES) {
  console.log(`  ${pageId}: ${contentSchema[pageId].length} fields`);
}
