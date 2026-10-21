import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../context/GameContext';
import { useSocket } from '../hooks/useSocket';
import { saveGameResult, isAuthenticated } from '../api';
import { addSeenQuestionIds } from '../utils/seenQuestions';
import { addHeadToHeadMatch } from '../utils/headToHeadHistory';
import { fireConfetti } from '../utils/confetti';
import { sound } from '../utils/audio';
import { checkAchievements } from '../utils/achievements';
import { recordDailyCompletion } from '../utils/dailyChallenge';
import { cleanText, getScriptureVerse, getScriptureStory } from '../utils/scriptureHelper';
import NavBar from '../components/NavBar';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import {
  Trophy,
  CheckCircle2,
  XCircle,
  Share2,
  RotateCcw,
  BookOpen,
  Sparkles,
  Swords,
  LogOut
} from 'lucide-react';

export default function Results() {
  const navigate = useNavigate();
  const { state, dispatch } = useGame();
  const hasSavedRef = useRef(false);
  const [showReview, setShowReview] = useState(true);
  const [newlyUnlockedAchievements, setNewlyUnlockedAchievements] = useState([]);

  const calculateStats = (playerId) => {
    let correct = 0;
    let total = 0;
    let totalTime = 0;
    const missedQuestions = [];

    Object.keys(state.answers).forEach(questionIndex => {
      const answer = state.answers[questionIndex][playerId];
      if (answer) {
        total++;
        if (answer.isCorrect) correct++;
        else {
          const question = state.questions[questionIndex];
          if (question) {
            missedQuestions.push({
              question: cleanText(question.question),
              yourAnswer: cleanText(question.options[answer.answer] || "Time's up!"),
              correctAnswer: cleanText(question.options[question.correctAnswer]),
              book: cleanText(question.book),
              testament: question.testament,
              verse: getScriptureVerse(question),
              story: getScriptureStory(question)
            });
          }
        }
        totalTime += answer.timeSpent || 0;
      }
    });

    return {
      correct,
      total,
      accuracy: total > 0 ? Math.round((correct / total) * 100) : 0,
      avgTime: total > 0 ? Math.round(totalTime / total) : 0,
      totalTime,
      missedQuestions
    };
  };

  useEffect(() => {
    if (hasSavedRef.current) return;
    if (state.gameOver && state.players.length > 0) {
      hasSavedRef.current = true;

      const firstPlayerStats = calculateStats(state.players[0].id);

      if (firstPlayerStats.accuracy >= 70 || firstPlayerStats.correct >= 5) {
        fireConfetti();
        sound.playVictory();
      }

      if (state.mode === 'daily') {
        recordDailyCompletion(firstPlayerStats.correct, firstPlayerStats.total);
      }

      const questionIds = state.questions.map(q => q.id);
      addSeenQuestionIds(questionIds);

      const isMultiWinner = state.players.length > 1 &&
        calculateStats(state.players[0].id).correct >= calculateStats(state.players[1]?.id || '').correct;

      const unlocked = checkAchievements({
        gameCompleted: true,
        correct: firstPlayerStats.correct,
        total: firstPlayerStats.total,
        mode: state.mode,
        maxStreak: state.maxStreak,
        isMultiplayerWinner: isMultiWinner
      });
      if (unlocked.length > 0) {
        setNewlyUnlockedAchievements(unlocked);
      }

      if (isAuthenticated()) {
        state.players.forEach(player => {
          const stats = calculateStats(player.id);
          saveGameResult({
            mode: state.mode || 'solo',
            score: stats.correct,
            totalQuestions: stats.total,
            correctAnswers: stats.correct,
            accuracy: stats.accuracy,
            timeTaken: stats.totalTime,
            difficulty: state.settings?.filters?.difficulty || 'all',
            filters: state.settings?.filters || {}
          }).catch(console.error);
        });
      }

      if (state.players.length === 2) {
        const [playerA, playerB] = state.players;
        const statsA = calculateStats(playerA.id);
        const statsB = calculateStats(playerB.id);
        const match = {
          date: new Date().toLocaleDateString(),
          playerA: playerA.name,
          playerB: playerB.name,
          scoreA: statsA.correct,
          scoreB: statsB.correct
        };
        addHeadToHeadMatch(match);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.gameOver]);

  const { rematchRoom } = useSocket();

  const handlePlayAgain = () => {
    sound.playClick();
    dispatch({ type: 'RESET_GAME' });
    navigate(`/settings?mode=${state.mode || 'solo'}`);
  };

  const handleRematch = async () => {
    sound.playClick();
    if (state.roomCode) {
      await rematchRoom(state.roomCode);
    }
    dispatch({ type: 'RESET_FOR_REMATCH' });
    navigate('/online');
  };

  const handleLeaveRoom = () => {
    sound.playClick();
    dispatch({ type: 'RESET_GAME' });
    navigate('/');
  };

  const handleShare = () => {
    sound.playClick();
    const stats = calculateStats(state.players[0].id);
    const text = `📖 Bible Trivia Challenge: I scored ${stats.correct}/${stats.total} (${stats.accuracy}%) in ${state.mode || 'solo'} mode! Can you beat my Scripture knowledge?`;
    
    if (navigator.share) {
      navigator.share({ title: 'Bible Trivia Results', text });
    } else {
      navigator.clipboard.writeText(text);
      alert('Results copied to clipboard!');
    }
  };

  const firstStats = state.players.length > 0 ? calculateStats(state.players[0].id) : null;

  return (
    <>
      <NavBar title="Game Results" />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8">
        {/* Victory Header */}
        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500 mx-auto shadow-sm">
            <Trophy className="w-8 h-8 text-amber-500" />
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-foreground">
            {firstStats && firstStats.accuracy === 100
              ? 'Flawless Knowledge!'
              : firstStats && firstStats.accuracy >= 70
              ? 'Well Done, Good & Faithful!'
              : 'Game Complete!'}
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base max-w-lg mx-auto">
            {state.mode === 'daily'
              ? "Glorious work completing today's Scripture Challenge! Your daily streak has been preserved."
              : state.mode === 'survival'
              ? `End of the road! You held your ground through ${firstStats?.total || 0} questions.`
              : 'Continue meditating on the Word of God day and night.'}
          </p>
        </div>

        {/* Newly Unlocked Achievements */}
        {newlyUnlockedAchievements.length > 0 && (
          <div className="p-5 rounded-2xl border-2 border-amber-500 bg-amber-500/10 space-y-3 animate-in fade-in duration-300">
            <h3 className="font-extrabold text-amber-600 dark:text-amber-400 text-sm uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-4 h-4" />
              New Scripture Achievements Unlocked!
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {newlyUnlockedAchievements.map(ach => (
                <div key={ach.id} className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border shadow-sm">
                  <span className="text-3xl">{ach.icon}</span>
                  <div>
                    <h4 className="font-bold text-sm text-foreground">{ach.title}</h4>
                    <p className="text-xs text-muted-foreground">{ach.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Primary Stats Grid */}
        {state.players.length === 1 ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Card className="text-center p-5 space-y-1">
              <span className="text-xs uppercase font-extrabold text-muted-foreground">Correct</span>
              <p className="text-3xl font-extrabold text-emerald-500">{firstStats?.correct}</p>
              <span className="text-[11px] text-muted-foreground">Answers</span>
            </Card>
            <Card className="text-center p-5 space-y-1">
              <span className="text-xs uppercase font-extrabold text-muted-foreground">Incorrect</span>
              <p className="text-3xl font-extrabold text-destructive">{(firstStats?.total || 0) - (firstStats?.correct || 0)}</p>
              <span className="text-[11px] text-muted-foreground">Answers</span>
            </Card>
            <Card className="text-center p-5 space-y-1">
              <span className="text-xs uppercase font-extrabold text-muted-foreground">Accuracy</span>
              <p className="text-3xl font-extrabold text-primary">{firstStats?.accuracy}%</p>
              <span className="text-[11px] text-muted-foreground">Score</span>
            </Card>
            <Card className="text-center p-5 space-y-1">
              <span className="text-xs uppercase font-extrabold text-muted-foreground">Avg Speed</span>
              <p className="text-3xl font-extrabold text-amber-500">{firstStats?.avgTime}s</p>
              <span className="text-[11px] text-muted-foreground">Per question</span>
            </Card>
          </div>
        ) : (
          <div className="space-y-4">
            {(() => {
              const sortedPlayers = [...state.players].sort((a, b) => {
                const statsA = calculateStats(a.id);
                const statsB = calculateStats(b.id);
                return statsB.correct - statsA.correct;
              });
              const winner = sortedPlayers[0];
              const isTie = sortedPlayers.length > 1 &&
                calculateStats(sortedPlayers[0].id).correct === calculateStats(sortedPlayers[1].id).correct;

              return (
                <>
                  <div className="p-5 rounded-2xl border-2 border-amber-500 bg-gradient-to-r from-amber-500/15 via-card to-amber-500/15 text-center shadow-md">
                    <h2 className="text-2xl font-extrabold text-amber-500">
                      {isTie ? "🤝 It's a Tie!" : `🏆 ${winner.name} Wins the Fellowship Match!`}
                    </h2>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {state.players.map(player => {
                      const stats = calculateStats(player.id);
                      return (
                        <Card key={player.id} className="p-5 space-y-3">
                          <div className="flex items-center justify-between border-b border-border/60 pb-2">
                            <h4 className="font-extrabold text-foreground">{player.name}</h4>
                            <Badge variant="outline">{stats.accuracy}% acc</Badge>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Score:</span>
                            <span className="font-bold text-primary">{stats.correct} / {stats.total}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Avg Speed:</span>
                            <span className="font-semibold">{stats.avgTime}s</span>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                </>
              );
            })()}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Button variant="default" size="lg" onClick={handlePlayAgain} className="gap-2 font-bold">
            <RotateCcw className="w-4 h-4" />
            Play Again
          </Button>

          <Button variant="secondary" size="lg" onClick={handleShare} className="gap-2 font-bold">
            <Share2 className="w-4 h-4" />
            Share Results
          </Button>

          {state.players.length > 1 && state.roomCode && (
            <>
              <Button variant="gold" size="lg" onClick={handleRematch} className="gap-2 font-bold">
                <Swords className="w-4 h-4" />
                Rematch
              </Button>
              <Button variant="outline" size="lg" onClick={handleLeaveRoom} className="gap-2 font-bold">
                <LogOut className="w-4 h-4" />
                Leave Room
              </Button>
            </>
          )}

          <Button variant="outline" size="lg" onClick={() => navigate('/leaderboard')} className="gap-2 font-bold">
            <Trophy className="w-4 h-4 text-amber-500" />
            Leaderboard
          </Button>

          <Button
            variant="ghost"
            size="lg"
            onClick={() => setShowReview(!showReview)}
            className="gap-2 font-bold"
          >
            <BookOpen className="w-4 h-4" />
            {showReview ? 'Hide Scripture Stories' : 'Read Scripture Stories'}
          </Button>
        </div>

        {/* Scripture Review & Study Stories */}
        {showReview && (
          <div className="space-y-4 pt-6 border-t border-border">
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-amber-500" />
              <h3 className="text-xl font-extrabold text-foreground">
                Scripture Stories &amp; Study Notes
              </h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Deepen your biblical literacy with the exact verses and narratives behind the questions answered.
            </p>

            {firstStats && firstStats.missedQuestions.length === 0 ? (
              <Card className="p-8 text-center bg-emerald-500/10 border-emerald-500/30">
                <div className="space-y-2">
                  <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
                  <h4 className="text-lg font-extrabold text-foreground">Perfection! All Answers Correct</h4>
                  <p className="text-sm text-muted-foreground max-w-md mx-auto">
                    You answered every Scripture question correctly. May the Word of God continue to dwell in you richly!
                  </p>
                </div>
              </Card>
            ) : (
              firstStats?.missedQuestions.map((item, idx) => (
                <Card key={idx} className="overflow-hidden border-border/80">
                  <CardHeader className="p-5 pb-3 bg-muted/30">
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                      <span className="text-xs font-extrabold uppercase text-muted-foreground">
                        Question Review #{idx + 1}
                      </span>
                      <div className="flex items-center gap-2">
                        <Badge variant="gold">{item.book}</Badge>
                        <Badge variant="outline">Scripture: {item.verse}</Badge>
                      </div>
                    </div>
                    <CardTitle className="text-base sm:text-lg font-bold text-foreground">
                      {item.question}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-5 pt-3 space-y-3">
                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-6 text-sm">
                      <div className="flex items-center gap-1.5 text-destructive font-semibold">
                        <XCircle className="w-4 h-4 shrink-0" />
                        <span>Your answer: {item.yourAnswer}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold">
                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                        <span>Correct answer: {item.correctAnswer}</span>
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-card border border-border/80 text-sm text-muted-foreground leading-relaxed">
                      <strong className="block text-amber-600 dark:text-amber-400 font-bold text-xs uppercase tracking-wider mb-1">
                        📖 Biblical Story &amp; Context
                      </strong>
                      {item.story}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}
      </main>
    </>
  );
}
