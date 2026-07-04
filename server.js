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

app.get(/^\/admin(\.html)?$/, (req, res) => {
  res.setHeader('X-Robots-Tag', 'noindex, nofollow');
  res.sendFile(path.join(__dirname, 'admin.html'));
});

app.use(express.static(path.join(__dirname, '.'), { extensions: ['html'] }));

app.listen(PORT, () => {
  console.log(`5 Star Realty server running on http://localhost:${PORT}`);
});
