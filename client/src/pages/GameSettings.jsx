import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useGame } from '../context/GameContext';
import NavBar from '../components/NavBar';
import questions from '../data/questions.json';
import { getUnseenQuestions, resetSeenQuestions, getSeenQuestionIds } from '../utils/seenQuestions';
import { selectBalancedQuestions } from '../utils/questionFilters';
import { getDailyQuestions, getDailyStreak } from '../utils/dailyChallenge';
import { sound } from '../utils/audio';
import { cleanText } from '../utils/scriptureHelper';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import {
  Sparkles,
  Calendar,
  ShieldAlert,
  Zap,
  Users,
  RotateCcw,
  SlidersHorizontal,
  ChevronLeft
} from 'lucide-react';

const BIBLICAL_NAMES = ['David', 'Sarah', 'Peter', 'Esther', 'Paul', 'Ruth', 'Moses', 'Mary'];

export default function GameSettings() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { state, dispatch } = useGame();
  
  const modeParam = searchParams.get('mode') || state.mode || 'solo';

  useEffect(() => {
    if (modeParam && state.mode !== modeParam) {
      dispatch({ type: 'SET_MODE', payload: modeParam });
    }
  }, [modeParam, state.mode, dispatch]);

  const [playerName, setPlayerName] = useState(state.playerName || '');
  const [playerCount, setPlayerCount] = useState(2);
  const [playerNames, setPlayerNames] = useState(['Player 1 (David)', 'Player 2 (Esther)']);
  const [questionCount, setQuestionCount] = useState(10);
  const [timePerQuestion, setTimePerQuestion] = useState(20);
  const [customCount, setCustomCount] = useState('');
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    testament: 'all',
    book: 'all',
    category: 'all',
    difficulty: 'all'
  });

  const books = [...new Set(questions.map(q => q.book))].sort();
  const categories = [...new Set(questions.map(q => q.category))].sort();

  const handlePlayerCountChange = (count) => {
    sound.playClick();
    setPlayerCount(count);
    const newNames = [...playerNames];
    while (newNames.length < count) {
      const suggested = BIBLICAL_NAMES[newNames.length % BIBLICAL_NAMES.length];
      newNames.push(`Player ${newNames.length + 1} (${suggested})`);
    }
    setPlayerNames(newNames.slice(0, count));
  };

  const unseenCount = getUnseenQuestions(questions).length;
  const seenCount = getSeenQuestionIds().length;

  const [resetKey, setResetKey] = useState(0);
  const handleResetSeen = () => {
    sound.playClick();
    resetSeenQuestions();
    setResetKey(prev => prev + 1);
  };

  const handleStart = () => {
    sound.playClick();
    setError('');

    if (modeParam === 'daily') {
      const dailyQuestions = getDailyQuestions(questions, 5);
      const players = [{ id: 'player-1', name: playerName || state.user?.username || 'Faithful Disciple' }];
      dispatch({ type: 'SET_PLAYER_NAME', payload: playerName || state.user?.username || 'Faithful Disciple' });
      dispatch({ type: 'SET_PLAYERS', payload: players });
      dispatch({ type: 'SET_QUESTIONS', payload: dailyQuestions });
      dispatch({ type: 'SET_SETTINGS', payload: { questionCount: dailyQuestions.length, timePerQuestion: 20 } });
      dispatch({ type: 'START_GAME' });
      navigate('/game');
      return;
    }

    if (modeParam === 'survival') {
      const pool = selectBalancedQuestions(questions, 50).sort(() => Math.random() - 0.5).map(q => {
        const indices = q.options.map((_, i) => i);
        for (let i = indices.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [indices[i], indices[j]] = [indices[j], indices[i]];
        }
        return {
          ...q,
          question: cleanText(q.question),
          options: indices.map(i => cleanText(q.options[i])),
          correctAnswer: indices.indexOf(q.correctAnswer)
        };
      });

      const players = [{ id: 'player-1', name: playerName || state.user?.username || 'Survivor' }];
      dispatch({ type: 'SET_PLAYER_NAME', payload: playerName || state.user?.username || 'Survivor' });
      dispatch({ type: 'SET_PLAYERS', payload: players });
      dispatch({ type: 'SET_QUESTIONS', payload: pool });
      dispatch({ type: 'SET_SETTINGS', payload: { questionCount: pool.length, timePerQuestion: 15 } });
      dispatch({ type: 'START_GAME' });
      navigate('/game');
      return;
    }

    if (modeParam === 'blitz') {
      const pool = selectBalancedQuestions(questions, 40).sort(() => Math.random() - 0.5).map(q => {
        const indices = q.options.map((_, i) => i);
        for (let i = indices.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [indices[i], indices[j]] = [indices[j], indices[i]];
        }
        return {
          ...q,
          question: cleanText(q.question),
          options: indices.map(i => cleanText(q.options[i])),
          correctAnswer: indices.indexOf(q.correctAnswer)
        };
      });

      const players = [{ id: 'player-1', name: playerName || state.user?.username || 'Speed Runner' }];
      dispatch({ type: 'SET_PLAYER_NAME', payload: playerName || state.user?.username || 'Speed Runner' });
      dispatch({ type: 'SET_PLAYERS', payload: players });
      dispatch({ type: 'SET_QUESTIONS', payload: pool });
      dispatch({ type: 'SET_SETTINGS', payload: { questionCount: pool.length, timePerQuestion: 60 } });
      dispatch({ type: 'START_GAME' });
      navigate('/game');
      return;
    }

    // Solo or Local Pass & Play
    const count = customCount ? Math.max(1, parseInt(customCount, 10)) : questionCount;
    
    const applyFilters = (list) => {
      let filtered = list;
      if (filters.testament !== 'all') {
        filtered = filtered.filter(q => q.testament === filters.testament);
      }
      if (filters.book !== 'all') {
        filtered = filtered.filter(q => q.book === filters.book);
      }
      if (filters.category !== 'all') {
        filtered = filtered.filter(q => q.category === filters.category);
      }
      if (filters.difficulty !== 'all') {
        filtered = filtered.filter(q => q.difficulty === filters.difficulty);
      }
      return filtered;
    };

    let pool = getUnseenQuestions(questions);
    let filteredQuestions = applyFilters(pool);

    if (filteredQuestions.length === 0) {
      filteredQuestions = applyFilters(questions);
    }

    if (filteredQuestions.length === 0) {
      setError('No questions found matching your filter selection. Try selecting "All" for some criteria.');
      return;
    }

    const balancedPool = selectBalancedQuestions(filteredQuestions, count);
    const shuffled = [...balancedPool].sort(() => Math.random() - 0.5);
    const selectedQuestions = shuffled.slice(0, Math.min(count, shuffled.length)).map(q => {
      const indices = q.options.map((_, i) => i);
      for (let i = indices.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [indices[i], indices[j]] = [indices[j], indices[i]];
      }
      return {
        ...q,
        question: cleanText(q.question),
        options: indices.map(i => cleanText(q.options[i])),
        correctAnswer: indices.indexOf(q.correctAnswer)
      };
    });

    const players = modeParam === 'solo' 
      ? [{ id: 'player-1', name: playerName || state.user?.username || 'Player 1' }]
      : playerNames.map((name, index) => ({ id: `player-${index + 1}`, name: name.trim() || `Player ${index + 1}` }));

    dispatch({ type: 'SET_PLAYER_NAME', payload: playerName });
    dispatch({ type: 'SET_PLAYERS', payload: players });
    dispatch({ type: 'SET_QUESTIONS', payload: selectedQuestions });
    dispatch({
      type: 'SET_SETTINGS',
      payload: {
        questionCount: selectedQuestions.length,
        timePerQuestion,
        filters
      }
    });
    dispatch({ type: 'START_GAME' });
    
    navigate('/game');
  };

  const getModeTitle = () => {
    if (modeParam === 'daily') return 'Daily Scripture Challenge';
    if (modeParam === 'survival') return 'Survival Rush Setup';
    if (modeParam === 'blitz') return 'Speed Blitz Setup';
    if (modeParam === 'local') return 'Pass & Play Setup';
    return 'Game Setup';
  };

  return (
    <>
      <NavBar title={getModeTitle()} />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-6">
        {error && (
          <div className="p-4 rounded-xl bg-destructive/10 border border-destructive text-destructive font-semibold text-sm">
            {error}
          </div>
        )}

        {/* Daily Banner */}
        {modeParam === 'daily' && (
          <Card className="border-2 border-amber-500/40 bg-amber-500/10">
            <CardHeader className="flex flex-row items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-500/20 text-amber-500 flex items-center justify-center shrink-0">
                <Calendar className="w-6 h-6" />
              </div>
              <div>
                <CardTitle className="text-lg font-extrabold text-foreground">
                  Today&apos;s Scripture Challenge
                </CardTitle>
                <CardDescription>
                  5 curated questions covering both Testaments. Everyone receives the exact same questions today.
                </CardDescription>
                {getDailyStreak() > 0 && (
                  <Badge variant="gold" className="mt-2 font-bold">
                    🔥 {getDailyStreak()} Day Active Streak
                  </Badge>
                )}
              </div>
            </CardHeader>
          </Card>
        )}

        {/* Survival Banner */}
        {modeParam === 'survival' && (
          <Card className="border-2 border-destructive/40 bg-destructive/10">
            <CardHeader className="flex flex-row items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-destructive/20 text-destructive flex items-center justify-center shrink-0">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <CardTitle className="text-lg font-extrabold text-foreground">
                  Faith Walk: Survival Rush
                </CardTitle>
                <CardDescription>
                  You start with <strong>3 Lives (❤️❤️❤️)</strong> and <strong>15 seconds</strong> per question. Each mistake costs a life. How far will your knowledge carry you?
                </CardDescription>
              </div>
            </CardHeader>
          </Card>
        )}

        {/* Blitz Banner */}
        {modeParam === 'blitz' && (
          <Card className="border-2 border-amber-500/40 bg-amber-500/10">
            <CardHeader className="flex flex-row items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-500/20 text-amber-500 flex items-center justify-center shrink-0">
                <Zap className="w-6 h-6" />
              </div>
              <div>
                <CardTitle className="text-lg font-extrabold text-foreground">
                  Speed Blitz: 60-Second Challenge
                </CardTitle>
                <CardDescription>
                  Answer as many Scripture questions as possible before the 60-second total countdown clock expires!
                </CardDescription>
              </div>
            </CardHeader>
          </Card>
        )}

        {/* Player Name */}
        {modeParam !== 'local' && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold">Player Name</CardTitle>
            </CardHeader>
            <CardContent>
              <Input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder={state.user?.username || "Enter your name"}
              />
            </CardContent>
          </Card>
        )}

        {/* Local Multiplayer: Number of players & names */}
        {modeParam === 'local' && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" />
                Number of Players (Pass &amp; Play)
              </CardTitle>
              <CardDescription>Select group size for your local match</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {[2, 3, 4, 5, 6, 7, 8].map(num => (
                  <Button
                    key={num}
                    variant={playerCount === num ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handlePlayerCountChange(num)}
                    className="font-bold"
                  >
                    {num} Players
                  </Button>
                ))}
              </div>

              <div className="space-y-2 pt-2">
                <span className="text-xs font-bold text-muted-foreground uppercase">Player Names</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {playerNames.map((name, index) => (
                    <Input
                      key={index}
                      type="text"
                      value={name}
                      onChange={(e) => {
                        const newNames = [...playerNames];
                        newNames[index] = e.target.value;
                        setPlayerNames(newNames);
                      }}
                      placeholder={`Player ${index + 1}`}
                    />
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Solo / Local Options */}
        {(modeParam === 'solo' || modeParam === 'local') && (
          <>
            {/* Question Count */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-bold">Number of Questions</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap items-center gap-2">
                {[5, 10, 20, 30, 50].map(num => (
                  <Button
                    key={num}
                    variant={questionCount === num && !customCount ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => {
                      sound.playClick();
                      setQuestionCount(num);
                      setCustomCount('');
                    }}
                    className="font-bold"
                  >
                    {num} Questions
                  </Button>
                ))}
                <Input
                  type="number"
                  placeholder="Custom"
                  value={customCount}
                  onChange={(e) => setCustomCount(e.target.value)}
                  min="1"
                  max="100"
                  className="w-24 text-center font-bold"
                />
              </CardContent>
            </Card>

            {/* Timer per question */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-bold">Timer per Question</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                {[
                  { label: '10s (Fast)', val: 10 },
                  { label: '15s (Standard)', val: 15 },
                  { label: '20s (Relaxed)', val: 20 },
                  { label: '30s (Thoughtful)', val: 30 },
                  { label: '♾️ Untimed', val: 0 }
                ].map(t => (
                  <Button
                    key={t.val}
                    variant={timePerQuestion === t.val ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => {
                      sound.playClick();
                      setTimePerQuestion(t.val);
                    }}
                    className="font-bold"
                  >
                    {t.label}
                  </Button>
                ))}
              </CardContent>
            </Card>

            {/* Filters Section */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <div>
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <SlidersHorizontal className="w-4 h-4 text-primary" />
                    Scripture Scope &amp; Filters
                  </CardTitle>
                  <CardDescription>Tailor questions to specific biblical books or topics</CardDescription>
                </div>
                <Badge variant="outline" className="font-semibold text-xs">
                  {unseenCount} unseen
                </Badge>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-muted-foreground uppercase mb-1.5 block">Testament</label>
                    <select
                      value={filters.testament}
                      onChange={(e) => setFilters({ ...filters, testament: e.target.value })}
                      className="w-full h-11 px-3 rounded-lg border border-input bg-background text-sm font-semibold text-foreground focus:ring-2 focus:ring-ring"
                    >
                      <option value="all">All Testaments (Old &amp; New)</option>
                      <option value="Old">Old Testament Only</option>
                      <option value="New">New Testament Only</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-muted-foreground uppercase mb-1.5 block">Difficulty</label>
                    <select
                      value={filters.difficulty}
                      onChange={(e) => setFilters({ ...filters, difficulty: e.target.value })}
                      className="w-full h-11 px-3 rounded-lg border border-input bg-background text-sm font-semibold text-foreground focus:ring-2 focus:ring-ring"
                    >
                      <option value="all">All Difficulties</option>
                      <option value="Easy">Easy</option>
                      <option value="Medium">Medium</option>
                      <option value="Hard">Hard</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-muted-foreground uppercase mb-1.5 block">Category</label>
                    <select
                      value={filters.category}
                      onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                      className="w-full h-11 px-3 rounded-lg border border-input bg-background text-sm font-semibold text-foreground focus:ring-2 focus:ring-ring"
                    >
                      <option value="all">All Categories</option>
                      {categories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-muted-foreground uppercase mb-1.5 block">Specific Book</label>
                    <select
                      value={filters.book}
                      onChange={(e) => setFilters({ ...filters, book: e.target.value })}
                      className="w-full h-11 px-3 rounded-lg border border-input bg-background text-sm font-semibold text-foreground focus:ring-2 focus:ring-ring"
                    >
                      <option value="all">All 66 Books</option>
                      {books.map(book => (
                        <option key={book} value={book}>{book}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {seenCount > 0 && (
                  <div className="pt-2 flex justify-end" key={resetKey}>
                    <Button variant="ghost" size="sm" onClick={handleResetSeen} className="gap-1.5 text-xs text-muted-foreground">
                      <RotateCcw className="w-3.5 h-3.5" />
                      Reset Seen History ({seenCount} answered)
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}

        {/* Start Game Action */}
        <div className="flex items-center justify-between pt-4">
          <Button variant="outline" size="lg" onClick={() => navigate('/')} className="gap-1.5 font-bold">
            <ChevronLeft className="w-4 h-4" />
            Home
          </Button>

          <Button variant="default" size="lg" onClick={handleStart} className="gap-2 font-extrabold px-8 shadow-md">
            <Sparkles className="w-4 h-4 text-amber-400" />
            Begin Trivia Game
          </Button>
        </div>
      </main>
    </>
  );
}
