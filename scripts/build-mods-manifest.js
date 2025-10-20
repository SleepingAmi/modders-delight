// scripts/build-mods-manifest.js
const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

const POSTS_DIR = path.join(process.cwd(), 'mods');
const OUT_DIR = POSTS_DIR; // output published location
const OUT_FILE = path.join(OUT_DIR, 'index.json');

// Helper function to sanitize title's
function hyphensToSpacesNormalized(s) {
  return String(s).replace(/-+/g, ' ').trim();
}

// Helper: format date as YYYY-MM-DD (ISO format)
function formatISODate(d = new Date()) {
  const date = new Date(d);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function readExistingManifest() {
  if (!fs.existsSync(OUT_FILE)) return {};
  try {
    const data = JSON.parse(fs.readFileSync(OUT_FILE, 'utf8'));
    const map = {};
    for (const item of data) {
      map[item.id] = item;
    }
    return map;
  } catch (err) {
    console.warn(`⚠️ Could not read existing manifest: ${err.message}`);
    return {};
  }
}

function readPosts(existingMap = {}) {
  if (!fs.existsSync(POSTS_DIR)) return [];

  const files = fs.readdirSync(POSTS_DIR)
    .filter(f => /\.(md|markdown|html)$/i.test(f));

  const posts = files.map(filename => {
    const full = path.join(POSTS_DIR, filename);

    let raw;
    try {
      raw = fs.readFileSync(full, 'utf8');
    } catch (err) {
      console.error(`❌ Failed to read ${filename}: ${err.message}`);
      return null;
    }

    let meta = {};
    let excerpt = '';

    if (/^\s*---/.test(raw)) {
      try {
        const parsed = matter(raw);
        meta = parsed.data || {};
        excerpt = (parsed.content || '').split('\n').find(l => l.trim()) || '';
      } catch (err) {
        console.error(`⚠️ Failed to parse frontmatter in ${filename}: ${err.message}`);
      }
    } else {
      excerpt = raw.split('\n').find(l => l.trim()) || '';
    }

    const slug = filename.replace(/\.(md|markdown|html)$/i, '');
    const url = `/mods/${slug}`;
    const id = meta.id || slug;

    const existing = existingMap[id];
    const date = existing ? existing.date : formatISODate(meta.date || new Date());

    return {
      id,
      title: hyphensToSpacesNormalized(meta.title || slug),
      date,
      tags: Array.isArray(meta.tags) ? meta.tags : (meta.tags ? [meta.tags] : []),
      url
    };
  }).filter(Boolean);

  posts.sort((a, b) => a.id.localeCompare(b.id));
  return posts;
}

function ensureOutDir() {
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });
}

function writeManifest(posts) {
  ensureOutDir();
  try {
    fs.writeFileSync(OUT_FILE, JSON.stringify(posts, null, 2), 'utf8');
    console.log(`✅ Wrote ${OUT_FILE} (${posts.length} items)`);
  } catch (err) {
    console.error(`❌ Failed to write manifest: ${err.message}`);
    process.exit(1);
  }
}

function main() {
  try {
    const existingMap = readExistingManifest();
    const posts = readPosts(existingMap);
    writeManifest(posts);
  } catch (err) {
    console.error(`❌ Unexpected error: ${err.message}`);
    process.exit(1);
  }
}

main();
