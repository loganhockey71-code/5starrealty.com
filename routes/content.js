const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const requireAuth = require('../middleware/requireAuth');
const { UPLOADS_DIR } = require('../lib/paths');
const {
  CONTENT_FILE,
  CONTENT_DRAFT_FILE,
  readJson,
  writeJson,
  historyForPage,
  restoreContentFromHistory,
} = require('../db/publish');

const router = express.Router();

const SCHEMA_FILE = path.join(__dirname, '..', 'config', 'content-schema.json');
const CONTENT_UPLOAD_DIR = path.join(UPLOADS_DIR, 'content');

if (!fs.existsSync(CONTENT_UPLOAD_DIR)) fs.mkdirSync(CONTENT_UPLOAD_DIR, { recursive: true });

function readPublishedContent() {
  return readJson(CONTENT_FILE, {});
}
function readDraftContent() {
  return readJson(CONTENT_DRAFT_FILE, {});
}
function writeDraftContent(data) {
  writeJson(CONTENT_DRAFT_FILE, data);
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

// Public: full published content map, used by every page's hydration script
router.get('/content', (req, res) => {
  res.json(readPublishedContent());
});

// Admin: field schema (labels/types) used to render the "Edit Pages" form
router.get('/admin/content-schema', requireAuth, (req, res) => {
  res.json(readSchema());
});

// Admin: draft content map, so the page editor reflects unpublished edits
router.get('/admin/content', requireAuth, (req, res) => {
  res.json(readDraftContent());
});

// Admin: save text + image field updates for one page to the draft
router.put('/admin/content/:page', requireAuth, upload.any(), (req, res) => {
  const { page } = req.params;
  const schema = readSchema();
  if (!schema[page]) return res.status(404).json({ error: 'Unknown page' });

  const content = readDraftContent();
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
  writeDraftContent(content);
  res.json({ success: true, content: pageContent });
});

// Admin: past published versions of one page's content
router.get('/admin/history/content/:page', requireAuth, (req, res) => {
  res.json(historyForPage(req.params.page));
});

// Admin: restore a past version of a page into the draft (still needs Publish)
router.post('/admin/history/content/:page/restore', requireAuth, (req, res) => {
  const { timestamp } = req.body || {};
  const restored = restoreContentFromHistory(req.params.page, timestamp);
  if (restored === null) return res.status(404).json({ error: 'Snapshot not found' });
  res.json({ success: true, content: restored });
});

module.exports = router;
