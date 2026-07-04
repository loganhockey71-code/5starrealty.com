const path = require('path');

// In production on Render, set DATA_DIR / UPLOADS_DIR to paths under the
// mounted persistent disk (e.g. /var/data/data and /var/data/uploads) so
// listings, page edits, and photos survive deploys and restarts.
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '..', 'data');
const UPLOADS_DIR = process.env.UPLOADS_DIR || path.join(__dirname, '..', 'uploads');

module.exports = { DATA_DIR, UPLOADS_DIR };
