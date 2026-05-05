const sqlite3 = require('sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');

class DatabaseService {
  constructor() {
    this.db = null;
    this.dbPath = path.join(__dirname, '../data', 'users.db');
  }

  async initialize() {
    return new Promise((resolve, reject) => {
      const fs = require('fs');
      const dataDir = path.join(__dirname, '../data');
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }

      this.db = new sqlite3.Database(this.dbPath, (err) => {
        if (err) {
          console.error('[Database] Connection error:', err.message);
          reject(err);
          return;
        }
        console.log('[Database] Connected to SQLite');
        this.createTables()
          .then(() => resolve())
          .catch(reject);
      });
    });
  }

  async createTables() {
    return new Promise((resolve, reject) => {
      const createUsersTable = `
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT UNIQUE NOT NULL,
          password TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `;
      this.db.run(createUsersTable, (err) => {
        if (err) {
          console.error('[Database] Table creation error:', err.message);
          reject(err);
          return;
        }
        console.log('[Database] Users table ready');
        resolve();
      });
    });
  }

  async createUser(username, password) {
    return new Promise(async (resolve, reject) => {
      try {
        const existing = await this.findUserByUsername(username);
        if (existing) {
          reject(new Error('用户名已存在'));
          return;
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const sql = 'INSERT INTO users (username, password) VALUES (?, ?)';
        this.db.run(sql, [username, hashedPassword], function(err) {
          if (err) {
            reject(err);
            return;
          }
          resolve({
            id: this.lastID,
            username,
            created_at: new Date().toISOString()
          });
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  async findUserByUsername(username) {
    return new Promise((resolve, reject) => {
      const sql = 'SELECT * FROM users WHERE username = ?';
      this.db.get(sql, [username], (err, row) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(row || null);
      });
    });
  }

  async findUserById(id) {
    return new Promise((resolve, reject) => {
      const sql = 'SELECT id, username, created_at FROM users WHERE id = ?';
      this.db.get(sql, [id], (err, row) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(row || null);
      });
    });
  }

  async verifyPassword(username, password) {
    const user = await this.findUserByUsername(username);
    if (!user) {
      return null;
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return null;
    }

    return {
      id: user.id,
      username: user.username,
      created_at: user.created_at
    };
  }

  close() {
    return new Promise((resolve, reject) => {
      if (this.db) {
        this.db.close((err) => {
          if (err) {
            reject(err);
            return;
          }
          console.log('[Database] Connection closed');
          resolve();
        });
      } else {
        resolve();
      }
    });
  }
}

module.exports = new DatabaseService();
