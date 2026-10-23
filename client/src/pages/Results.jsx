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
import { getLocalizedQuestion, t } from '../utils/translations';
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
  const [reviewFilter, setReviewFilter] = useState('all'); // 'all', 'missed', 'correct'
  const [newlyUnlockedAchievements, setNewlyUnlockedAchievements] = useState([]);

  const calculateStats = (playerId) => {
    let correct = 0;
    let total = 0;
    let totalTime = 0;
    const missedQuestions = [];
    const allQuestions = [];

    Object.keys(state.answers).forEach(questionIndex => {
      const answer = state.answers[questionIndex][playerId];
      if (answer) {
        total++;
        const question = state.questions[questionIndex];
        if (question) {
          const locQ = getLocalizedQuestion(question, state.language || 'en');
          const isCorrect = !!answer.isCorrect;
          if (isCorrect) correct++;

          const reviewItem = {
            questionIndex: Number(questionIndex) + 1,
            question: cleanText(locQ.question),
            yourAnswer: cleanText(locQ.options[answer.answer] || (state.language === 'am' ? "ጊዜው አልቋል!" : "Time's up!")),
            correctAnswer: cleanText(locQ.options[question.correctAnswer]),
            isCorrect,
            book: cleanText(locQ.book),
            testament: locQ.testament,
            verse: getScriptureVerse(locQ),
            story: getScriptureStory(locQ)
          };

          allQuestions.push(reviewItem);
          if (!isCorrect) {
            missedQuestions.push(reviewItem);
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
      missedQuestions,
      allQuestions
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

  const { socket, rematchRoom } = useSocket();
  const [isRematching, setIsRematching] = useState(false);

  const activeRoomCode = state.roomCode || state.room?.code;
  const isOnlineRoom = Boolean(activeRoomCode);
  const isHost = Boolean(state.room ? state.room.host === socket?.id : state.isHost);

  // Synchronize returning to the ready lobby across all players in the room
  useEffect(() => {
    if (!socket || !activeRoomCode) return;

    const handleReturnToLobby = (room) => {
      sound.playClick();
      dispatch({ type: 'RESET_FOR_REMATCH' });
      if (room) {
        dispatch({ type: 'SET_ROOM', payload: room });
        if (room.players) {
          dispatch({ type: 'SET_PLAYERS', payload: room.players });
        }
      }
      navigate('/online');
    };

    socket.on('return-to-lobby', handleReturnToLobby);
    socket.on('rematch-started', handleReturnToLobby);

    const handleRoomUpdated = (room) => {
      if (room && room.gameState === 'lobby') {
        handleReturnToLobby(room);
      }
    };
    socket.on('room-updated', handleRoomUpdated);

    return () => {
      socket.off('return-to-lobby', handleReturnToLobby);
      socket.off('rematch-started', handleReturnToLobby);
      socket.off('room-updated', handleRoomUpdated);
    };
  }, [socket, activeRoomCode, dispatch, navigate]);

  const handleRematch = async () => {
    sound.playClick();
    if (activeRoomCode) {
      setIsRematching(true);
      try {
        await rematchRoom(activeRoomCode);
      } catch (err) {
        console.error('Failed to trigger rematch', err);
      }
    }
    dispatch({ type: 'RESET_FOR_REMATCH' });
    navigate('/online');
  };

  const handlePlayAgain = async () => {
    sound.playClick();
    // In online multiplayer rooms, both Play Again and Rematch send the whole room back to the ready page
    if (isOnlineRoom) {
      await handleRematch();
      return;
    }
    dispatch({ type: 'RESET_GAME' });
    navigate(`/settings?mode=${state.mode || 'solo'}`);
  };

  const handleLeaveRoom = () => {
    sound.playClick();
    if (socket && activeRoomCode) {
      socket.emit('leave-room', { roomCode: activeRoomCode });
    }
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
          <div className="w-14 h-14 rounded-xl bg-secondary border border-border flex items-center justify-center text-gold-dark dark:text-gold mx-auto shadow-sm">
            <Trophy className="w-7 h-7" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-serif font-black tracking-tight text-foreground">
            {firstStats && firstStats.accuracy === 100
              ? (state.language === 'am' ? 'ፍጹም ዕውቀት! 100%' : 'Flawless Knowledge!')
              : firstStats && firstStats.accuracy >= 70
              ? (state.language === 'am' ? 'መልካም ታማኝ አገልጋይ!' : 'Well Done, Good & Faithful!')
              : (state.language === 'am' ? 'ጨዋታው ተጠናቋል!' : 'Game Complete!')}
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base max-w-lg mx-auto">
            {state.mode === 'daily'
              ? (state.language === 'am' ? 'የዛሬውን የዕለት ቃል ተግዳሮት በክብር አጠናቀዋል! የዕለት ተከታታይዎ ተጠብቋል።' : "Glorious work completing today's Scripture Challenge! Your daily streak has been preserved.")
              : state.mode === 'survival'
              ? (state.language === 'am' ? `በሕይወት ተግዳሮት ${firstStats?.total || 0} ጥያቄዎችን በተሳካ ሁኔታ ተጋፍጠዋል።` : `End of the road! You held your ground through ${firstStats?.total || 0} questions.`)
              : (state.language === 'am' ? 'በእግዚአብሔር ቃል ላይ በቀንም በሌሊትም ማሰላሰልዎን ይቀጥሉ።' : 'Continue meditating on the Word of God day and night.')}
          </p>
        </div>

        {/* Newly Unlocked Achievements */}
        {newlyUnlockedAchievements.length > 0 && (
          <div className="p-5 rounded-2xl border-2 border-amber-500 bg-amber-500/10 space-y-3 animate-in fade-in duration-300">
            <h3 className="font-extrabold text-amber-600 dark:text-amber-400 text-sm uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-4 h-4" />
              {state.language === 'am' ? 'አዲስ የመጽሐፍ ቅዱስ ሽልማት ተከፍቷል!' : 'New Scripture Achievements Unlocked!'}
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
            <Card className="text-center p-5 space-y-1 border border-border shadow-sm">
              <span className="text-xs uppercase font-bold text-muted-foreground">{t('correctAnswers', state.language)}</span>
              <p className="text-3xl font-bold font-serif text-emerald-700 dark:text-emerald-400">{firstStats?.correct}</p>
              <span className="text-[11px] text-muted-foreground">{state.language === 'am' ? 'መልሶች' : 'Answers'}</span>
            </Card>
            <Card className="text-center p-5 space-y-1 border border-border shadow-sm">
              <span className="text-xs uppercase font-bold text-muted-foreground">{t('incorrectAnswers', state.language)}</span>
              <p className="text-3xl font-bold font-serif text-red-700 dark:text-red-400">{(firstStats?.total || 0) - (firstStats?.correct || 0)}</p>
              <span className="text-[11px] text-muted-foreground">{state.language === 'am' ? 'መልሶች' : 'Answers'}</span>
            </Card>
            <Card className="text-center p-5 space-y-1 border border-border shadow-sm">
              <span className="text-xs uppercase font-bold text-muted-foreground">{t('accuracy', state.language)}</span>
              <p className="text-3xl font-bold font-serif text-foreground">{firstStats?.accuracy}%</p>
              <span className="text-[11px] text-muted-foreground">{t('score', state.language)}</span>
            </Card>
            <Card className="text-center p-5 space-y-1 border border-border shadow-sm">
              <span className="text-xs uppercase font-bold text-muted-foreground">{t('avgSpeed', state.language)}</span>
              <p className="text-3xl font-bold font-serif text-gold-dark dark:text-gold">{firstStats?.avgTime}s</p>
              <span className="text-[11px] text-muted-foreground">{state.language === 'am' ? 'በጥያቄ' : 'Per question'}</span>
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
                  <div className="p-5 rounded-xl border border-border bg-secondary text-center shadow-sm">
                    <h2 className="text-2xl font-bold font-serif text-foreground">
                      {isTie ? "🤝 It's a Tie!" : `🏆 ${winner.name} Wins the Match!`}
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

        {/* Online Room Rematch Banner */}
        {isOnlineRoom && (
          <div className="text-center p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 max-w-lg mx-auto space-y-1">
            <p className="text-xs sm:text-sm font-semibold text-amber-600 dark:text-amber-400">
              {isHost ? t('hostRematchBanner', state.language) : t('guestRematchBanner', state.language)}
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Button
            variant={isOnlineRoom ? 'gold' : 'default'}
            size="lg"
            onClick={handlePlayAgain}
            disabled={isRematching}
            className="gap-2 font-bold shadow-sm"
          >
            <RotateCcw className="w-4 h-4" />
            {isRematching
              ? (state.language === 'am' ? 'ወደ ዝግጅት ገጽ በመመለስ ላይ...' : 'Returning to Ready Room...')
              : isOnlineRoom
              ? (state.language === 'am' ? 'እንደገና ተጫወት (ወደ ዝግጅት ገጽ)' : 'Play Again (Ready Page)')
              : (state.language === 'am' ? 'እንደገና ተጫወት' : 'Play Again')}
          </Button>

          <Button variant="secondary" size="lg" onClick={handleShare} className="gap-2 font-bold">
            <Share2 className="w-4 h-4" />
            {t('shareResults', state.language)}
          </Button>

          {isOnlineRoom && (
            <>
              <Button
                variant="default"
                size="lg"
                onClick={handleRematch}
                disabled={isRematching}
                className="gap-2 font-bold shadow-sm"
              >
                <Swords className="w-4 h-4" />
                {isRematching
                  ? (state.language === 'am' ? 'በመመለስ ላይ...' : 'Returning...')
                  : (state.language === 'am' ? 'እንደገና ግጠም' : 'Rematch')}
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={handleLeaveRoom}
                className="gap-2 font-bold text-destructive hover:text-destructive"
              >
                <LogOut className="w-4 h-4" />
                {t('leaveRoom', state.language)}
              </Button>
            </>
          )}

          <Button variant="outline" size="lg" onClick={() => navigate('/leaderboard')} className="gap-2 font-bold">
            <Trophy className="w-4 h-4 text-amber-500" />
            {t('leaderboardBtn', state.language)}
          </Button>

          <Button
            variant="ghost"
            size="lg"
            onClick={() => setShowReview(!showReview)}
            className="gap-2 font-bold"
          >
            <BookOpen className="w-4 h-4" />
            {showReview
              ? (state.language === 'am' ? 'ታሪኮችን ደብቅ' : 'Hide Scripture Stories')
              : (state.language === 'am' ? 'የመጽሐፍ ቅዱስ ታሪኮችን አንብብ' : 'Read Scripture Stories')}
          </Button>
        </div>

        {/* Scripture Review & Study Stories */}
        {showReview && (
          <div className="space-y-4 pt-6 border-t border-border">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-amber-500" />
                  <h3 className="text-xl font-extrabold text-foreground">
                    {t('scriptureNotesHeader', state.language)}
                  </h3>
                </div>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {t('scriptureNotesSub', state.language)}
                </p>
              </div>

              {/* Review Filter Pills */}
              {firstStats && firstStats.allQuestions && firstStats.allQuestions.length > 0 && (
                <div className="flex items-center gap-1.5 p-1 bg-muted/60 border rounded-xl self-start sm:self-auto">
                  <Button
                    type="button"
                    variant={reviewFilter === 'all' ? 'gold' : 'ghost'}
                    size="sm"
                    className="h-8 px-3 text-xs font-bold"
                    onClick={() => setReviewFilter('all')}
                  >
                    {t('reviewFilterAll', state.language)} ({firstStats.allQuestions.length})
                  </Button>
                  <Button
                    type="button"
                    variant={reviewFilter === 'missed' ? 'destructive' : 'ghost'}
                    size="sm"
                    className="h-8 px-3 text-xs font-bold"
                    onClick={() => setReviewFilter('missed')}
                  >
                    {t('reviewFilterMissed', state.language)} ({firstStats.missedQuestions.length})
                  </Button>
                  <Button
                    type="button"
                    variant={reviewFilter === 'correct' ? 'secondary' : 'ghost'}
                    size="sm"
                    className="h-8 px-3 text-xs font-bold text-emerald-600 dark:text-emerald-400"
                    onClick={() => setReviewFilter('correct')}
                  >
                    {t('reviewFilterCorrect', state.language)} ({firstStats.correct})
                  </Button>
                </div>
              )}
            </div>

            {(() => {
              const displayed = reviewFilter === 'missed'
                ? (firstStats?.missedQuestions || [])
                : reviewFilter === 'correct'
                ? ((firstStats?.allQuestions || []).filter(q => q.isCorrect))
                : (firstStats?.allQuestions || []);

              if (displayed.length === 0) {
                return (
                  <Card className="p-8 text-center bg-card/60 border-border/70">
                    <p className="text-sm text-muted-foreground">
                      {reviewFilter === 'missed'
                        ? (state.language === 'am' ? 'ምንም የተሳሳቱ ጥያቄዎች የሉም! ሁሉንም በትክክል መልሰዋል።' : 'No missed questions! You answered everything correctly.')
                        : (state.language === 'am' ? 'ምንም የሚገመገሙ ጥያቄዎች የሉም።' : 'No questions found in this category.')}
                    </p>
                  </Card>
                );
              }

              return displayed.map((item, idx) => (
                <Card key={idx} className="overflow-hidden border-border/80">
                  <CardHeader className="p-5 pb-3 bg-muted/30">
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-extrabold uppercase text-muted-foreground">
                          {state.language === 'am' ? 'የጥያቄ ቁጥር' : 'Question'} #{item.questionIndex}
                        </span>
                        {item.isCorrect ? (
                          <Badge className="bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/40 text-[11px] gap-1 font-bold">
                            <CheckCircle2 className="w-3.5 h-3.5" /> {t('statusCorrect', state.language)}
                          </Badge>
                        ) : (
                          <Badge className="bg-destructive/20 text-destructive border-destructive/40 text-[11px] gap-1 font-bold">
                            <XCircle className="w-3.5 h-3.5" /> {t('statusIncorrect', state.language)}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="gold">{item.book}</Badge>
                        <Badge variant="outline" className="font-mono text-xs font-semibold">
                          📖 {item.verse}
                        </Badge>
                      </div>
                    </div>
                    <CardTitle className="text-base sm:text-lg font-bold text-foreground">
                      {item.question}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-5 pt-3 space-y-3">
                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-6 text-sm">
                      <div className={`flex items-center gap-1.5 font-semibold ${item.isCorrect ? 'text-emerald-600 dark:text-emerald-400' : 'text-destructive'}`}>
                        {item.isCorrect ? (
                          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
                        ) : (
                          <XCircle className="w-4 h-4 shrink-0 text-destructive" />
                        )}
                        <span>{t('yourAnswer', state.language)}: {item.yourAnswer}</span>
                      </div>
                      {!item.isCorrect && (
                        <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold">
                          <CheckCircle2 className="w-4 h-4 shrink-0" />
                          <span>{t('correctAnswerLabel', state.language)}: {item.correctAnswer}</span>
                        </div>
                      )}
                    </div>

                    <div className="p-4 rounded-xl bg-card border border-border/80 text-sm text-muted-foreground leading-relaxed">
                      <strong className="block text-amber-600 dark:text-amber-400 font-bold text-xs uppercase tracking-wider mb-1">
                        📖 {t('scriptureStoryHeader', state.language)}
                      </strong>
                      {item.story}
                    </div>
                  </CardContent>
                </Card>
              ));
            })()}
          </div>
        )}
      </main>
    </>
  );
}
