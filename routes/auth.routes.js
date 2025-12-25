const express = require('express');
const router = express.Router();
const db = require('../db/mysql');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
require('dotenv').config();

// Setup function that can be called from app -- creates tables and seeds users
async function setupDb() {
  // wait until DB module is ready
  if (db.ready) await db.ready;

  if (!db.isSqlite) {
    // MySQL: create database if missing then create tables
    const createDb = `CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME || 'jwt_auth'}\`;`;
    const poolNoDb = await require('mysql2/promise').createPool({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || ''
    });
    await poolNoDb.query(createDb);
    await poolNoDb.end();

    await db.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role ENUM('admin','user') DEFAULT 'user'
      ) ENGINE=InnoDB;
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS tokens (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        token VARCHAR(500) NOT NULL,
        login_time DATETIME,
        login_address VARCHAR(255),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB;
    `);
  } else {
    // SQLite-compatible tables
    await db.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT DEFAULT 'user'
      );
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS tokens (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        token TEXT NOT NULL,
        login_time TEXT,
        login_address TEXT,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );
    `);
  }

  // Seed admin and user if not exist
  const [adminRows] = await db.execute('SELECT id FROM users WHERE username = ?', ['admin']);
  if (adminRows.length === 0) {
    const hashed = await bcrypt.hash('123', 10);
    await db.execute('INSERT INTO users (username, password, role) VALUES (?, ?, ?)', ['admin', hashed, 'admin']);
  }
  const [userRows] = await db.execute('SELECT id FROM users WHERE username = ?', ['user']);
  if (userRows.length === 0) {
    const hashed = await bcrypt.hash('123', 10);
    await db.execute('INSERT INTO users (username, password, role) VALUES (?, ?, ?)', ['user', hashed, 'user']);
  }
}

// Expose setupDb for app.js to call
router.setupDb = setupDb;

// Login endpoint
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ message: 'username & password required' });
  try {
    const [rows] = await db.execute('SELECT * FROM users WHERE username = ?', [username]);
    if (rows.length === 0) return res.status(401).json({ message: 'Invalid credentials' });
    const user = rows[0];
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ message: 'Invalid credentials' });

    const payload = {
      id: user.id,
      username: user.username,
      role: user.role,
      loginTime: new Date().toISOString(),
      loginAddress: req.ip
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET || 'secret', { expiresIn: '1h' });

    // store token
    const loginTimeForDb = new Date().toISOString().slice(0,19).replace('T',' ');
    await db.execute('INSERT INTO tokens (user_id, token, login_time, login_address) VALUES (?, ?, ?, ?)', [user.id, token, loginTimeForDb, payload.loginAddress]);

    res.json({ token, role: user.role, loginTime: payload.loginTime, loginAddress: payload.loginAddress });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Simple protected route to check token
const { authenticateToken } = require('../auth/jwt.middleware');
router.get('/profile', authenticateToken, (req, res) => {
  res.json({ profile: req.user });
});

module.exports = router;
