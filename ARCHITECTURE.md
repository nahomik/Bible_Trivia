# Bible Trivia - System Architecture Diagram

## Overview
A real-time multiplayer Bible trivia game with user authentication, game statistics, and both single-player and online multiplayer modes.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT (React)                                 │
│                         Port: 5173 (Vite Dev Server)                       │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      │ HTTP (REST API)
                                      │ WebSocket (Socket.IO)
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              SERVER (Node.js)                               │
│                         Port: 3001 (Express + Socket.IO)                    │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      │ SQLite
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           DATABASE (SQLite)                                 │
│                         bible_trivia.db (WAL mode)                          │
└─────────────────────────────────────────────────────────────────────────────┘

## CLIENT ARCHITECTURE

┌─────────────────────────────────────────────────────────────────────────────┐
│                                App.jsx                                       │
│                            (React Router)                                    │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
              ┌───────────────────────┼───────────────────────┐
              │                       │                       │
              ▼                       ▼                       ▼
┌─────────────────────┐   ┌─────────────────────┐   ┌─────────────────────┐
│   Authentication    │   │      Game Flow      │   │      User Data      │
│                     │   │                     │   │                     │
│ • LoginPage         │   │ • HomePage          │   │ • StatsPage         │
│ • RegisterPage      │   │ • GameSettings      │   │                     │
│                     │   │ • GamePlay          │   │                     │
│ [api.js]            │   │ • Results           │   │ [api.js]            │
│ - register()        │   │ • OnlineLobby       │   │ - getStats()        │
│ - login()           │   │                     │   │ - getGameHistory()  │
│ - getMe()           │   │ [GameContext]       │   │                     │
│ - logout()          │   │ - Game state mgmt   │   │                     │
└─────────────────────┘   └─────────────────────┘   └─────────────────────┘
                                      │
                                      │
                    ┌─────────────────┴─────────────────┐
                    │                                     │
                    ▼                                     ▼
          ┌─────────────────┐                 ┌─────────────────┐
          │   Components    │                 │     Hooks       │
          │                 │                 │                 │
          │ • NavBar        │                 │ • useSocket     │
          │ • QuestionCard  │                 │   - createRoom  │
          │ • Timer         │                 │   - joinRoom    │
          │ • Leaderboard   │                 │   - startGame   │
          │                 │                 │   - submitAnswer│
          └─────────────────┘                 │ • useTimer      │
                                              └─────────────────┘

## SERVER ARCHITECTURE

┌─────────────────────────────────────────────────────────────────────────────┐
│                              index.js                                        │
│                          (Express + Socket.IO)                               │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
              ┌───────────────────────┼───────────────────────┐
              │                       │                       │
              ▼                       ▼                       ▼
┌─────────────────────┐   ┌─────────────────────┐   ┌─────────────────────┐
│   Auth Routes       │   │    Game Routes      │   │   Socket.IO Events  │
│                     │   │                     │   │                     │
│ POST /auth/register │   │ POST /game/save     │   • create-room        │
│ POST /auth/login    │   │ GET  /game/history  │   • join-room          │
│ GET  /auth/me       │   │ GET  /game/stats    │   • start-game         │
│                     │   │                     │   • submit-answer      │
│ [JWT Auth]          │   │ [Game Logic]        │   • next-question      │
│ - bcryptjs          │   │ - Score calculation │   • room-updated       │
│ - jwt               │   │ - Streak tracking   │   • game-started       │
│                     │   │ - History logging   │   • question-complete  │
└─────────────────────┘   └─────────────────────┘   • game-finished       │
                                      │               └─────────────────────┘
                                      │
                                      │ Prepared Statements
                                      ▼
                          ┌─────────────────────┐
                          │   SQLite Database   │
                          │                     │
                          │ TABLES:            │
                          │ • users            │
                          │   - id, username,  │
                          │     email, password│
                          │     avatar         │
                          │ • stats            │
                          │   - user_id, games │
                          │     played, score  │
                          │     streak, etc.   │
                          │ • game_history     │
                          │   - user_id, mode, │
                          │     score, accuracy│
                          │     time_taken,    │
                          │     difficulty     │
                          └─────────────────────┘

## DATA FLOW

### Single Player Flow:
1. User → HomePage → GameSettings (configure filters)
2. GameSettings → GamePlay (load questions from questions.json)
3. GamePlay → Results (show score)
4. Results → POST /game/save (save to SQLite)
5. StatsPage → GET /game/stats (fetch user statistics)

### Multiplayer Flow:
1. User → OnlineLobby → createRoom() [Socket.IO]
2. Server generates room code, stores in memory (Map)
3. Other users → OnlineLobby → joinRoom() [Socket.IO]
4. Host → startGame() [Socket.IO] with shuffled questions
5. All players → GamePlay (synced via Socket.IO events)
6. Players submit answers → submit-answer [Socket.IO]
7. Server calculates scores, broadcasts results
8. Host triggers next-question [Socket.IO]
9. Game ends → game-finished [Socket.IO] → Results page

### Authentication Flow:
1. Register/Login → POST /auth/register or /auth/login
2. Server validates, hashes password (bcryptjs)
3. Server generates JWT token
4. Client stores token in localStorage
5. Subsequent requests include Authorization: Bearer <token>
6. Server verifies token via authenticateToken middleware

## KEY TECHNOLOGIES

### Client:
- **React 18** - UI framework
- **Vite** - Build tool/dev server
- **React Router** - Client-side routing
- **Socket.IO Client** - Real-time multiplayer
- **Context API** - Global state management

### Server:
- **Express** - HTTP server
- **Socket.IO** - WebSocket server
- **better-sqlite3** - SQLite database with WAL mode
- **bcryptjs** - Password hashing
- **jsonwebtoken** - JWT authentication
- **CORS** - Cross-origin resource sharing

### Database:
- **SQLite** - Embedded database
- **WAL Mode** - Write-Ahead Logging for concurrent reads
- **Foreign Keys** - Referential integrity
- **Prepared Statements** - SQL injection prevention

## FILE STRUCTURE

```
bible_trivia/
├── client/
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   │   ├── NavBar.jsx
│   │   │   ├── QuestionCard.jsx
│   │   │   ├── Timer.jsx
│   │   │   └── Leaderboard.jsx
│   │   ├── context/         # React Context for state
│   │   │   └── GameContext.jsx
│   │   ├── hooks/           # Custom React hooks
│   │   │   ├── useSocket.js
│   │   │   └── useTimer.js
│   │   ├── pages/           # Page components
│   │   │   ├── HomePage.jsx
│   │   │   ├── LoginPage.jsx
│   │   │   ├── RegisterPage.jsx
│   │   │   ├── GameSettings.jsx
│   │   │   ├── GamePlay.jsx
│   │   │   ├── Results.jsx
│   │   │   ├── OnlineLobby.jsx
│   │   │   └── StatsPage.jsx
│   │   ├── data/            # Static data
│   │   │   └── questions.json
│   │   ├── api.js           # API client
│   │   ├── App.jsx          # Main app with routing
│   │   └── main.jsx         # Entry point
│   ├── package.json
│   └── vite.config.js
└── server/
    ├── index.js             # Main server file
    ├── bible_trivia.db      # SQLite database
    ├── db.json              # Legacy JSON DB (migration)
    └── package.json
```

## SECURITY FEATURES

- Password hashing with bcryptjs (salt rounds: 10)
- JWT token authentication (30-day expiration)
- CORS enabled for cross-origin requests
- SQL injection prevention via prepared statements
- Foreign key constraints for data integrity
- WAL mode for database concurrency

## SCORING SYSTEM

- Base score: 100 points per correct answer
- Time bonus: Up to 60 points (30 seconds max, 2 points per second saved)
- Multiplayer: Real-time score tracking via Socket.IO
- Streak tracking: Consecutive perfect games
- Best score/accuracy persistence in database
