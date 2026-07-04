const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const requireAuth = require('../middleware/requireAuth');
const { DATA_DIR, UPLOADS_DIR } = require('../lib/paths');

const router = express.Router();

const CONTENT_FILE = path.join(DATA_DIR, 'content.json');
const SCHEMA_FILE = path.join(__dirname, '..', 'config', 'content-schema.json');
const CONTENT_UPLOAD_DIR = path.join(UPLOADS_DIR, 'content');

if (!fs.existsSync(CONTENT_UPLOAD_DIR)) fs.mkdirSync(CONTENT_UPLOAD_DIR, { recursive: true });

function readContent() {
  return JSON.parse(fs.readFileSync(CONTENT_FILE, 'utf-8'));
}
function writeContent(data) {
  fs.writeFileSync(CONTENT_FILE, JSON.stringify(data, null, 2));
}
function readSchema() {
  return JSON.parse(fs.readFileSync(SCHEMA_FILE, 'utf-8'));
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, CONTENT_UPLOAD_DIR),
  filename: (req, file, cb) => {
    const safeName = file.originalname.replace(/[^a-zA-Z0-9.\-]/g, '_');
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safeName}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files are allowed'));
    }
    cb(null, true);
  },
});

// Public: full content map, used by every page's hydration script
router.get('/content', (req, res) => {
  res.json(readContent());
});

// Admin: field schema (labels/types) used to render the "Edit Pages" form
router.get('/admin/content-schema', requireAuth, (req, res) => {
  res.json(readSchema());
});

// Admin: save text + image field updates for one page
router.put('/admin/content/:page', requireAuth, upload.any(), (req, res) => {
  const { page } = req.params;
  const schema = readSchema();
  if (!schema[page]) return res.status(404).json({ error: 'Unknown page' });

  const content = readContent();
  const pageContent = content[page] || {};
  const fieldTypes = new Map(schema[page].map((f) => [f.key, f.type]));

  for (const [key, value] of Object.entries(req.body || {})) {
    if (fieldTypes.get(key) === 'text') {
      pageContent[key] = value;
    }
  }

  for (const file of req.files || []) {
    const key = file.fieldname;
    if (fieldTypes.get(key) === 'image') {
      pageContent[key] = `/uploads/content/${file.filename}`;
    }
  }

  content[page] = pageContent;
  writeContent(content);
  res.json({ success: true, content: pageContent });
});

module.exports = router;
