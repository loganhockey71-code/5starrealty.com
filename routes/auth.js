const express = require('express');
const bcrypt = require('bcryptjs');

const router = express.Router();

router.post('/login', async (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  const validUsername = username === process.env.ADMIN_USERNAME;
  const validPassword =
    validUsername &&
    process.env.ADMIN_PASSWORD_HASH &&
    (await bcrypt.compare(password, process.env.ADMIN_PASSWORD_HASH));

  if (!validPassword) {
    return res.status(401).json({ error: 'Invalid username or password' });
  }

  req.session.isAdmin = true;
  res.json({ success: true });
});

router.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.clearCookie('connect.sid');
    res.json({ success: true });
  });
});

router.get('/session', (req, res) => {
  res.json({ authenticated: Boolean(req.session && req.session.isAdmin) });
});

module.exports = router;
