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
import { selectBalancedQuestions, shuffleQuestionOptions } from '../utils/questionFilters';
import { sound } from '../utils/audio';
import {
  t,
  CATEGORIES_AMHARIC,
  DIFFICULTIES_AMHARIC
} from '../utils/translations';
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
  ShieldAlert,
  Clock,
  Plus,
  Minus
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
  const [timePerQuestion, setTimePerQuestion] = useState(
    state.room?.settings?.timePerQuestion || state.settings?.timePerQuestion || 20
  );
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
      if (room.settings?.timePerQuestion) {
        setTimePerQuestion(room.settings.timePerQuestion);
      }
      if (room.settings?.questionCount) {
        setQuestionCount(room.settings.questionCount);
      }
      if (room.settings?.filters) {
        setFilters(room.settings.filters);
      }
    };

    const handleGameStarted = (room) => {
      const roomTime = room.settings?.timePerQuestion || timePerQuestion || 20;
      dispatch({ type: 'SET_SETTINGS', payload: { ...room.settings, timePerQuestion: roomTime } });
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
  }, [socket, navigate, dispatch, timePerQuestion]);

  useEffect(() => {
    if (state.room) {
      setCurrentRoom(state.room);
      if (state.room.settings?.timePerQuestion) {
        setTimePerQuestion(state.room.settings.timePerQuestion);
      }
    }
  }, [state.room]);

  useEffect(() => {
    const code = state.roomCode || state.room?.code;
    if (socket && code) {
      socket.emit('get-room', { roomCode: code }, (res) => {
        if (res && res.success && res.room) {
          setCurrentRoom(res.room);
          dispatch({ type: 'SET_ROOM', payload: res.room });
          if (res.room.settings?.timePerQuestion) {
            setTimePerQuestion(res.room.settings.timePerQuestion);
          }
        }
      });
    }
  }, [socket, state.roomCode, state.room?.code, dispatch]);

  const changeTimePerQuestion = (newTime) => {
    sound.playClick();
    const clamped = Math.max(5, Math.min(120, Number(newTime)));
    setTimePerQuestion(clamped);
    if (socket && currentRoom?.code && (currentRoom.host === socket.id || state.isHost)) {
      socket.emit('update-room-settings', {
        roomCode: currentRoom.code,
        settings: { timePerQuestion: clamped }
      });
    }
  };

  const handleCreateRoom = async () => {
    sound.playClick();
    const userName = (state.playerName || playerName).trim() || state.user?.username || 'Faithful Disciple';

    setIsCreating(true);
    setError('');

    const roomSettings = {
      ...state.settings,
      questionCount,
      timePerQuestion,
      filters
    };

    const result = await createRoom(userName, roomSettings);
    
    if (result.success) {
      setCurrentRoom(result.room);
      dispatch({ type: 'SET_IS_HOST', payload: true });
      dispatch({ type: 'SET_ROOM_CODE', payload: result.roomCode });
      dispatch({ type: 'SET_ROOM', payload: result.room });
      dispatch({ type: 'SET_PLAYER_NAME', payload: userName });
      dispatch({ type: 'SET_SETTINGS', payload: roomSettings });
      setPlayerName(userName);
    } else {
      setError(result.error || 'Failed to create room');
    }
    
    setIsCreating(false);
  };

  const handleJoinRoom = async () => {
    sound.playClick();
    const userName = (state.playerName || playerName).trim() || state.user?.username || 'Faithful Disciple';
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
      .map(q => shuffleQuestionOptions(q));

    dispatch({ type: 'SET_SETTINGS', payload: { ...currentRoom.settings, timePerQuestion } });
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
        <NavBar title={t('multiplayerLobby', state.language)} />
        <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
          {/* Room Header & Code Card */}
          <Card className="border border-border bg-card shadow-sm overflow-hidden">
            <CardContent className="p-6 space-y-6 text-center">
              <div className="flex items-center justify-between">
                <Badge variant="gold" className="gap-1.5 text-xs font-bold">
                  <Sparkles className="w-3.5 h-3.5" /> {t('liveRoom', state.language)}
                </Badge>
                <Badge variant="outline" className="gap-1 font-mono text-xs">
                  <Users className="w-3.5 h-3.5 text-gold-dark dark:text-gold" />
                  {currentRoom.players.length}/8 {t('disciples', state.language)}
                </Badge>
              </div>

              <div>
                <span className="text-xs uppercase font-mono tracking-widest text-muted-foreground">{t('roomCode', state.language)}</span>
                <div className="flex items-center justify-center gap-3 mt-2">
                  <h2 className="text-4xl sm:text-5xl font-mono font-black tracking-widest text-foreground">
                    {currentRoom.code}
                  </h2>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopyCode}
                    className="gap-1.5 h-10 px-3 font-semibold"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    <span>{copied ? t('copied', state.language) : t('copyCode', state.language)}</span>
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground mt-2 max-w-sm mx-auto">
                  {t('shareRoomHint', state.language)}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Room Settings & Timer Configuration */}
          <Card className="border border-border bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Settings2 className="w-4 h-4 text-primary" /> {isHost ? t('gameRulesHost', state.language) : t('gameSettingsTitle', state.language)}
                </span>
                {isHost ? (
                  <Badge variant="gold" className="text-[10px] gap-1 px-2 py-0.5">
                    <Crown className="w-3 h-3 fill-current" /> {t('hostBadge', state.language)}
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-[10px] px-2 py-0.5 text-muted-foreground">
                    {t('configuredByHost', state.language)}
                  </Badge>
                )}
              </CardTitle>
              <CardDescription className="text-xs">
                {isHost ? t('configureRules', state.language) : t('configuredByHost', state.language)}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Seconds to Answer: Increase / Lower Controls */}
              <div className="p-3.5 rounded-xl bg-muted/40 border border-border/80 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <div className="p-2.5 rounded-xl bg-primary/10 text-primary shrink-0">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-foreground flex items-center gap-2">
                      <span>{t('timePerQuestionLabel', state.language)}</span>
                      <Badge variant="gold" className="font-mono text-xs font-bold px-2 py-0.5">
                        {timePerQuestion} {state.language === 'am' ? 'ሰከንድ' : 'sec'}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {isHost ? t('secondsPerQuestionDesc', state.language) : `${t('configuredByHost', state.language)} (${timePerQuestion}s)`}
                    </p>
                  </div>
                </div>

                {isHost ? (
                  <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
                    <div className="flex items-center gap-1 bg-background border rounded-lg p-1 shadow-sm">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2.5 text-xs font-bold hover:bg-muted"
                        onClick={() => changeTimePerQuestion(timePerQuestion - 5)}
                        disabled={timePerQuestion <= 5}
                        title={t('lowerSeconds', state.language)}
                      >
                        <Minus className="w-3.5 h-3.5 mr-1" /> -5s
                      </Button>
                      <span className="w-12 text-center font-mono font-bold text-sm text-foreground">
                        {timePerQuestion}s
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2.5 text-xs font-bold hover:bg-muted"
                        onClick={() => changeTimePerQuestion(timePerQuestion + 5)}
                        disabled={timePerQuestion >= 120}
                        title={t('increaseSeconds', state.language)}
                      >
                        <Plus className="w-3.5 h-3.5 mr-1" /> +5s
                      </Button>
                    </div>

                    <div className="flex items-center gap-1">
                      {[10, 15, 20, 30, 45, 60].map(sec => (
                        <Button
                          key={sec}
                          type="button"
                          variant={timePerQuestion === sec ? "gold" : "outline"}
                          size="sm"
                          className="h-8 px-2 text-xs font-semibold"
                          onClick={() => changeTimePerQuestion(sec)}
                        >
                          {sec}s
                        </Button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <Badge variant="gold" className="px-3 py-1 font-mono text-xs font-bold">
                    ⏱️ {timePerQuestion}s
                  </Badge>
                )}
              </div>

              {isHost ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">{t('testament', state.language)}</label>
                    <select
                      className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      value={filters.testament}
                      onChange={(e) => setFilters({ ...filters, testament: e.target.value })}
                    >
                      <option value="all">{state.language === 'am' ? 'ሁሉም ኪዳናት' : 'All Testaments'}</option>
                      <option value="Old">{state.language === 'am' ? 'ብሉይ ኪዳን' : 'Old Testament'}</option>
                      <option value="New">{state.language === 'am' ? 'አዲስ ኪዳን' : 'New Testament'}</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">{t('difficulty', state.language)}</label>
                    <select
                      className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      value={filters.difficulty}
                      onChange={(e) => setFilters({ ...filters, difficulty: e.target.value })}
                    >
                      <option value="all">{state.language === 'am' ? 'ሁሉም ደረጃዎች' : 'All Difficulties'}</option>
                      {difficulties.map(d => (
                        <option key={d} value={d}>
                          {state.language === 'am' ? (DIFFICULTIES_AMHARIC[d] || d) : d}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">{t('category', state.language)}</label>
                    <select
                      className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      value={filters.category}
                      onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                    >
                      <option value="all">{state.language === 'am' ? 'ሁሉም ምድቦች' : 'All Categories'}</option>
                      {categories.map(c => (
                        <option key={c} value={c}>
                          {state.language === 'am' ? (CATEGORIES_AMHARIC[c] || c) : c}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">{t('questionCount', state.language)}</label>
                    <select
                      className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      value={questionCount}
                      onChange={(e) => setQuestionCount(Number(e.target.value))}
                    >
                      {[5, 10, 15, 20, 25].map(cnt => (
                        <option key={cnt} value={cnt}>{cnt} {state.language === 'am' ? 'ጥያቄዎች' : 'Questions'}</option>
                      ))}
                    </select>
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2 text-xs text-muted-foreground pt-1">
                  <Badge variant="outline">{t('questionCount', state.language)}: {currentRoom.settings?.questionCount || questionCount}</Badge>
                  <Badge variant="outline">{t('difficulty', state.language)}: {currentRoom.settings?.filters?.difficulty || filters.difficulty}</Badge>
                  <Badge variant="outline">{t('testament', state.language)}: {currentRoom.settings?.filters?.testament || filters.testament}</Badge>
                </div>
              )}
            </CardContent>
          </Card>

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
                  <>{t('launchGame', state.language)} <ArrowRight className="w-4 h-4 ml-2" /></>
                ) : (
                  t('waitingPlayers', state.language)
                )}
              </Button>
            ) : (
              <div className="flex items-center justify-center gap-2 py-3 px-4 rounded-lg bg-primary/10 border border-primary/20 text-primary text-sm font-medium">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{t('waitingHost', state.language)}</span>
              </div>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={handleBack}
              className="w-full text-muted-foreground hover:text-destructive hover:border-destructive/40"
            >
              <LogOut className="w-4 h-4 mr-2" /> {t('leaveRoom', state.language)}
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
          <Card className="border border-border hover:border-foreground/40 transition-all bg-card flex flex-col justify-between shadow-sm">
            <CardHeader>
              <div className="w-10 h-10 rounded-lg bg-secondary border border-border flex items-center justify-center text-gold-dark dark:text-gold mb-2">
                <Crown className="w-5 h-5 fill-current" />
              </div>
              <CardTitle className="text-xl font-serif">Create a Room</CardTitle>
              <CardDescription className="text-sm">
                Host a private fellowship room, customize categories, and invite friends with a code.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-2">
              <Button
                variant="gold"
                className="w-full font-bold shadow-sm"
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
          <Card className="border border-border hover:border-foreground/40 transition-all bg-card flex flex-col justify-between shadow-sm">
            <CardHeader>
              <div className="w-10 h-10 rounded-lg bg-secondary border border-border flex items-center justify-center text-foreground mb-2">
                <Key className="w-5 h-5" />
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
                className="w-full font-bold shadow-sm"
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
