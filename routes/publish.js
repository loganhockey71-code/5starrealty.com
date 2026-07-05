const express = require('express');
const requireAuth = require('../middleware/requireAuth');
const { getStatus, publish } = require('../db/publish');

const router = express.Router();

router.get('/admin/publish/status', requireAuth, (req, res) => {
  res.json(getStatus());
});

router.post('/admin/publish', requireAuth, (req, res) => {
  publish();
  res.json({ success: true });
});

module.exports = router;
