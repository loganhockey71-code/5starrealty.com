require('dotenv').config();

const fs = require('fs');
const path = require('path');
const express = require('express');
const session = require('express-session');

const { DATA_DIR, UPLOADS_DIR } = require('./lib/paths');

const authRoutes = require('./routes/auth');
const listingsRoutes = require('./routes/listings');
const contentRoutes = require('./routes/content');

// Seed DATA_DIR from the repo's bundled defaults on first boot against a
// fresh (empty) persistent disk, without ever overwriting existing data.
function seedDataDir() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.mkdirSync(path.join(UPLOADS_DIR, 'content'), { recursive: true });

  const seedDir = path.join(__dirname, 'data');
  for (const file of ['content.json', 'listings.json']) {
    const target = path.join(DATA_DIR, file);
    const source = path.join(seedDir, file);
    if (!fs.existsSync(target) && fs.existsSync(source)) {
      fs.copyFileSync(source, target);
    }
  }
}
seedDataDir();

const app = express();
const PORT = process.env.PORT || 8000;

// Render terminates HTTPS at its edge and forwards to this app over plain
// HTTP, so Express must trust the proxy's X-Forwarded-Proto header to know
// the original request was secure — otherwise express-session silently
// refuses to set cookies flagged `secure: true` in production.
app.set('trust proxy', 1);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  session({
    secret: process.env.SESSION_SECRET || 'dev-secret-change-me',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 1000 * 60 * 60 * 8,
    },
  })
);

app.use('/uploads', express.static(UPLOADS_DIR));

app.use('/api', authRoutes);
app.use('/api', listingsRoutes);
app.use('/api', contentRoutes);

// API errors (bad uploads, malformed JSON, unexpected failures) respond as
// JSON so the admin/listings fetch handlers can show their friendly message
// instead of receiving an HTML stack trace.
app.use('/api', (err, req, res, next) => {
  if (res.headersSent) return next(err);
  const status = err.status || (err.code === 'LIMIT_FILE_SIZE' ? 413 : 500);
  const message =
    err.code === 'LIMIT_FILE_SIZE'
      ? 'Each photo must be 5MB or smaller'
      : err.message || 'Something went wrong';
  console.error('API error:', err);
  res.status(status).json({ error: message });
});

app.get(/^\/admin(\.html)?$/, (req, res) => {
  res.setHeader('X-Robots-Tag', 'noindex, nofollow');
  res.sendFile(path.join(__dirname, 'admin.html'));
});

app.use(express.static(path.join(__dirname, '.'), { extensions: ['html'] }));

app.listen(PORT, () => {
  console.log(`5 Star Realty server running on http://localhost:${PORT}`);
  // Temporary boot-time diagnostic for admin login setup — reports only
  // lengths/shape, never actual secret values. Remove once login is confirmed working.
  const u = process.env.ADMIN_USERNAME || '';
  const h = process.env.ADMIN_PASSWORD_HASH || '';
  console.log(
    `[auth-check] ADMIN_USERNAME set=${Boolean(u)} length=${u.length} trimmedMatches=${u === u.trim()}`
  );
  console.log(
    `[auth-check] ADMIN_PASSWORD_HASH set=${Boolean(h)} length=${h.length} looksLikeBcrypt=${/^\$2[aby]\$\d{2}\$.{53}$/.test(h)}`
  );
});
