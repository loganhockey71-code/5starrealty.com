const express = require('express');
const multer = require('multer');

const { createListingsDb } = require('../db/listings');
const requireAuth = require('../middleware/requireAuth');
const { UPLOADS_DIR } = require('../lib/paths');
const {
  LISTINGS_FILE,
  LISTINGS_DRAFT_FILE,
  historyForListing,
  restoreListingFromHistory,
} = require('../db/publish');

const router = express.Router();

const UPLOAD_DIR = UPLOADS_DIR;

// Public reads come from the published listings file; admin CRUD operates
// on the draft file and only reaches the public file via Publish.
const publishedDb = createListingsDb(LISTINGS_FILE);
const draftDb = createListingsDb(LISTINGS_DRAFT_FILE);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
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

// ---- Public routes ----

router.get('/listings', (req, res) => {
  let listings = publishedDb.readAll();
  if (req.query.status) {
    listings = listings.filter(
      (l) => String(l.status || '').toLowerCase() === String(req.query.status).toLowerCase()
    );
  }
  res.json(listings);
});

router.get('/listings/:id', (req, res) => {
  const listing = publishedDb.getById(req.params.id);
  if (!listing) return res.status(404).json({ error: 'Listing not found' });
  res.json(listing);
});

// ---- Admin routes ----

// Draft listings, so the admin table reflects unpublished creates/edits/deletes
router.get('/admin/listings', requireAuth, (req, res) => {
  res.json(draftDb.readAll());
});

router.post('/admin/listings', requireAuth, upload.array('photos', 12), (req, res) => {
  const photos = (req.files || []).map((f) => `/uploads/${f.filename}`);
  const listing = draftDb.create({ ...req.body, photos });
  res.status(201).json(listing);
});

router.put('/admin/listings/:id', requireAuth, upload.array('photos', 12), (req, res) => {
  const existing = draftDb.getById(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Listing not found' });

  let removePhotos = req.body.removePhotos || [];
  if (!Array.isArray(removePhotos)) removePhotos = [removePhotos];

  const remainingPhotos = existing.photos.filter((p) => !removePhotos.includes(p));
  const newPhotos = (req.files || []).map((f) => `/uploads/${f.filename}`);

  // Photo files are never deleted from disk here: the currently-published
  // listing (or a history snapshot) may still reference them until Publish.
  const updated = draftDb.update(req.params.id, {
    ...req.body,
    photos: [...remainingPhotos, ...newPhotos],
  });

  res.json(updated);
});

router.delete('/admin/listings/:id', requireAuth, (req, res) => {
  const removed = draftDb.remove(req.params.id);
  if (!removed) return res.status(404).json({ error: 'Listing not found' });
  res.json({ success: true });
});

// Past published versions of one listing (survives even after it's deleted
// from the draft, since history holds a full copy of the listings array)
router.get('/admin/history/listings/:id', requireAuth, (req, res) => {
  res.json(historyForListing(req.params.id));
});

// Restore a past version of a listing into the draft (still needs Publish)
router.post('/admin/history/listings/:id/restore', requireAuth, (req, res) => {
  const { timestamp } = req.body || {};
  const restored = restoreListingFromHistory(req.params.id, timestamp);
  if (!restored) return res.status(404).json({ error: 'Snapshot not found' });
  res.json({ success: true, listing: restored });
});

module.exports = router;
