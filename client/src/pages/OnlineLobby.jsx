import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../context/GameContext';
import { useSocket } from '../hooks/useSocket';
import { getMe, isAuthenticated } from '../api';
import NavBar from '../components/NavBar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import questions from '../data/questions.json';
import { getUnseenQuestions, resetSeenQuestions } from '../utils/seenQuestions';
import { selectBalancedQuestions } from '../utils/questionFilters';
import { sound } from '../utils/audio';
import {
  Globe,
  Crown,
  Key,
  Copy,
  Check,
  Users,
  Settings2,
  ArrowRight,
  LogOut,
  Sparkles,
  Loader2,
  ShieldAlert
} from 'lucide-react';
import './OnlineLobby.css';

export default function OnlineLobby() {
  const navigate = useNavigate();
  const { state, dispatch } = useGame();
  const { socket, isConnected, createRoom, joinRoom, startGame } = useSocket();
  const [playerName, setPlayerName] = useState(state.playerName || '');
  const [roomCode, setRoomCode] = useState('');
  const [currentRoom, setCurrentRoom] = useState(state.room || null);
  const [error, setError] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [questionCount, setQuestionCount] = useState(state.settings.questionCount || 10);
  const [filters, setFilters] = useState(state.settings.filters || {
    testament: 'all',
    category: 'all',
    difficulty: 'all'
  });

  const categories = [...new Set(questions.map(q => q.category))].sort();
  const difficulties = ['Easy', 'Medium', 'Hard'];

  useEffect(() => {
    const loadUserName = async () => {
      if (isAuthenticated() && !state.playerName) {
        try {
          const user = await getMe();
          dispatch({ type: 'SET_PLAYER_NAME', payload: user.username });
          setPlayerName(user.username);
        } catch (err) {
          console.error('Failed to load user profile', err);
        }
      }
    };

    loadUserName();
  }, [dispatch, state.playerName]);

  useEffect(() => {
    if (!socket) return;

    const handleRoomUpdated = (room) => {
      setCurrentRoom(room);
      dispatch({ type: 'SET_ROOM', payload: room });
    };

    const handleGameStarted = (room) => {
      dispatch({ type: 'SET_PLAYERS', payload: room.players });
      dispatch({ type: 'SET_QUESTIONS', payload: room.questions });
      dispatch({ type: 'SET_ROOM_CODE', payload: room.code });
      dispatch({ type: 'SET_ROOM', payload: room });
      dispatch({ type: 'START_GAME' });
      navigate('/game');
    };

    socket.on('room-updated', handleRoomUpdated);
    socket.on('game-started', handleGameStarted);

    return () => {
      socket.off('room-updated', handleRoomUpdated);
      socket.off('game-started', handleGameStarted);
    };
  }, [socket, navigate, dispatch]);

  useEffect(() => {
    if (state.room) {
      setCurrentRoom(state.room);
    }
  }, [state.room]);

  useEffect(() => {
    const code = state.roomCode || state.room?.code;
    if (socket && code) {
      socket.emit('get-room', { roomCode: code }, (res) => {
        if (res && res.success && res.room) {
          setCurrentRoom(res.room);
          dispatch({ type: 'SET_ROOM', payload: res.room });
        }
      });
    }
  }, [socket, state.roomCode, state.room?.code, dispatch]);

  const handleCreateRoom = async () => {
    sound.playClick();
    const userName = (state.playerName || playerName).trim();
    if (!userName) {
      setError('Please enter your display name');
      return;
    }

    setIsCreating(true);
    setError('');

    const result = await createRoom(userName, state.settings);
    
    if (result.success) {
      setCurrentRoom(result.room);
      dispatch({ type: 'SET_IS_HOST', payload: true });
      dispatch({ type: 'SET_ROOM_CODE', payload: result.roomCode });
      dispatch({ type: 'SET_ROOM', payload: result.room });
      dispatch({ type: 'SET_PLAYER_NAME', payload: userName });
      setPlayerName(userName);
    } else {
      setError(result.error || 'Failed to create room');
    }
    
    setIsCreating(false);
  };

  const handleJoinRoom = async () => {
    sound.playClick();
    const userName = (state.playerName || playerName).trim();
    if (!userName) {
      setError('Please enter your display name');
      return;
    }
    if (!roomCode.trim()) {
      setError('Please enter a room code');
      return;
    }

    setError('');

    const result = await joinRoom(roomCode.toUpperCase().trim(), userName);
    
    if (result.success) {
      setCurrentRoom(result.room);
      dispatch({ type: 'SET_IS_HOST', payload: false });
      dispatch({ type: 'SET_ROOM_CODE', payload: result.room.code });
      dispatch({ type: 'SET_ROOM', payload: result.room });
      dispatch({ type: 'SET_PLAYER_NAME', payload: userName });
      setPlayerName(userName);
    } else {
      setError(result.error || 'Failed to join room');
    }
  };

  const handleStartGame = async () => {
    sound.playClick();
    if (!currentRoom || currentRoom.host !== socket?.id) return;

    let pool = getUnseenQuestions(questions);
    if (pool.length === 0) {
      resetSeenQuestions();
      pool = [...questions];
    }

    let filteredQuestions = pool;
    if (filters.testament !== 'all') {
      filteredQuestions = filteredQuestions.filter(q => q.testament === filters.testament);
    }
    if (filters.category !== 'all') {
      filteredQuestions = filteredQuestions.filter(q => q.category === filters.category);
    }
    if (filters.difficulty !== 'all') {
      filteredQuestions = filteredQuestions.filter(q => q.difficulty === filters.difficulty);
    }

    if (filteredQuestions.length === 0) {
      setError('No questions match the selected filters. Please choose broader filters.');
      return;
    }

    const balancedPool = selectBalancedQuestions(filteredQuestions, questionCount);

    const shuffledQuestions = [...balancedPool]
      .sort(() => Math.random() - 0.5)
      .slice(0, Math.min(questionCount, balancedPool.length))
      .map(q => {
        const indices = q.options.map((_, i) => i);
        for (let i = indices.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [indices[i], indices[j]] = [indices[j], indices[i]];
        }
        return {
          ...q,
          options: indices.map(i => q.options[i]),
          correctAnswer: indices.indexOf(q.correctAnswer)
        };
      });

    const result = await startGame(currentRoom.code, shuffledQuestions);
    
    if (!result.success) {
      setError(result.error || 'Failed to start game');
    }
  };

  const handleCopyCode = () => {
    sound.playClick();
    if (!currentRoom?.code) return;
    navigator.clipboard.writeText(currentRoom.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleBack = () => {
    sound.playClick();
    const code = currentRoom?.code || state.roomCode || state.room?.code;
    if (socket && code) {
      socket.emit('leave-room', { roomCode: code });
    }
    setCurrentRoom(null);
    dispatch({ type: 'RESET_GAME' });
    navigate('/');
  };

  if (!isConnected) {
    return (
      <>
        <NavBar title="Online Multiplayer" />
        <div className="max-w-md mx-auto px-4 py-16 text-center">
          <Card className="p-8 border-dashed bg-card/80 backdrop-blur-sm shadow-md space-y-4">
            <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto" />
            <h2 className="text-xl font-bold font-serif text-foreground">Connecting to Server...</h2>
            <p className="text-sm text-muted-foreground">Joining real-time multiplayer fellowship realm.</p>
          </Card>
        </div>
      </>
    );
  }

  if (currentRoom) {
    const isHost = currentRoom.host === socket?.id;
    
    return (
      <>
        <NavBar title="Multiplayer Lobby" />
        <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
          {/* Room Header & Code Card */}
          <Card className="border-primary/40 bg-card/95 backdrop-blur-sm shadow-lg overflow-hidden">
            <div className="h-2 bg-gradient-to-r from-amber-500 via-primary to-amber-600" />
            <CardContent className="p-6 space-y-6 text-center">
              <div className="flex items-center justify-between">
                <Badge variant="gold" className="gap-1.5 shadow-sm text-xs font-semibold">
                  <Sparkles className="w-3.5 h-3.5 fill-current" /> Live Game Room
                </Badge>
                <Badge variant="outline" className="gap-1 font-mono text-xs">
                  <Users className="w-3.5 h-3.5 text-primary" />
                  {currentRoom.players.length}/8 Disciples
                </Badge>
              </div>

              <div>
                <span className="text-xs uppercase font-mono tracking-widest text-muted-foreground">ROOM CODE</span>
                <div className="flex items-center justify-center gap-3 mt-2">
                  <h2 className="text-4xl sm:text-5xl font-mono font-black tracking-widest text-primary drop-shadow-sm">
                    {currentRoom.code}
                  </h2>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopyCode}
                    className="gap-1.5 h-10 px-3 hover:border-primary hover:text-primary transition-all"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground mt-2 max-w-sm mx-auto">
                  Share this 6-character room code with your friends or church study group to play together!
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Host Settings */}
          {isHost && (
            <Card className="border bg-card/80 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Settings2 className="w-4 h-4 text-primary" /> Game Rules (Host Controls)
                </CardTitle>
                <CardDescription className="text-xs">Configure the match questions for all players</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">Testament</label>
                    <select
                      className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      value={filters.testament}
                      onChange={(e) => setFilters({ ...filters, testament: e.target.value })}
                    >
                      <option value="all">All Testaments</option>
                      <option value="Old">Old Testament</option>
                      <option value="New">New Testament</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">Difficulty</label>
                    <select
                      className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      value={filters.difficulty}
                      onChange={(e) => setFilters({ ...filters, difficulty: e.target.value })}
                    >
                      <option value="all">All Difficulties</option>
                      {difficulties.map(d => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">Category</label>
                    <select
                      className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      value={filters.category}
                      onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                    >
                      <option value="all">All Categories</option>
                      {categories.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">Question Count</label>
                    <select
                      className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      value={questionCount}
                      onChange={(e) => setQuestionCount(Number(e.target.value))}
                    >
                      {[5, 10, 15, 20, 25].map(cnt => (
                        <option key={cnt} value={cnt}>{cnt} Questions</option>
                      ))}
                    </select>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Players List */}
          <Card className="border bg-card/80 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-primary" /> Connected Players ({currentRoom.players.length}/8)
                </span>
                <span className="text-xs font-normal text-muted-foreground">Min. 2 players required</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {currentRoom.players.map((player, index) => {
                  const isPlayerHost = player.id === currentRoom.host;
                  return (
                    <div
                      key={player.id}
                      className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                        isPlayerHost
                          ? 'bg-amber-500/10 border-amber-500/30'
                          : 'bg-card/90 border-border/70'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="w-5 text-xs font-mono text-muted-foreground">#{index + 1}</span>
                        <span className="font-medium text-foreground text-sm">{player.name}</span>
                      </div>
                      {isPlayerHost && (
                        <Badge variant="gold" className="text-[10px] gap-1 px-2 py-0.5">
                          <Crown className="w-3 h-3 fill-current" /> Host
                        </Badge>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {error && (
            <div className="flex items-center gap-2 p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Action Row */}
          <div className="space-y-3 pt-2">
            {isHost ? (
              <Button
                variant="gold"
                size="lg"
                className="w-full text-base font-semibold shadow-md py-6"
                onClick={handleStartGame}
                disabled={currentRoom.players.length < 2}
              >
                {currentRoom.players.length >= 2 ? (
                  <>Launch Trivia Game <ArrowRight className="w-4 h-4 ml-2" /></>
                ) : (
                  'Waiting for at least 1 more player...'
                )}
              </Button>
            ) : (
              <div className="flex items-center justify-center gap-2 py-3 px-4 rounded-lg bg-primary/10 border border-primary/20 text-primary text-sm font-medium">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Waiting for the room host to launch the game...</span>
              </div>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={handleBack}
              className="w-full text-muted-foreground hover:text-destructive hover:border-destructive/40"
            >
              <LogOut className="w-4 h-4 mr-2" /> Leave Room
            </Button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <NavBar title="Online Multiplayer" />
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* Hero Section */}
        <div className="text-center space-y-3">
          <Badge variant="outline" className="gap-1.5 px-3 py-1 text-xs font-semibold text-primary border-primary/30">
            <Globe className="w-3.5 h-3.5" /> Real-Time Fellowship
          </Badge>
          <h1 className="text-3xl sm:text-4xl font-serif font-black tracking-tight text-foreground">
            Multiplayer Bible Trivia
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto text-base">
            Challenge friends, family, and church disciples worldwide in real-time Scripture trivia.
          </p>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg max-w-md mx-auto">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Display Name Input (if not already set) */}
        {(!state.playerName || state.playerName.trim().length === 0) && (
          <Card className="max-w-md mx-auto border bg-card/90 shadow-sm">
            <CardContent className="p-4 space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Your Display Name
              </label>
              <Input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="Enter your name (e.g. Peter, Mary)"
                className="text-base"
              />
            </CardContent>
          </Card>
        )}

        {/* Actions Grid: Create vs Join */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
          {/* Create Room Card */}
          <Card className="border hover:border-primary/50 transition-all hover:shadow-md bg-card/90 flex flex-col justify-between">
            <CardHeader>
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center mb-2">
                <Crown className="w-6 h-6 fill-current" />
              </div>
              <CardTitle className="text-xl font-serif">Create a Room</CardTitle>
              <CardDescription className="text-sm">
                Host a private fellowship room, customize categories, and invite friends with a code.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-2">
              <Button
                variant="gold"
                className="w-full font-semibold shadow-sm"
                onClick={handleCreateRoom}
                disabled={isCreating}
              >
                {isCreating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Creating...
                  </>
                ) : (
                  <>
                    Create Room <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Join Room Card */}
          <Card className="border hover:border-primary/50 transition-all hover:shadow-md bg-card/90 flex flex-col justify-between">
            <CardHeader>
              <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center mb-2">
                <Key className="w-6 h-6" />
              </div>
              <CardTitle className="text-xl font-serif">Join with Code</CardTitle>
              <CardDescription className="text-sm">
                Enter the 6-character room code shared by your friend to join their trivia game.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-2 space-y-3">
              <Input
                type="text"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                placeholder="e.g. AB12CD"
                maxLength={6}
                className="font-mono text-center tracking-widest uppercase font-bold text-base"
              />
              <Button
                variant="default"
                className="w-full font-semibold shadow-sm"
                onClick={handleJoinRoom}
              >
                Join Room <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
