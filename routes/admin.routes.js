const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../auth/jwt.middleware');
const { authorizeAdmin } = require('../auth/admin.middleware');

router.get('/admin', authenticateToken, authorizeAdmin, (req, res) => {
  res.json({ message: 'Welcome, Admin!', user: req.user });
});

module.exports = router;
