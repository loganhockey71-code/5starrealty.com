const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');

const db = require('../db/listings');
const requireAuth = require('../middleware/requireAuth');
const { UPLOADS_DIR } = require('../lib/paths');

const router = express.Router();

const UPLOAD_DIR = UPLOADS_DIR;

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

function photoUrlToFilename(url) {
  return url.startsWith('/uploads/') ? url.slice('/uploads/'.length) : url;
}

function deletePhotoFiles(urls) {
  for (const url of urls) {
    const filePath = path.join(UPLOAD_DIR, photoUrlToFilename(url));
    fs.unlink(filePath, () => {});
  }
}

// ---- Public routes ----

router.get('/listings', (req, res) => {
  let listings = db.readAll();
  if (req.query.status) {
    listings = listings.filter(
      (l) => String(l.status || '').toLowerCase() === String(req.query.status).toLowerCase()
    );
  }
  res.json(listings);
});

router.get('/listings/:id', (req, res) => {
  const listing = db.getById(req.params.id);
  if (!listing) return res.status(404).json({ error: 'Listing not found' });
  res.json(listing);
});

// ---- Admin routes ----

router.post('/admin/listings', requireAuth, upload.array('photos', 12), (req, res) => {
  const photos = (req.files || []).map((f) => `/uploads/${f.filename}`);
  const listing = db.create({ ...req.body, photos });
  res.status(201).json(listing);
});

router.put('/admin/listings/:id', requireAuth, upload.array('photos', 12), (req, res) => {
  const existing = db.getById(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Listing not found' });

  let removePhotos = req.body.removePhotos || [];
  if (!Array.isArray(removePhotos)) removePhotos = [removePhotos];

  const remainingPhotos = existing.photos.filter((p) => !removePhotos.includes(p));
  const newPhotos = (req.files || []).map((f) => `/uploads/${f.filename}`);

  const updated = db.update(req.params.id, {
    ...req.body,
    photos: [...remainingPhotos, ...newPhotos],
  });

  if (removePhotos.length) deletePhotoFiles(removePhotos);

  res.json(updated);
});

router.delete('/admin/listings/:id', requireAuth, (req, res) => {
  const removed = db.remove(req.params.id);
  if (!removed) return res.status(404).json({ error: 'Listing not found' });
  deletePhotoFiles(removed.photos || []);
  res.json({ success: true });
});

module.exports = router;
