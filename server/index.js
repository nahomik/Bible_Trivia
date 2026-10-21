import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';
import Database from 'better-sqlite3';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || 'bible-trivia-secret-key-change-in-production';

// ─── SQLite Setup ───────────────────────────────────────────────────────────
const DB_PATH = path.join(__dirname, 'bible_trivia.db');
const db = new Database(DB_PATH);

// Enable WAL mode for better concurrent read performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    avatar TEXT DEFAULT '📖',
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS stats (
    user_id INTEGER PRIMARY KEY,
    games_played INTEGER DEFAULT 0,
    total_score INTEGER DEFAULT 0,
    total_correct INTEGER DEFAULT 0,
    total_questions INTEGER DEFAULT 0,
    best_score INTEGER DEFAULT 0,
    best_accuracy REAL DEFAULT 0,
    streak INTEGER DEFAULT 0,
    best_streak INTEGER DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS game_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    mode TEXT,
    score INTEGER DEFAULT 0,
    total_questions INTEGER DEFAULT 0,
    correct_answers INTEGER DEFAULT 0,
    accuracy REAL DEFAULT 0,
    time_taken REAL DEFAULT 0,
    difficulty TEXT DEFAULT '',
    filters TEXT DEFAULT '{}',
    played_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );
`);

// ─── Migrate existing data from db.json (one-time) ─────────────────────────
const JSON_DB_FILE = path.join(__dirname, 'db.json');
const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;

if (userCount === 0 && fs.existsSync(JSON_DB_FILE)) {
  console.log('Migrating data from db.json to SQLite...');
  try {
    const jsonData = JSON.parse(fs.readFileSync(JSON_DB_FILE, 'utf-8'));

    const insertUser = db.prepare(
      'INSERT OR IGNORE INTO users (id, username, email, password, avatar, created_at) VALUES (?, ?, ?, ?, ?, ?)'
    );
    const insertStats = db.prepare(
      'INSERT OR IGNORE INTO stats (user_id, games_played, total_score, total_correct, total_questions, best_score, best_accuracy, streak, best_streak) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
    );
    const insertHistory = db.prepare(
      'INSERT OR IGNORE INTO game_history (user_id, mode, score, total_questions, correct_answers, accuracy, time_taken, difficulty, filters, played_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    );

    const migrate = db.transaction(() => {
      for (const user of jsonData.users || []) {
        insertUser.run(user.id, user.username, user.email, user.password, user.avatar || '📖', user.created_at);
      }
      for (const stat of jsonData.stats || []) {
        insertStats.run(
          stat.user_id, stat.games_played, stat.total_score, stat.total_correct,
          stat.total_questions, stat.best_score, stat.best_accuracy, stat.streak, stat.best_streak
        );
      }
      for (const game of jsonData.gameHistory || []) {
        insertHistory.run(
          game.user_id, game.mode, game.score, game.total_questions,
          game.correct_answers, game.accuracy, game.time_taken,
          game.difficulty || '', game.filters || '{}', game.played_at
        );
      }
    });

    migrate();
    console.log('Migration complete!');
  } catch (err) {
    console.error('Migration failed:', err);
  }
}

// ─── Prepared Statements ────────────────────────────────────────────────────
const stmts = {
  findUserByUsernameOrEmail: db.prepare('SELECT * FROM users WHERE LOWER(username) = LOWER(?) OR LOWER(email) = LOWER(?)'),
  findUserById: db.prepare('SELECT id, username, email, avatar FROM users WHERE id = ?'),
  insertUser: db.prepare('INSERT INTO users (id, username, email, password, avatar, created_at) VALUES (?, ?, ?, ?, ?, ?)'),
  insertStats: db.prepare('INSERT INTO stats (user_id) VALUES (?)'),
  getStats: db.prepare('SELECT * FROM stats WHERE user_id = ?'),
  updateStats: db.prepare(`
    UPDATE stats SET
      games_played = games_played + 1,
      total_score = total_score + ?,
      total_correct = total_correct + ?,
      total_questions = total_questions + ?,
      best_score = MAX(best_score, ?),
      best_accuracy = MAX(best_accuracy, ?),
      streak = ?,
      best_streak = MAX(best_streak, ?)
    WHERE user_id = ?
  `),
  insertGameHistory: db.prepare(
    'INSERT INTO game_history (user_id, mode, score, total_questions, correct_answers, accuracy, time_taken, difficulty, filters, played_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
  ),
  getGameHistory: db.prepare(
    'SELECT * FROM game_history WHERE user_id = ? ORDER BY played_at DESC LIMIT 50'
  ),
  updateUserAvatar: db.prepare('UPDATE users SET avatar = ? WHERE id = ?'),
};


// ─── Auth Helpers ───────────────────────────────────────────────────────────
function generateToken(userId) {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '30d' });
}

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.sendStatus(401);
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch {
    return res.sendStatus(403);
  }
}

// ─── Auth Routes ────────────────────────────────────────────────────────────
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const existing = stmts.findUserByUsernameOrEmail.get(username, email);
    if (existing) {
      return res.status(400).json({ error: 'Username or email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = Date.now();
    const createdAt = new Date().toISOString();

    const registerTransaction = db.transaction(() => {
      stmts.insertUser.run(userId, username, email, hashedPassword, '📖', createdAt);
      stmts.insertStats.run(userId);
    });
    registerTransaction();

    const token = generateToken(userId);
    res.json({ token, user: { id: userId, username, email, avatar: '📖' } });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { login, password } = req.body;
    const user = stmts.findUserByUsernameOrEmail.get(login, login);
    if (!user) {
      return res.status(400).json({ error: 'User not found' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(400).json({ error: 'Invalid password' });
    }

    const token = generateToken(user.id);
    res.json({ token, user: { id: user.id, username: user.username, email: user.email, avatar: user.avatar } });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/auth/me', authenticateToken, (req, res) => {
  const user = stmts.findUserById.get(req.userId);
  if (!user) return res.sendStatus(404);
  res.json({ id: user.id, username: user.username, email: user.email, avatar: user.avatar });
});

// ─── Game Routes ────────────────────────────────────────────────────────────
app.post('/api/game/save', authenticateToken, (req, res) => {
  try {
    const { mode, score, totalQuestions, correctAnswers, accuracy, timeTaken, difficulty, filters } = req.body;

    const currentStats = stmts.getStats.get(req.userId);
    const isPerfect = Number(totalQuestions) > 0 && Number(correctAnswers) === Number(totalQuestions);
    const newStreak = isPerfect ? (currentStats ? currentStats.streak + 1 : 1) : 0;
    const bestStreak = Math.max(currentStats ? currentStats.best_streak : 0, newStreak);


    const saveTransaction = db.transaction(() => {
      stmts.insertGameHistory.run(
        req.userId, mode, score, totalQuestions, correctAnswers,
        accuracy, timeTaken, difficulty || '', JSON.stringify(filters || {}),
        new Date().toISOString()
      );
      stmts.updateStats.run(
        score, correctAnswers, totalQuestions,
        score, accuracy, newStreak, bestStreak,
        req.userId
      );
    });
    saveTransaction();

    res.json({ success: true });
  } catch (error) {
    console.error('Save game error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/game/history', authenticateToken, (req, res) => {
  const history = stmts.getGameHistory.all(req.userId);
  res.json(history);
});

app.get('/api/game/stats', authenticateToken, (req, res) => {
  const stats = stmts.getStats.get(req.userId);
  res.json(stats || {
    games_played: 0, total_score: 0, total_correct: 0,
    total_questions: 0, best_score: 0, best_accuracy: 0,
    streak: 0, best_streak: 0
  });
});

app.put('/api/auth/avatar', authenticateToken, (req, res) => {
  try {
    const { avatar } = req.body;
    if (!avatar) return res.status(400).json({ error: 'Avatar is required' });
    stmts.updateUserAvatar.run(avatar, req.userId);
    res.json({ success: true, avatar });
  } catch (error) {
    console.error('Update avatar error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/leaderboard', (req, res) => {
  try {
    const sortBy = req.query.sortBy || 'total_score';
    const allowedSorts = {
      total_score: 's.total_score DESC',
      best_score: 's.best_score DESC',
      best_streak: 's.best_streak DESC',
      best_accuracy: 's.best_accuracy DESC',
      games_played: 's.games_played DESC'
    };
    const orderClause = allowedSorts[sortBy] || 's.total_score DESC';
    const rows = db.prepare(`
      SELECT u.id, u.username, u.avatar,
             s.games_played, s.total_score, s.total_correct, s.total_questions,
             s.best_score, s.best_accuracy, s.best_streak, s.streak
      FROM users u
      JOIN stats s ON u.id = s.user_id
      WHERE s.games_played > 0
      ORDER BY ${orderClause}
      LIMIT 50
    `).all();
    res.json(rows);
  } catch (error) {
    console.error('Leaderboard error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});


// ─── Socket.IO (Multiplayer) ────────────────────────────────────────────────
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: "*", methods: ["GET", "POST"] }
});

const rooms = new Map();

function generateRoomCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('create-room', (data, callback) => {
    const roomCode = generateRoomCode();
    const room = {
      code: roomCode, host: socket.id,
      players: [{ id: socket.id, name: data.playerName, score: 0 }],
      gameState: 'lobby', questions: [], currentQuestion: 0, answers: {},
      settings: data.settings || { questionCount: 10, filters: {} }
    };
    rooms.set(roomCode, room);
    socket.join(roomCode);
    callback({ success: true, roomCode, room });
  });

  socket.on('join-room', (data, callback) => {
    const { roomCode, playerName } = data;
    const room = rooms.get(roomCode);
    if (!room) return callback({ success: false, error: 'Room not found' });
    if (room.players.length >= 8) return callback({ success: false, error: 'Room is full (max 8 players)' });
    if (room.gameState !== 'lobby') return callback({ success: false, error: 'Game already in progress' });
    room.players.push({ id: socket.id, name: playerName, score: 0 });
    socket.join(roomCode);
    io.to(roomCode).emit('room-updated', room);
    callback({ success: true, room });
  });

  socket.on('start-game', (data, callback) => {
    const { roomCode, questions } = data;
    const room = rooms.get(roomCode);
    if (!room || room.host !== socket.id) return callback({ success: false, error: 'Only the host can start the game' });
    room.gameState = 'playing';
    room.questions = questions;
    room.currentQuestion = 0;
    room.answers = {};
    room.players = room.players.map((player) => ({ ...player, score: 0 }));
    console.log(`[start-game] room=${roomCode} players=${room.players.length} questions=${questions.length}`);
    io.to(roomCode).emit('game-started', room);
    callback({ success: true });
  });

  socket.on('submit-answer', (data, callback) => {
    const { roomCode, questionIndex, answer, timeSpent } = data;
    const room = rooms.get(roomCode);
    console.log(`[submit-answer] player=${socket.id} room=${roomCode} q=${questionIndex} ans=${answer}`);
    if (!room || room.gameState !== 'playing') {
      console.log(`[submit-answer] REJECTED: room=${!!room} state=${room?.gameState}`);
      return callback({ success: false, error: 'Invalid game state' });
    }
    const question = room.questions[questionIndex];
    if (!question) {
      console.log(`[submit-answer] REJECTED: question ${questionIndex} not found, room has ${room.questions.length} questions`);
      return callback({ success: false, error: 'Invalid question' });
    }
    const isCorrect = answer === question.correctAnswer;
    const score = isCorrect ? 1 : 0;
    const player = room.players.find(p => p.id === socket.id);
    if (player) player.score += score;
    if (!room.answers[questionIndex]) room.answers[questionIndex] = {};
    room.answers[questionIndex][socket.id] = { answer, isCorrect, score, timeSpent };

    const answerCount = Object.keys(room.answers[questionIndex]).length;
    const playerCount = room.players.length;
    const allAnswered = answerCount >= playerCount;
    console.log(`[submit-answer] answers=${answerCount}/${playerCount} allAnswered=${allAnswered}`);

    if (allAnswered) {
      console.log(`[submit-answer] Emitting question-complete for question ${questionIndex}`);
      io.to(roomCode).emit('question-complete', { questionIndex, answers: room.answers[questionIndex], players: room.players });

      // Delay to let all players see the feedback and correct answer
      setTimeout(() => {
        if (!rooms.has(roomCode) || room.gameState !== 'playing') return;

        room.currentQuestion++;
        if (room.currentQuestion >= room.questions.length) {
          room.gameState = 'finished';
          console.log(`[submit-answer] Game finished`);
          io.to(roomCode).emit('game-finished', { players: [...room.players].sort((a, b) => b.score - a.score) });
        } else {
          console.log(`[submit-answer] Emitting new-question index=${room.currentQuestion}`);
          io.to(roomCode).emit('new-question', {
            roomCode,
            questionIndex: room.currentQuestion,
            question: room.questions[room.currentQuestion]
          });
        }
      }, 2000);
    }

    callback({ success: true, isCorrect, score, waiting: !allAnswered });
  });

  socket.on('rematch-room', (data, callback) => {
    const { roomCode } = data || {};
    const room = rooms.get(roomCode);
    if (!room) return callback?.({ success: false, error: 'Room not found' });
    socket.join(roomCode);
    room.gameState = 'lobby';
    room.questions = [];
    room.currentQuestion = 0;
    room.answers = {};
    room.players = room.players.map(p => ({ ...p, score: 0 }));
    io.to(roomCode).emit('room-updated', room);
    io.to(roomCode).emit('return-to-lobby', room);
    io.to(roomCode).emit('rematch-started', room);
    callback?.({ success: true, room });
  });

  socket.on('get-room', (data, callback) => {
    const { roomCode } = data || {};
    const room = rooms.get(roomCode);
    if (!room) return callback?.({ success: false, error: 'Room not found' });
    socket.join(roomCode);
    callback?.({ success: true, room });
  });

  socket.on('leave-room', (data, callback) => {
    const { roomCode } = data || {};
    const room = rooms.get(roomCode);
    if (room) {
      const idx = room.players.findIndex(p => p.id === socket.id);
      if (idx !== -1) {
        room.players.splice(idx, 1);
        socket.leave(roomCode);
        if (room.players.length === 0) {
          rooms.delete(roomCode);
        } else {
          if (room.host === socket.id) room.host = room.players[0].id;
          io.to(roomCode).emit('room-updated', room);
        }
      }
    }
    callback?.({ success: true });
  });

  socket.on('disconnect', () => {
    rooms.forEach((room, code) => {
      const idx = room.players.findIndex(p => p.id === socket.id);
      if (idx !== -1) {
        room.players.splice(idx, 1);
        if (room.players.length === 0) {
          rooms.delete(code);
        } else {
          if (room.host === socket.id) room.host = room.players[0].id;
          io.to(code).emit('room-updated', room);

          // If a game was playing and now all remaining players have submitted
          if (room.gameState === 'playing' && room.questions && room.questions.length > 0) {
            const currentQ = room.currentQuestion;
            const answersForQ = room.answers[currentQ] || {};
            const answerCount = Object.keys(answersForQ).length;
            const playerCount = room.players.length;

            if (playerCount > 0 && answerCount >= playerCount) {
              io.to(code).emit('question-complete', {
                questionIndex: currentQ,
                answers: answersForQ,
                players: room.players
              });

              setTimeout(() => {
                if (!rooms.has(code) || room.gameState !== 'playing') return;
                room.currentQuestion++;
                if (room.currentQuestion >= room.questions.length) {
                  room.gameState = 'finished';
                  io.to(code).emit('game-finished', { players: [...room.players].sort((a, b) => b.score - a.score) });
                } else {
                  io.to(code).emit('new-question', {
                    roomCode: code,
                    questionIndex: room.currentQuestion,
                    question: room.questions[room.currentQuestion]
                  });
                }
              }, 2000);
            }
          }
        }
      }
    });
  });
});

// ─── Static Frontend Serving (Unified Hosting) ──────────────────────────────
const clientDist = path.join(__dirname, '..', 'client', 'dist');
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/socket.io')) {
      return next();
    }
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

// ─── Graceful shutdown ──────────────────────────────────────────────────────
process.on('SIGINT', () => {
  db.close();
  process.exit(0);
});

process.on('SIGTERM', () => {
  db.close();
  process.exit(0);
});

// ─── Start Server ───────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, '0.0.0.0', () => {
  const interfaces = os.networkInterfaces();
  let localIP = 'localhost';
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) { localIP = iface.address; break; }
    }
  }
  console.log(`Server running on port ${PORT}`);
  console.log(`Local: http://localhost:${PORT}`);
  console.log(`Network: http://${localIP}:${PORT}`);
});
