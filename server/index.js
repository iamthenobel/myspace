const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const sqlite3 = require('sqlite3').verbose();
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');
const multer = require('multer');
const mime = require('mime-types');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();
const JWT_SECRET = process.env.JWT_SECRET

const app = express();
const PORT = process.env.PORT || 5000;
const DB_PATH = './myspace.db';

const UPLOAD_DIR = './uploads';
const TRASH_DIR = './trash';

app.use(cors({
  origin: 'https://myspacely.netlify.app',
  credentials: true
}));
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));
app.use('/uploads', express.static(UPLOAD_DIR));
app.use('/trash', express.static(TRASH_DIR));
app.use('/res', express.static(path.join(__dirname, 'res')));

// Initialize directories
if (!fs.existsSync(DB_PATH)) fs.writeFileSync(DB_PATH, '');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
if (!fs.existsSync(TRASH_DIR)) fs.mkdirSync(TRASH_DIR, { recursive: true });

const db = new sqlite3.Database(DB_PATH);

// Database initialization with full schema
db.serialize(() => {
  db.run('PRAGMA foreign_keys = ON');

  // Users table with additional fields
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    avatar_path TEXT DEFAULT '/res/default_profile.png',
    bio TEXT,
    location TEXT,
    website TEXT,
    theme TEXT DEFAULT 'light',
    space_name TEXT DEFAULT 'MySpace',
    online_status BOOLEAN DEFAULT 0,
    last_login DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Folders table
  db.run(`
    CREATE TABLE IF NOT EXISTS folders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN (
        'note', 'image', 'video', 'audio', 'document', 
        'pdf', 'spreadsheet', 'presentation', 'archive', 'code'
      )),
      description TEXT,
      color VARCHAR(7) DEFAULT '#3b82f6',
      icon VARCHAR(20),
      is_public BOOLEAN DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Files table
  db.run(`
    CREATE TABLE IF NOT EXISTS files (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      folder_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      path TEXT NOT NULL,
      size INTEGER NOT NULL,
      description TEXT,
      lyrics TEXT,
      content TEXT,  -- For note content storage
      metadata TEXT, -- JSON string for additional metadata
      thumbnail_path TEXT,
      duration INTEGER, -- For audio/video files
      artist TEXT,     -- For audio files
      album TEXT,      -- For audio files
      uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME,
      pinned BOOLEAN DEFAULT 0,
      FOREIGN KEY(folder_id) REFERENCES folders(id) ON DELETE CASCADE,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  db.run(`
  CREATE TABLE IF NOT EXISTS trash (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    original_id INTEGER NOT NULL,  -- Original ID from files table
    user_id INTEGER NOT NULL,
    folder_id INTEGER,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    path TEXT NOT NULL,
    original_path TEXT NOT NULL,  -- Original path before moving to trash
    size INTEGER NOT NULL,
    description TEXT,
    lyrics TEXT,
    content TEXT,
    metadata TEXT,
    thumbnail_path TEXT,
    duration INTEGER,
    artist TEXT,
    album TEXT,
    deleted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
  )
`);

db.run(`
  CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    type TEXT NOT NULL,
    message TEXT NOT NULL,
    link TEXT,
    read INTEGER DEFAULT 0,    
    starred INTEGER DEFAULT 0,   
    archived INTEGER DEFAULT 0,  
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);
  `)

  // File metadata table for extensible attributes
  db.run(`
    CREATE TABLE IF NOT EXISTS file_metadata (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      file_id INTEGER NOT NULL,
      key TEXT NOT NULL,
      value TEXT,
      FOREIGN KEY(file_id) REFERENCES files(id) ON DELETE CASCADE,
      UNIQUE(file_id, key)
    )
  `);

  // Sharing system
  db.run(`
    CREATE TABLE IF NOT EXISTS shared_files (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      file_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,  -- Owner who shared the file
      shared_with INTEGER NOT NULL,  -- User ID with whom the file is shared
      permission TEXT NOT NULL CHECK(permission IN ('view', 'edit', 'manage')),
      shared_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      expires_at DATETIME,
      FOREIGN KEY(file_id) REFERENCES files(id) ON DELETE CASCADE,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY(shared_with) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // File previews table
  db.run(`
    CREATE TABLE IF NOT EXISTS file_previews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      file_id INTEGER NOT NULL,
      preview_path TEXT NOT NULL,
      width INTEGER,
      height INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(file_id) REFERENCES files(id) ON DELETE CASCADE
    )
  `);

  // File versions table
  db.run(`
    CREATE TABLE IF NOT EXISTS file_versions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      file_id INTEGER NOT NULL,
      version_number INTEGER NOT NULL,
      path TEXT NOT NULL,
      size INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      created_by INTEGER NOT NULL,
      notes TEXT,
      FOREIGN KEY(file_id) REFERENCES files(id) ON DELETE CASCADE,
      FOREIGN KEY(created_by) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Recent activities table
  db.run(`
    CREATE TABLE IF NOT EXISTS activities (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      type TEXT NOT NULL,
      target_id INTEGER,
      target_type TEXT,
      data TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);
});

// JWT Middleware with better error handling
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'] || req.headers['Authorization'];
  const tokenFromHeader = authHeader?.split(' ')[1];
  const tokenFromQuery = req.query.token;

  const token = tokenFromHeader || tokenFromQuery;

  if (!token) {
    return res.status(401).json({
      error: 'Authentication required',
      details: 'Access token missing from Authorization header or query string',
    });
  }

  jwt.verify(token, JWT_SECRET, (verifyErr, user) => {
    if (verifyErr) {
      return res.status(403).json({
        error: 'Authentication failed',
        details:
          verifyErr.name === 'TokenExpiredError'
            ? 'Token expired'
            : 'Invalid token',
      });
    }

    db.get('SELECT id FROM users WHERE id = ?', [user.id], (dbErr, row) => {
      if (dbErr || !row) {
        return res.status(403).json({
          error: 'Authentication failed',
          details: 'User no longer exists',
        });
      }

      req.user = user;
      return next();
    });
  });
}

// Enhanced file upload configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const userDir = path.join(UPLOAD_DIR, `user_${req.user.id}`);
    if (!fs.existsSync(userDir)) fs.mkdirSync(userDir, { recursive: true });
    cb(null, userDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, uniqueSuffix + ext);
  }
});

const fileFilter = (req, file, cb) => {
  const folderType = req.folder?.type;

  // Validate file type based on folder type
  if (folderType === 'note') {
    const isTextFile = [
      'text/plain', 'text/markdown', 'text/html',
      'text/css', 'application/javascript', 'application/json'
    ].includes(file.mimetype);
    if (!isTextFile) {
      return cb(new Error('Only text files are allowed in note folders'), false);
    }
  } else if (folderType === 'image') {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files are allowed in image folders'), false);
    }
  } else if (folderType === 'audio') {
    if (!file.mimetype.startsWith('audio/')) {
      return cb(new Error('Only audio files are allowed in audio folders'), false);
    }
  } else if (folderType === 'video') {
    if (!file.mimetype.startsWith('video/')) {
      return cb(new Error('Only video files are allowed in video folders'), false);
    }
  } else if (folderType === 'document') {
    const isDocument = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    ].includes(file.mimetype);
    if (!isDocument) {
      return cb(new Error('Only document files are allowed in document folders'), false);
    }
  }

  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 1024 * 1024 * 1024, // 1GB
    files: 200 // Max 20 files at once
  }
});

// Middleware to load folder info before upload
const loadFolder = (req, res, next) => {
  const folderId = req.params.folderId;
  const userId = req.user.id;

  db.get(
    `SELECT * FROM folders WHERE id = ? AND user_id = ?`,
    [folderId, userId],
    (err, folder) => {
      if (err) {
        return res.status(500).json({
          error: 'Database error',
          details: err.message
        });
      }
      if (!folder) {
        return res.status(404).json({
          error: 'Folder not found',
          details: 'The specified folder does not exist or you do not have access'
        });
      }

      req.folder = folder;
      next();
    }
  );
};

// --- Auth Routes ---

app.post('/api/signup', async (req, res) => {
  const { name, email, password } = req.body;

  // Input validation
  if (!name || !email || !password) {
    return res.status(400).json({
      error: 'Validation error',
      details: 'All fields are required'
    });
  }

  if (password.length < 8) {
    return res.status(400).json({
      error: 'Validation error',
      details: 'Password must be at least 8 characters'
    });
  }

  try {
    const hashed = await bcrypt.hash(password, 12);
    db.run(
      `INSERT INTO users (name, email, password) VALUES (?, ?, ?)`,
      [name, email, hashed],
      function (err) {
        if (err) {
          if (err.message.includes('UNIQUE constraint failed')) {
            return res.status(409).json({
              error: 'Registration failed',
              details: 'Email already exists'
            });
          }
          return res.status(500).json({
            error: 'Database error',
            details: err.message
          });
        }

        const user = {
          id: this.lastID,
          name,
          email,
          createdAt: new Date().toISOString()
        };

        const token = jwt.sign(user, JWT_SECRET, { expiresIn: '7d' });

        res.status(201).json({
          user,
          token,
          expiresIn: 7 * 24 * 60 * 60 // 7 days in seconds
        });
      }
    );
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({
      error: 'Server error',
      details: 'Could not complete registration'
    });
  }
});

app.post('/api/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      error: 'Validation error',
      details: 'Email and password are required'
    });
  }

  db.get(
    `SELECT * FROM users WHERE email = ?`,
    [email],
    async (err, user) => {
      if (err) {
        return res.status(500).json({
          error: 'Database error',
          details: err.message
        });
      }
      if (!user) {
        return res.status(401).json({
          error: 'Authentication failed',
          details: 'Invalid credentials'
        });
      }

      try {
        const valid = await bcrypt.compare(password, user.password);
        if (!valid) {
          return res.status(401).json({
            error: 'Authentication failed',
            details: 'Invalid credentials'
          });
        }

        const userData = {
          id: user.id,
          name: user.name,
          email: user.email,
          createdAt: user.created_at
        };

        const token = jwt.sign(userData, JWT_SECRET, { expiresIn: '7d' });

        res.json({
          message: 'Login successful',
          user: userData,
          token,
          expiresIn: 7 * 24 * 60 * 60 // 7 days in seconds
        });
      } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({
          error: 'Server error',
          details: 'Could not complete login'
        });
      }
    }
  );
});

app.get('/api/me', authenticateToken, (req, res) => {
  db.get(
    `SELECT id, name, email, avatar_path, bio, location, website, theme, online_status, created_at, updated_at, last_login
     FROM users WHERE id = ?`,
    [req.user.id],
    (err, row) => {
      if (err) {
        return res.status(500).json({
          error: 'Database error',
          details: err.message
        });
      }
      if (!row) {
        return res.status(404).json({
          error: 'User not found',
          details: 'Your account may have been deleted'
        });
      }

      res.json({
        user: {
          id: row.id,
          name: row.name,
          email: row.email,
          avatar: row.avatar_path,
          bio: row.bio || '',
          location: row.location || '',
          website: row.website || '',
          theme: row.theme || 'light',
          onlineStatus: !!row.online_status,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
          lastLogin: row.last_login
        }
      });
    }
  );
});

app.put('/api/profile', authenticateToken, upload.single('avatar'), (req, res) => {
  const { name, bio, location, website } = req.body;

  let avatarPath = null;
  if (req.file) {
    avatarPath = `/uploads/user_${req.user.id}/${req.file.filename}`;
  }

  // First fetch the current avatar_path if any
  db.get(`SELECT avatar_path FROM users WHERE id = ?`, [req.user.id], (err, row) => {
    if (err) {
      console.error('Failed to fetch current avatar:', err);
      return res.status(500).json({ error: 'Failed to update profile' });
    }

    const oldAvatarPath = row?.avatar_path;

    // Delete old avatar if a new one is uploaded and old exists
    if (req.file && oldAvatarPath && oldAvatarPath !== '/default-avatar.png') {
      const oldAvatarFullPath = path.join(__dirname, oldAvatarPath); // full path to the old file

      fs.unlink(oldAvatarFullPath, (err) => {
        if (err && err.code !== 'ENOENT') {
          console.warn(`Could not delete old avatar: ${oldAvatarFullPath}`, err);
        }
      });
    }

    // Build dynamic SQL update query
    const updates = [];
    const params = [];

    if (name !== undefined) {
      updates.push('name = ?');
      params.push(name);
    }
    if (bio !== undefined) {
      updates.push('bio = ?');
      params.push(bio);
    }
    if (location !== undefined) {
      updates.push('location = ?');
      params.push(location);
    }
    if (website !== undefined) {
      updates.push('website = ?');
      params.push(website);
    }
    if (avatarPath) {
      updates.push('avatar_path = ?');
      params.push(avatarPath);
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    const sql = `UPDATE users SET ${updates.join(', ')} WHERE id = ?`;
    params.push(req.user.id);

    db.run(sql, params, function (err) {
      if (err) {
        console.error('DB update error:', err);
        return res.status(500).json({ error: 'Database update failed' });
      }

      // Fetch updated user
      db.get(`SELECT id, name, email, avatar_path, bio, location, website, theme, online_status, created_at, updated_at FROM users WHERE id = ?`, [req.user.id], (err, user) => {
        if (err || !user) {
          return res.status(500).json({ error: 'Failed to fetch updated user profile' });
        }

        res.json({
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            avatar: user.avatar_path || '/default-avatar.png',
            bio: user.bio || '',
            location: user.location || '',
            website: user.website || '',
            theme: user.theme || 'light',
            onlineStatus: !!user.online_status,
            createdAt: user.created_at,
            updatedAt: user.updated_at
          }
        });
      });
    });
  });
});

app.delete('/api/profile', authenticateToken, (req, res) => {
  const userId = req.user.id;

  // First, get user’s avatar_path to optionally delete the folder
  db.get(`SELECT avatar_path FROM users WHERE id = ?`, [userId], (err, row) => {
    if (err) {
      console.error('Error fetching user for deletion:', err);
      return res.status(500).json({ error: 'Failed to delete user' });
    }

    // Delete user from DB
    db.run(`DELETE FROM users WHERE id = ?`, [userId], function (err) {
      if (err) {
        console.error('DB error on delete:', err);
        return res.status(500).json({ error: 'Failed to delete user' });
      }

      // Remove user's avatar folder
      const userDir = path.join(__dirname, 'uploads', `user_${userId}`);
      fs.rm(userDir, { recursive: true, force: true }, (err) => {
        if (err && err.code !== 'ENOENT') {
          console.warn('Failed to delete user folder:', err);
        }
        // Silent if folder doesn’t exist or error isn't critical
      });

      return res.json({ message: 'Account deleted successfully' });
    });
  });
});
// --- Enhanced Folder Routes ---

app.post('/api/folders', authenticateToken, (req, res) => {
  const { name, type } = req.body;
  const userId = req.user.id;

  // Input validation
  if (!name || !type) {
    return res.status(400).json({
      error: 'Validation error',
      details: 'Folder name and type are required'
    });
  }

  const allowedTypes = ['note', 'image', 'video', 'document', 'audio', 'pdf', 'other'];
  if (!allowedTypes.includes(type)) {
    return res.status(400).json({
      error: 'Validation error',
      details: `Invalid folder type. Allowed types: ${allowedTypes.join(', ')}`
    });
  }

  db.run(
    `INSERT INTO folders (user_id, name, type) VALUES (?, ?, ?)`,
    [userId, name, type],
    function (err) {
      if (err) {
        return res.status(500).json({
          error: 'Database error',
          details: err.message
        });
      }

      res.status(201).json({
        id: this.lastID,
        name,
        type,
        user_id: userId,
        created_at: new Date().toISOString()
      });
    }
  );
});

app.get('/api/folders', authenticateToken, (req, res) => {
  db.all(
    `SELECT id, name, type, created_at FROM folders WHERE user_id = ? ORDER BY name ASC`,
    [req.user.id],
    (err, rows) => {
      if (err) {
        return res.status(500).json({
          error: 'Database error',
          details: err.message
        });
      }

      res.json(rows.map(row => ({
        ...row,
        created_at: row.created_at
      })));
    }
  );
});

app.get('/api/folders/:id', authenticateToken, (req, res) => {
  const id = req.params.id;

  db.get(
    `SELECT id, name, type, created_at FROM folders WHERE id = ? AND user_id = ?`,
    [id, req.user.id],
    (err, folder) => {
      if (err) {
        return res.status(500).json({
          error: 'Database error',
          details: err.message
        });
      }
      if (!folder) {
        return res.status(404).json({
          error: 'Not found',
          details: 'Folder not found or access denied'
        });
      }

      res.json({
        ...folder,
        created_at: folder.created_at
      });
    }
  );
});

app.put('/api/folders/:id', authenticateToken, (req, res) => {
  const id = req.params.id;
  const { name } = req.body;

  if (!name) {
    return res.status(400).json({
      error: 'Validation error',
      details: 'Folder name is required'
    });
  }

  db.run(
    `UPDATE folders SET name = ? WHERE id = ? AND user_id = ?`,
    [name, id, req.user.id],
    function (err) {
      if (err) {
        return res.status(500).json({
          error: 'Database error',
          details: err.message
        });
      }
      if (this.changes === 0) {
        return res.status(404).json({
          error: 'Not found',
          details: 'Folder not found or access denied'
        });
      }

      res.json({
        message: 'Folder updated successfully',
        id,
        name
      });
    }
  );
});
app.get('/api/files/:folderId', authenticateToken, (req, res) => {
  const { sortBy, sortOrder } = req.query;
  const folderId = req.params.folderId;
  const userId = req.user.id;

  // Validate sort parameters
  const validSortFields = ['name', 'uploaded_at', 'size'];
  const sortField = validSortFields.includes(sortBy) ? sortBy : 'name';
  const sortDir = sortOrder === 'desc' ? 'DESC' : 'ASC';

  // Verify folder belongs to user
  db.get(
    `SELECT id FROM folders WHERE id = ? AND user_id = ?`,
    [folderId, userId],
    (err, folder) => {
      if (err) {
        return res.status(500).json({
          error: 'Database error',
          details: err.message
        });
      }
      if (!folder) {
        return res.status(404).json({
          error: 'Not found',
          details: 'Folder not found or access denied'
        });
      }

      db.all(
        `SELECT 
          id,
          folder_id,
          user_id,
          name,
          type,
          path,
          size,
          uploaded_at,
          pinned
        FROM files 
        WHERE folder_id = ? 
        ORDER BY pinned DESC, ${sortField} ${sortDir}`,
        [folderId],
        (err, rows) => {
          if (err) {
            return res.status(500).json({
              error: 'Database error',
              details: err.message
            });
          }

          res.json(rows.map(file => ({
            ...file,
            pinned: Boolean(file.pinned),
            uploaded_at: file.uploaded_at
          })));
        }
      );
    }
  );
});

app.delete('/api/files/:id', authenticateToken, (req, res) => {
  const fileId = req.params.id;
  const userId = req.user.id;

  db.get(
    `SELECT * FROM files WHERE id = ? AND user_id = ?`,
    [fileId, userId],
    (err, file) => {
      if (err) {
        return res.status(500).json({
          error: 'Database error',
          details: err.message
        });
      }
      if (!file) {
        return res.status(404).json({
          error: 'Not found',
          details: 'File not found or access denied'
        });
      }

      // Generate new path in trash
      const fileExt = path.extname(file.path);
      const trashFileName = `${uuidv4()}${fileExt}`;
      const trashPath = path.join(TRASH_DIR, trashFileName);

      // Move file to trash
      fs.rename(file.path, trashPath, (err) => {
        if (err) {
          return res.status(500).json({
            error: 'File move failed',
            details: err.message
          });
        }

        // Insert into trash table
        db.run(
          `INSERT INTO trash (
            original_id, user_id, folder_id, name, type, path, original_path, size,
            description, lyrics, content, metadata, thumbnail_path, duration, artist, album
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            file.id, userId, file.folder_id, file.name, file.type, trashPath, file.path, file.size,
            file.description, file.lyrics, file.content, file.metadata, file.thumbnail_path,
            file.duration, file.artist, file.album
          ],
          function (err) {
            if (err) {
              // Try to move file back if DB insert fails
              fs.rename(trashPath, file.path, () => { });
              return res.status(500).json({
                error: 'Database error',
                details: err.message
              });
            }

            // Delete from files table
            db.run(
              `DELETE FROM files WHERE id = ? AND user_id = ?`,
              [fileId, userId],
              function (err) {
                if (err) {
                  // Try to move file back if DB delete fails
                  fs.rename(trashPath, file.path, () => { });
                  return res.status(500).json({
                    error: 'Database error',
                    details: err.message
                  });
                }

                res.json({
                  message: 'File moved to trash successfully',
                  id: fileId
                });
              }
            );
          }
        );
      });
    }
  );
});

// Get all trash items for a user
app.get('/api/trash', authenticateToken, (req, res) => {
  const userId = req.user.id;

  db.all(
    `SELECT * FROM trash WHERE user_id = ? ORDER BY deleted_at DESC`,
    [userId],
    (err, items) => {
      if (err) {
        return res.status(500).json({
          error: 'Database error',
          details: err.message
        });
      }
      res.json(items);
    }
  );
});

// Restore a file from trash
app.post('/api/trash/restore/:id', authenticateToken, (req, res) => {
  const trashId = req.params.id;
  const userId = req.user.id;

  db.get(
    `SELECT * FROM trash WHERE id = ? AND user_id = ?`,
    [trashId, userId],
    (err, item) => {
      if (err) {
        return res.status(500).json({
          error: 'Database error',
          details: err.message
        });
      }
      if (!item) {
        return res.status(404).json({
          error: 'Not found',
          details: 'Item not found in trash or access denied'
        });
      }

      // Move file back to original location
      fs.rename(item.path, item.original_path, (err) => {
        if (err) {
          return res.status(500).json({
            error: 'File restore failed',
            details: err.message
          });
        }

        // Insert back into files table
        db.run(
          `INSERT INTO files (
            id, folder_id, user_id, name, type, path, size,
            description, lyrics, content, metadata, thumbnail_path, duration, artist, album
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            item.original_id, item.folder_id, userId, item.name, item.type, item.original_path, item.size,
            item.description, item.lyrics, item.content, item.metadata, item.thumbnail_path,
            item.duration, item.artist, item.album
          ],
          function (err) {
            if (err) {
              // Try to move file back to trash if DB insert fails
              fs.rename(item.original_path, item.path, () => { });
              return res.status(500).json({
                error: 'Database error',
                details: err.message
              });
            }

            // Delete from trash table
            db.run(
              `DELETE FROM trash WHERE id = ?`,
              [trashId],
              function (err) {
                if (err) {
                  return res.status(500).json({
                    error: 'Database error',
                    details: err.message
                  });
                }

                res.json({
                  message: 'File restored successfully',
                  id: item.original_id
                });
              }
            );
          }
        );
      });
    }
  );
});

// Permanently delete from trash
app.delete('/api/trash/:id', authenticateToken, (req, res) => {
  const trashId = req.params.id;
  const userId = req.user.id;

  db.get(
    `SELECT path FROM trash WHERE id = ? AND user_id = ?`,
    [trashId, userId],
    (err, item) => {
      if (err) {
        return res.status(500).json({
          error: 'Database error',
          details: err.message
        });
      }
      if (!item) {
        return res.status(404).json({
          error: 'Not found',
          details: 'Item not found in trash or access denied'
        });
      }

      // Delete the physical file
      fs.unlink(item.path, (err) => {
        if (err && err.code !== 'ENOENT') {
          return res.status(500).json({
            error: 'File deletion failed',
            details: err.message
          });
        }

        // Delete from trash table
        db.run(
          `DELETE FROM trash WHERE id = ? AND user_id = ?`,
          [trashId, userId],
          function (err) {
            if (err) {
              return res.status(500).json({
                error: 'Database error',
                details: err.message
              });
            }

            res.json({
              message: 'Item permanently deleted from trash',
              id: trashId
            });
          }
        );
      });
    }
  );
});

// Empty trash (delete all items for a user)
app.delete('/api/trash', authenticateToken, (req, res) => {
  const userId = req.user.id;

  // First get all trash items to delete their files
  db.all(
    `SELECT path FROM trash WHERE user_id = ?`,
    [userId],
    (err, items) => {
      if (err) {
        return res.status(500).json({
          error: 'Database error',
          details: err.message
        });
      }

      // Delete all files
      let deleteErrors = [];
      items.forEach(item => {
        try {
          fs.unlinkSync(item.path);
        } catch (err) {
          if (err.code !== 'ENOENT') {
            deleteErrors.push(err.message);
          }
        }
      });

      // Then delete all from trash table
      db.run(
        `DELETE FROM trash WHERE user_id = ?`,
        [userId],
        function (err) {
          if (err) {
            return res.status(500).json({
              error: 'Database error',
              details: err.message
            });
          }

          if (deleteErrors.length > 0) {
            return res.status(207).json({  // 207 Multi-Status
              message: 'Trash emptied with some errors',
              errors: deleteErrors,
              deletedCount: this.changes
            });
          }

          res.json({
            message: 'Trash emptied successfully',
            deletedCount: this.changes
          });
        }
      );
    }
  );
});

app.put('/api/files/:id/pin', authenticateToken, (req, res) => {
  const fileId = req.params.id;
  const userId = req.user.id;

  db.get(
    `SELECT pinned FROM files WHERE id = ? AND user_id = ?`,
    [fileId, userId],
    (err, file) => {
      if (err) {
        return res.status(500).json({
          error: 'Database error',
          details: err.message
        });
      }
      if (!file) {
        return res.status(404).json({
          error: 'Not found',
          details: 'File not found or access denied'
        });
      }

      const newPinStatus = file.pinned ? 0 : 1;

      db.run(
        `UPDATE files SET pinned = ? WHERE id = ?`,
        [newPinStatus, fileId],
        function (err) {
          if (err) {
            return res.status(500).json({
              error: 'Database error',
              details: err.message
            });
          }

          res.json({
            message: newPinStatus ? 'File pinned' : 'File unpinned',
            pinned: Boolean(newPinStatus)
          });
        }
      );
    }
  );
});

// --- File Viewing/Downloading ---

app.get('/api/files/:id/view', authenticateToken, (req, res) => {
  const fileId = req.params.id;
  const userId = req.user?.id;
  const range = req.headers.range;

  if (!fileId || !userId) {
    return res.status(400).json({
      error: 'Missing parameters',
      details: 'File ID or User ID is missing'
    });
  }

  db.get(
    `SELECT path, type FROM files WHERE id = ? AND user_id = ?`,
    [fileId, userId],
    (err, file) => {
      if (err) {
        return res.status(500).json({
          error: 'Database error',
          details: err.message
        });
      }

      if (!file) {
        return res.status(404).json({
          error: 'Not found',
          details: 'File not found or access denied'
        });
      }

      fs.access(file.path, fs.constants.F_OK, (err) => {
        if (err) {
          return res.status(404).json({
            error: 'Not found',
            details: 'File not found on server'
          });
        }

        const contentType = mime.lookup(file.path) || file.type || 'application/octet-stream';
        const stat = fs.statSync(file.path);
        const fileSize = stat.size;

        // For non-video files or when range header is not present
        if (!contentType.startsWith('video/') || !range) {
          res.setHeader('Content-Type', contentType);
          res.setHeader('Content-Length', fileSize);
          return fs.createReadStream(file.path).pipe(res);
        }

        // Handle video streaming with byte ranges
        const parts = range.replace(/bytes=/, '').split('-');
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
        const chunkSize = (end - start) + 1;

        res.writeHead(206, {
          'Content-Range': `bytes ${start}-${end}/${fileSize}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': chunkSize,
          'Content-Type': contentType
        });

        const fileStream = fs.createReadStream(file.path, { start, end });
        fileStream.pipe(res);
      });
    }
  );
});

// ==================== NEW API ENDPOINTS ====================

// Get file metadata
app.get('/api/files/:id/metadata', authenticateToken, (req, res) => {
  const fileId = req.params.id;
  const userId = req.user.id;

  db.get(
    `SELECT metadata FROM files WHERE id = ? AND user_id = ?`,
    [fileId, userId],
    (err, file) => {
      if (err) {
        return res.status(500).json({
          error: 'Database error',
          details: err.message
        });
      }
      if (!file) {
        return res.status(404).json({
          error: 'Not found',
          details: 'File not found or access denied'
        });
      }

      try {
        const metadata = file.metadata ? JSON.parse(file.metadata) : {};
        res.json(metadata);
      } catch (err) {
        res.status(500).json({
          error: 'Invalid metadata',
          details: 'Could not parse file metadata'
        });
      }
    }
  );
});

// Update file metadata
app.put('/api/files/:id/metadata', authenticateToken, (req, res) => {
  const fileId = req.params.id;
  const userId = req.user.id;
  const { metadata } = req.body;

  if (!metadata) {
    return res.status(400).json({
      error: 'Validation error',
      details: 'Metadata is required'
    });
  }

  db.run(
    `UPDATE files SET metadata = ? WHERE id = ? AND user_id = ?`,
    [JSON.stringify(metadata), fileId, userId],
    function (err) {
      if (err) {
        return res.status(500).json({
          error: 'Database error',
          details: err.message
        });
      }
      if (this.changes === 0) {
        return res.status(404).json({
          error: 'Not found',
          details: 'File not found or access denied'
        });
      }

      res.json({
        message: 'Metadata updated successfully',
        metadata
      });
    }
  );
});

// Update lyrics for audio file
app.put('/api/files/:id/lyrics', authenticateToken, (req, res) => {
  const fileId = req.params.id;
  const userId = req.user.id;
  const { lyrics } = req.body;

  // First verify it's an audio file
  db.get(
    `SELECT type FROM files WHERE id = ? AND user_id = ?`,
    [fileId, userId],
    (err, file) => {
      if (err) {
        return res.status(500).json({
          error: 'Database error',
          details: err.message
        });
      }
      if (!file) {
        return res.status(404).json({
          error: 'Not found',
          details: 'File not found or access denied'
        });
      }
      if (!file.type.startsWith('audio/')) {
        return res.status(400).json({
          error: 'Validation error',
          details: 'Lyrics can only be added to audio files'
        });
      }

      db.run(
        `UPDATE files SET lyrics = ? WHERE id = ?`,
        [lyrics, fileId],
        function (err) {
          if (err) {
            return res.status(500).json({
              error: 'Database error',
              details: err.message
            });
          }

          res.json({
            message: 'Lyrics updated successfully',
            lyrics
          });
        }
      );
    }
  );
});
app.get('/api/files/:id/lyrics', authenticateToken, (req, res) => {
  const fileId = req.params.id;
  const userId = req.user.id;

  db.get(
    `SELECT lyrics FROM files WHERE id = ? AND user_id = ?`,
    [fileId, userId],
    (err, row) => {
      if (err) {
        return res.status(500).json({
          error: 'Database error',
          details: err.message
        });
      }

      if (!row) {
        return res.status(404).json({
          error: 'Not found',
          details: 'File not found or access denied'
        });
      }

      if (!row.lyrics) {
        return res.status(404).json({
          error: 'No lyrics',
          details: 'No lyrics found for this file'
        });
      }

      res.type('text/plain').send(row.lyrics);
    }
  );
});

// Create file version
app.post('/api/files/:id/versions', authenticateToken, upload.single('file'), (req, res) => {
  const fileId = req.params.id;
  const userId = req.user.id;
  const { notes } = req.body;

  if (!req.file) {
    return res.status(400).json({
      error: 'Validation error',
      details: 'File is required'
    });
  }

  // Get current version count
  db.get(
    `SELECT COUNT(*) as count FROM file_versions WHERE file_id = ?`,
    [fileId],
    (err, result) => {
      if (err) {
        return res.status(500).json({
          error: 'Database error',
          details: err.message
        });
      }

      const versionNumber = result.count + 1;

      db.run(
        `INSERT INTO file_versions (
          file_id, version_number, path, size, created_by, notes
        ) VALUES (?, ?, ?, ?, ?, ?)`,
        [fileId, versionNumber, req.file.path, req.file.size, userId, notes],
        function (err) {
          if (err) {
            // Clean up uploaded file if DB insert fails
            fs.unlink(req.file.path, () => { });
            return res.status(500).json({
              error: 'Database error',
              details: err.message
            });
          }

          res.status(201).json({
            id: this.lastID,
            file_id: fileId,
            version_number: versionNumber,
            path: req.file.path,
            size: req.file.size,
            created_at: new Date().toISOString(),
            created_by: userId,
            notes
          });
        }
      );
    }
  );
});

// Get file versions
app.get('/api/files/:id/versions', authenticateToken, (req, res) => {
  const fileId = req.params.id;
  const userId = req.user.id;

  // Verify user has access to the file
  db.get(
    `SELECT id FROM files WHERE id = ? AND user_id = ?`,
    [fileId, userId],
    (err, file) => {
      if (err) {
        return res.status(500).json({
          error: 'Database error',
          details: err.message
        });
      }
      if (!file) {
        return res.status(404).json({
          error: 'Not found',
          details: 'File not found or access denied'
        });
      }

      db.all(
        `SELECT 
          v.id, 
          v.version_number, 
          v.path, 
          v.size, 
          v.created_at, 
          v.notes,
          u.name as created_by_name
        FROM file_versions v
        JOIN users u ON v.created_by = u.id
        WHERE v.file_id = ?
        ORDER BY v.version_number DESC`,
        [fileId],
        (err, versions) => {
          if (err) {
            return res.status(500).json({
              error: 'Database error',
              details: err.message
            });
          }

          res.json(versions);
        }
      );
    }
  );
});

// Restore file version
app.post('/api/files/:id/versions/:versionId/restore', authenticateToken, (req, res) => {
  const fileId = req.params.id;
  const versionId = req.params.versionId;
  const userId = req.user.id;

  // Verify user has access to the file
  db.get(
    `SELECT id, path FROM files WHERE id = ? AND user_id = ?`,
    [fileId, userId],
    (err, file) => {
      if (err) {
        return res.status(500).json({
          error: 'Database error',
          details: err.message
        });
      }
      if (!file) {
        return res.status(404).json({
          error: 'Not found',
          details: 'File not found or access denied'
        });
      }

      // Get the version to restore
      db.get(
        `SELECT path FROM file_versions WHERE id = ? AND file_id = ?`,
        [versionId, fileId],
        (err, version) => {
          if (err) {
            return res.status(500).json({
              error: 'Database error',
              details: err.message
            });
          }
          if (!version) {
            return res.status(404).json({
              error: 'Not found',
              details: 'Version not found'
            });
          }

          // Create a backup of current file
          const backupPath = file.path + '.bak';
          fs.copyFile(file.path, backupPath, (err) => {
            if (err) {
              return res.status(500).json({
                error: 'File operation failed',
                details: 'Could not create backup of current file'
              });
            }

            // Restore the version
            fs.copyFile(version.path, file.path, async (err) => {
              if (err) {
                // Restore backup if version restore fails
                fs.copyFile(backupPath, file.path, () => { });
                return res.status(500).json({
                  error: 'File operation failed',
                  details: 'Could not restore version'
                });
              }

              // Update file stats in database
              const stats = fs.statSync(file.path);

              db.run(
                `UPDATE files 
                SET size = ?, updated_at = CURRENT_TIMESTAMP 
                WHERE id = ?`,
                [stats.size, fileId],
                function (err) {
                  if (err) {
                    // Restore backup if DB update fails
                    fs.copyFile(backupPath, file.path, () => { });
                    return res.status(500).json({
                      error: 'Database error',
                      details: err.message
                    });
                  }

                  // Clean up backup
                  fs.unlink(backupPath, () => { });

                  res.json({
                    message: 'Version restored successfully',
                    file_id: fileId,
                    version_id: versionId
                  });
                }
              );
            });
          });
        }
      );
    }
  );
});

// Get recent activities
app.get('/api/activities', authenticateToken, (req, res) => {
  const userId = req.user.id;
  const limit = parseInt(req.query.limit) || 10;

  db.all(
    `SELECT 
      a.id,
      a.type,
      a.target_id,
      a.target_type,
      a.data,
      a.created_at,
      f.name as file_name,
      f.type as file_type,
      fl.name as folder_name
    FROM activities a
    LEFT JOIN files f ON a.target_id = f.id AND a.target_type = 'file'
    LEFT JOIN folders fl ON a.target_id = fl.id AND a.target_type = 'folder'
    WHERE a.user_id = ?
    ORDER BY a.created_at DESC
    LIMIT ?`,
    [userId, limit],
    (err, activities) => {
      if (err) {
        return res.status(500).json({
          error: 'Database error',
          details: err.message
        });
      }

      res.json(activities.map(act => ({
        ...act,
        data: act.data ? JSON.parse(act.data) : null
      })));
    }
  );
});

// Log activity helper function
function logActivity(userId, type, targetId, targetType, data = null) {
  db.run(
    `INSERT INTO activities (
      user_id, type, target_id, target_type, data
    ) VALUES (?, ?, ?, ?, ?)`,
    [userId, type, targetId, targetType, JSON.stringify(data)],
    (err) => {
      if (err) console.error('Failed to log activity:', err);
    }
  );
}

// Fetches notifications for the authenticated user

app.get('/api/notifications', authenticateToken, (req, res) => {
  const userId = req.user.id;
  const limit = parseInt(req.query.limit) || 10; // Default limit for notifications

  db.all(
    `SELECT
       id,
       type,
       message,
       link,
       read,
       starred,
       archived,
       created_at
     FROM notifications
     WHERE user_id = ?
     ORDER BY created_at DESC
     LIMIT ?`,
    [userId, limit],
    (err, notifications) => {
      if (err) {
        return res.status(500).json({ error: 'Database error', details: err.message });
      }
      res.json(notifications);
    }
  );
});

// PUT /api/notifications/:id/:property - Update a notification property (read, starred, archived)
app.put('/api/notifications/:id/:property', authenticateToken, (req, res) => {
  const { id, property } = req.params;
  const userId = req.user.id;
  const value = req.body[property] ? 1 : 0; // Convert boolean to 0 or 1

  // Validate property to prevent arbitrary updates
  const validProperties = ['read', 'starred', 'archived'];
  if (!validProperties.includes(property)) {
    return res.status(400).json({ error: 'Invalid property for update.' });
  }

  db.run(
    `UPDATE notifications SET ${property} = ? WHERE id = ? AND user_id = ?`,
    [value, id, userId],
    function (err) {
      if (err) {
        return res.status(500).json({ error: 'Database error', details: err.message });
      }
      if (this.changes === 0) {
        return res.status(404).json({ message: 'Notification not found or not authorized.' });
      }
      res.json({ message: 'Notification updated successfully.', id, property, value: !!value }); // Return boolean
    }
  );
});

// PUT /api/notifications/markAllRead - Mark all notifications as read for the user
app.put('/api/notifications/markAllRead', authenticateToken, (req, res) => {
  const userId = req.user.id;

  db.run(
    `UPDATE notifications SET read = 1 WHERE user_id = ? AND read = 0`,
    [userId],
    function (err) {
      if (err) {
        return res.status(500).json({ error: 'Database error', details: err.message });
      }
      res.json({ message: `Marked ${this.changes} notifications as read.` });
    }
  );
});

// DELETE /api/notifications/:id - Delete a specific notification
app.delete('/api/notifications/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  db.run(
    `DELETE FROM notifications WHERE id = ? AND user_id = ?`,
    [id, userId],
    function (err) {
      if (err) {
        return res.status(500).json({ error: 'Database error', details: err.message });
      }
      if (this.changes === 0) {
        return res.status(404).json({ message: 'Notification not found or not authorized.' });
      }
      res.json({ message: 'Notification dismissed successfully.' });
    }
  );
});

// DELETE /api/notifications/clearAll - Clear all notifications for the user
app.delete('/api/notifications/clearAll', authenticateToken, (req, res) => {
  const userId = req.user.id;

  db.run(
    `DELETE FROM notifications WHERE user_id = ?`,
    [userId],
    function (err) {
      if (err) {
        return res.status(500).json({ error: 'Database error', details: err.message });
      }
      res.json({ message: `Cleared ${this.changes} notifications.` });
    }
  );
});

// --- Continue with your existing /api/activities endpoint ---

// DELETE /api/activities/clearAll - Clear all activities for the user
app.delete('/api/activities/clearAll', authenticateToken, (req, res) => {
  const userId = req.user.id; // Assuming user_id is in the JWT payload

  db.run(
    `DELETE FROM activities WHERE user_id = ?`,
    [userId],
    function (err) {
      if (err) {
        return res.status(500).json({ error: 'Database error', details: err.message });
      }
      res.json({ message: `Cleared ${this.changes} activities.` });
    }
  );
});


// Log notification helper function (similar to logActivity, but for notifications)
function logNotification(userId, type, message, link = null) {
  db.run(
    `INSERT INTO notifications (user_id, type, message, link) VALUES (?, ?, ?, ?)`,
    [userId, type, message, link],
    (err) => {
      if (err) console.error('Failed to log notification:', err);
    }
  );
}

app.get('/api/notifications/unreadCount', authenticateToken, (req, res) => {
  const userId = req.user.id;

  db.get(
    `SELECT COUNT(*) AS count FROM notifications WHERE user_id = ? AND read = 0`,
    [userId],
    (err, row) => {
      if (err) {
        return res.status(500).json({ error: 'Database error', details: err.message });
      }
      res.json({ count: row.count });
    }
  );
});

app.get('/api/trash/count', authenticateToken, (req, res) => {
  const userId = req.user.id;

  db.get(
    `SELECT COUNT(*) AS count FROM trash WHERE user_id = ?`,
    [userId],
    (err, row) => {
      if (err) {
        return res.status(500).json({ error: 'Database error', details: err.message });
      }
      res.json({ count: row.count });
    }
  );
});

// ==================== EXISTING API ENDPOINTS (UPDATED) ====================

// Update file upload endpoint to handle different file types

app.post('/api/folders/:folderId/upload',
  authenticateToken,
  loadFolder,
  upload.array('files'),
  async (req, res) => {
    const userId = req.user.id;
    const folderId = req.params.folderId;
    const files = req.files;

    if (!files || files.length === 0) {
      return res.status(400).json({
        error: 'Validation error',
        details: 'No files were uploaded'
      });
    }

    try {
      // Start transaction
      await new Promise((resolve, reject) => {
        db.run('BEGIN TRANSACTION', (err) => err ? reject(err) : resolve());
      });

      const insertPromises = files.map(file => {
        return new Promise((resolve, reject) => {
          const fileType = mime.lookup(file.originalname) || 'application/octet-stream';
          let metadata = {};

          // Extract metadata for specific file types
          if (fileType.startsWith('audio/')) {
            metadata = { duration: 0 }; // Will be updated later
          } else if (fileType.startsWith('image/')) {
            metadata = { width: 0, height: 0 }; // Will be updated later
          }

          db.run(
            `INSERT INTO files (
              folder_id, 
              user_id, 
              name, 
              type, 
              path, 
              size,
              metadata
            ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
              folderId,
              userId,
              file.originalname,
              fileType,
              file.path,
              file.size,
              JSON.stringify(metadata)
            ],
            function (err) {
              if (err) reject(err);
              else {
                const fileId = this.lastID;
                logActivity(userId, 'upload', fileId, 'file', {
                  name: file.originalname,
                  type: fileType,
                  size: file.size
                });
                resolve(fileId);
              }
            }
          );
        });
      });

      const fileIds = await Promise.all(insertPromises);

      // Commit transaction
      await new Promise((resolve, reject) => {
        db.run('COMMIT', (err) => err ? reject(err) : resolve());
      });

      // Get the newly uploaded files
      db.all(
        `SELECT * FROM files WHERE id IN (${fileIds.join(',')})`,
        async (err, uploadedFiles) => {
          if (err) {
            console.error('Error fetching uploaded files:', err);
            return res.status(201).json({
              message: 'Files uploaded but could not retrieve details',
              count: fileIds.length
            });
          }

          res.status(201).json(uploadedFiles.map(file => ({
            ...file,
            pinned: Boolean(file.pinned),
            metadata: file.metadata ? JSON.parse(file.metadata) : {}
          })));
        }
      );
    } catch (err) {
      // Rollback on error
      await new Promise((resolve) => {
        db.run('ROLLBACK', () => resolve());
      });

      console.error('Upload error:', err);

      // Clean up uploaded files
      files.forEach(file => {
        fs.unlink(file.path, () => { });
      });

      res.status(500).json({
        error: 'Upload failed',
        details: err.message
      });
    }
  }
);

// Enhanced note creation endpoint
app.post('/api/files/note', authenticateToken, (req, res) => {
  const { folderId, name, content, description } = req.body;
  const userId = req.user.id;

  if (!folderId || !name || content === undefined) {
    return res.status(400).json({
      error: 'Validation error',
      details: 'Folder ID, name and content are required'
    });
  }

  // Verify folder exists and is a note folder
  db.get(
    `SELECT type FROM folders WHERE id = ? AND user_id = ?`,
    [folderId, userId],
    (err, folder) => {
      if (err) {
        return res.status(500).json({
          error: 'Database error',
          details: err.message
        });
      }
      if (!folder) {
        return res.status(404).json({
          error: 'Not found',
          details: 'Folder not found or access denied'
        });
      }
      if (folder.type !== 'note') {
        return res.status(400).json({
          error: 'Validation error',
          details: 'Can only create notes in note-type folders'
        });
      }

      const filePath = path.join(UPLOAD_DIR, `user_${userId}`, `note_${Date.now()}.txt`);
      const fileDir = path.dirname(filePath);

      if (!fs.existsSync(fileDir)) {
        fs.mkdirSync(fileDir, { recursive: true });
      }

      fs.writeFile(filePath, content, 'utf8', (err) => {
        if (err) {
          return res.status(500).json({
            error: 'File creation failed',
            details: err.message
          });
        }

        const stats = fs.statSync(filePath);

        db.run(
          `INSERT INTO files (
            folder_id, 
            user_id, 
            name, 
            type, 
            path,
            size,
            content,
            description
          ) VALUES (?, ?, ?, 'text/plain', ?, ?, ?, ?)`,
          [folderId, userId, name, filePath, stats.size, content, description],
          function (err) {
            if (err) {
              // Clean up the file if DB insert fails
              fs.unlink(filePath, () => { });
              return res.status(500).json({
                error: 'Database error',
                details: err.message
              });
            }

            const fileId = this.lastID;
            logActivity(userId, 'create_note', fileId, 'file', {
              name,
              folder_id: folderId
            });

            res.status(201).json({
              id: fileId,
              folder_id: folderId,
              user_id: userId,
              name,
              type: 'text/plain',
              path: filePath,
              size: stats.size,
              content,
              description,
              uploaded_at: new Date().toISOString(),
              pinned: false
            });
          }
        );
      });
    }
  );
});

// Update note content
app.put('/api/files/:id/note', authenticateToken, (req, res) => {
  const fileId = req.params.id;
  const userId = req.user.id;
  const { content } = req.body;

  if (content === undefined) {
    return res.status(400).json({
      error: 'Validation error',
      details: 'Content is required'
    });
  }

  // Verify it's a note file
  db.get(
    `SELECT path FROM files WHERE id = ? AND user_id = ? AND type = 'text/plain'`,
    [fileId, userId],
    (err, file) => {
      if (err) {
        return res.status(500).json({
          error: 'Database error',
          details: err.message
        });
      }
      if (!file) {
        return res.status(404).json({
          error: 'Not found',
          details: 'Note not found or access denied'
        });
      }

      fs.writeFile(file.path, content, 'utf8', (err) => {
        if (err) {
          return res.status(500).json({
            error: 'File update failed',
            details: err.message
          });
        }

        const stats = fs.statSync(file.path);

        db.run(
          `UPDATE files 
          SET content = ?, size = ?, updated_at = CURRENT_TIMESTAMP 
          WHERE id = ?`,
          [content, stats.size, fileId],
          function (err) {
            if (err) {
              return res.status(500).json({
                error: 'Database error',
                details: err.message
              });
            }

            logActivity(userId, 'update_note', fileId, 'file');

            res.json({
              message: 'Note updated successfully',
              id: fileId
            });
          }
        );
      });
    }
  );
});

// Enhanced file deletion with version cleanup
app.delete('/api/files/:id', authenticateToken, (req, res) => {
  const fileId = req.params.id;
  const userId = req.user.id;

  db.get(
    `SELECT path FROM files WHERE id = ? AND user_id = ?`,
    [fileId, userId],
    (err, file) => {
      if (err) {
        return res.status(500).json({
          error: 'Database error',
          details: err.message
        });
      }
      if (!file) {
        return res.status(404).json({
          error: 'Not found',
          details: 'File not found or access denied'
        });
      }

      // First delete all versions
      db.run(
        `DELETE FROM file_versions WHERE file_id = ?`,
        [fileId],
        function (err) {
          if (err) {
            return res.status(500).json({
              error: 'Database error',
              details: err.message
            });
          }

          // Then delete the file record
          db.run(
            `DELETE FROM files WHERE id = ? AND user_id = ?`,
            [fileId, userId],
            function (err) {
              if (err) {
                return res.status(500).json({
                  error: 'Database error',
                  details: err.message
                });
              }
              if (this.changes === 0) {
                return res.status(404).json({
                  error: 'Not found',
                  details: 'File not found or access denied'
                });
              }

              // Then delete the physical file
              fs.unlink(file.path, (err) => {
                if (err && err.code !== 'ENOENT') { // Ignore "file not found" errors
                  console.error('File deletion error:', err);
                  return res.status(500).json({
                    error: 'File deletion failed',
                    details: 'Database record deleted but file could not be removed'
                  });
                }

                logActivity(userId, 'delete', fileId, 'file', {
                  path: file.path
                });

                res.json({
                  message: 'File deleted successfully',
                  id: fileId
                });
              });
            }
          );
        }
      );
    }
  );
});

// Get total storage used by user
app.get('/api/storage/usage', authenticateToken, (req, res) => {
  const userId = req.user.id;

  db.get(
    `SELECT SUM(size) as totalSize FROM files WHERE user_id = ?`,
    [userId],
    (err, row) => {
      if (err) {
        return res.status(500).json({
          error: 'Database error',
          details: err.message
        });
      }

      return res.json({
        storage_used: row?.totalSize || 0, // in bytes
        max_storage: 2 * 1024 * 1024 * 1024 // 2GB in bytes
      });
    }
  );
});

// Get storage limits
app.get('/api/storage/limits', authenticateToken, (req, res) => {
  res.json({
    max_storage: 2 * 1024 * 1024 * 1024 // 2GB in bytes
  });
});

// Get space name for the current user
app.get('/api/space/name', authenticateToken, (req, res) => {
  const userId = req.user.id;

  db.get(
    `SELECT space_name FROM users WHERE id = ?`,
    [userId],
    (err, row) => {
      if (err) {
        return res.status(500).json({
          error: 'Database error',
          details: err.message
        });
      }

      if (!row) {
        return res.status(404).json({
          error: 'Not found',
          details: 'User not found'
        });
      }

      return res.json({
        space_name: row.space_name || 'MySpace' // Default if null
      });
    }
  );
});

// Update space name for the current user
app.put('/api/space/name', authenticateToken, (req, res) => {
  const userId = req.user.id;
  const { space_name } = req.body;

  // Basic validation
  if (typeof space_name !== 'string' || space_name.trim().length === 0) {
    return res.status(400).json({
      error: 'Validation error',
      details: 'Space name is required and must be a non-empty string.'
    });
  }

  const trimmedName = space_name.trim();

  db.run(
    `UPDATE users SET space_name = ? WHERE id = ?`,
    [trimmedName, userId],
    function (err) {
      if (err) {
        return res.status(500).json({
          error: 'Database error',
          details: err.message
        });
      }

      if (this.changes === 0) {
        return res.status(404).json({
          error: 'Not found',
          details: 'User not found or access denied.'
        });
      }

      return res.json({
        message: 'Space name updated successfully',
        space_name: trimmedName,
      });
    }
  );
  console.log("Updating space for userId:", userId, "to:", trimmedName);

});

// --- Error Handling Middleware ---
/*app.use((err, req, res, next) => {
  console.error('Server error:', err);

  if (err instanceof multer.MulterError) {
    return res.status(400).json({
      error: 'Upload error',
      details: err.code === 'LIMIT_FILE_SIZE' ?
        'File too large (max 100MB)' :
        'File upload failed'
    });
  }

  res.status(500).json({
    error: 'Internal server error',
    details: process.env.NODE_ENV === 'development' ?
      err.message :
      'Something went wrong'
  });
});
*/
// --- Start Server ---
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
  console.log(`📁 Database path: ${path.resolve(DB_PATH)}`);
  console.log(`💾 Upload directory: ${path.resolve(UPLOAD_DIR)}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  db.close();
  console.log('Database connection closed');
  process.exit(0);
});

process.on('SIGINT', () => {
  db.close();
  console.log('Database connection closed');
  process.exit(0);
});