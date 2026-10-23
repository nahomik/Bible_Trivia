import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../context/GameContext';
import { useTimer } from '../hooks/useTimer';
import { useSocket } from '../hooks/useSocket';
import Timer from '../components/Timer';
import QuestionCard from '../components/QuestionCard';
import NavBar from '../components/NavBar';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { sound } from '../utils/audio';
import { checkAchievements } from '../utils/achievements';
import {
  Flame,
  Heart,
  Scissors,
  Clock,
  Sparkles,
  CheckCircle2,
  XCircle,
  Smartphone,
  Users,
  Trophy,
  ArrowRight,
  Loader2
} from 'lucide-react';
import './GamePlay.css';

export default function GamePlay() {
  const navigate = useNavigate();
  const { state, dispatch } = useGame();
  const { socket, submitAnswer } = useSocket();
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [answeredCount, setAnsweredCount] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [totalTime, setTotalTime] = useState(0);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [waitingForOpponent, setWaitingForOpponent] = useState(false);
  const [reviewingAnswer, setReviewingAnswer] = useState(false);
  const [showPassScreen, setShowPassScreen] = useState(false);

  const isMultiplayer = state.players.length > 1 && !!state.roomCode;
  const isLocalMultiplayer = state.players.length > 1 && !state.roomCode;
  const isSurvival = state.mode === 'survival';
  const isBlitz = state.mode === 'blitz';

  const stateRef = useRef(state);
  stateRef.current = state;

  const handleAnswerRef = useRef(null);

  const handleTimeUp = useCallback(() => {
    const s = stateRef.current;
    if (!s.gameOver && s.gameStarted && handleAnswerRef.current) {
      handleAnswerRef.current(-1);
    }
  }, []);

  const timerDuration = isBlitz ? 60 : (state.timePerQuestion || state.settings?.timePerQuestion || 20);
  const { timeLeft, start, stop, reset, addTime } = useTimer(timerDuration, handleTimeUp);

  useEffect(() => {
    if (state.gameOver) {
      navigate('/results');
    }
  }, [state.gameOver, navigate]);

  // Auto-advance after review in solo and local multiplayer modes
  useEffect(() => {
    if (!reviewingAnswer || isMultiplayer) return;
    const reviewDuration = isBlitz ? 800 : 2400;
    const timer = setTimeout(() => {
      setReviewingAnswer(false);
      setSelectedAnswer(null);
      setHasSubmitted(false);

      if (isSurvival && stateRef.current.lives <= 0) {
        dispatch({ type: 'SET_GAME_OVER' });
        return;
      }

      if (isLocalMultiplayer) {
        dispatch({ type: 'NEXT_PLAYER' });
        setShowPassScreen(true);
        reset();
      } else {
        dispatch({ type: 'NEXT_QUESTION' });
        if (!isBlitz) reset();
      }
    }, reviewDuration);
    return () => clearTimeout(timer);
  }, [reviewingAnswer, isMultiplayer, isLocalMultiplayer, isSurvival, isBlitz, dispatch, reset]);

  // Listen for multiplayer events
  useEffect(() => {
    if (!socket) return;

    const handleQuestionComplete = (data) => {
      const { questionIndex, answers, players } = data;
      dispatch({ type: 'SET_PLAYERS', payload: players });
      if (answers) {
        for (const [playerId, answerData] of Object.entries(answers)) {
          dispatch({
            type: 'RECORD_MULTIPLAYER_ANSWER',
            payload: { questionIndex, playerId, answerData }
          });
        }
      }
      setWaitingForOpponent(false);
      setReviewingAnswer(true);
    };

    const handleNewQuestion = (data) => {
      const { questionIndex } = data;
      dispatch({ type: 'SET_CURRENT_QUESTION', payload: questionIndex });
      setReviewingAnswer(false);
      setSelectedAnswer(null);
      setHasSubmitted(false);
      setWaitingForOpponent(false);
      reset();
      start();
    };

    const handleGameFinished = (data) => {
      const { players } = data;
      dispatch({ type: 'SET_PLAYERS', payload: players });
      dispatch({ type: 'SET_GAME_OVER' });
    };

    socket.on('question-complete', handleQuestionComplete);
    socket.on('new-question', handleNewQuestion);
    socket.on('game-finished', handleGameFinished);

    return () => {
      socket.off('question-complete', handleQuestionComplete);
      socket.off('new-question', handleNewQuestion);
      socket.off('game-finished', handleGameFinished);
    };
  }, [socket, dispatch, reset, start]);

  // Question start timer trigger
  useEffect(() => {
    if (state.gameStarted && state.questions.length > 0 && !showPassScreen) {
      if (!isMultiplayer || state.currentQuestionIndex === 0) {
        if (!isBlitz || state.currentQuestionIndex === 0) {
          reset();
          start();
        }
      }
    }
  }, [state.currentQuestionIndex, state.gameStarted, state.questions.length, isMultiplayer, isBlitz, showPassScreen, reset, start]);

  const handleAnswer = (answerIndex) => {
    if (hasSubmitted) return;

    setHasSubmitted(true);
    if (!isBlitz) stop();
    setSelectedAnswer(answerIndex);

    const question = state.questions[state.currentQuestionIndex];
    if (!question) return;
    const isCorrect = answerIndex === question.correctAnswer;
    const timeSpent = isBlitz ? 1 : Math.max(1, timerDuration - timeLeft);

    if (isCorrect) {
      sound.playCorrect();
    } else {
      sound.playIncorrect();
    }

    if (isMultiplayer) {
      submitAnswer(state.roomCode, state.currentQuestionIndex, answerIndex, timeSpent)
        .then((result) => {
          if (result && result.waiting) {
            setWaitingForOpponent(true);
          }
        })
        .catch(() => {});
      return;
    }

    setAnsweredCount(prev => prev + 1);
    if (isCorrect) setCorrectCount(prev => prev + 1);
    setTotalTime(prev => prev + timeSpent);

    const currentPlayer = state.players[state.currentPlayerIndex];
    dispatch({
      type: 'RECORD_ANSWER',
      payload: {
        questionIndex: state.currentQuestionIndex,
        playerId: currentPlayer.id,
        answer: answerIndex,
        isCorrect,
        timeSpent
      }
    });

    // Check achievement progress
    const newStreak = isCorrect ? state.streak + 1 : 0;
    const unlocked = checkAchievements({
      fastestCorrectTime: isCorrect ? timeSpent : 999,
      maxStreak: newStreak,
      correct: isCorrect ? 1 : 0
    });
    if (unlocked.length > 0) {
      dispatch({ type: 'SET_ACHIEVEMENT_TOAST', payload: unlocked[0] });
      setTimeout(() => dispatch({ type: 'SET_ACHIEVEMENT_TOAST', payload: null }), 4000);
    }

    setReviewingAnswer(true);
  };

  handleAnswerRef.current = handleAnswer;

  // Lifeline handlers
  const handleUseFiftyFifty = () => {
    if (state.lifelines.fiftyFifty || hasSubmitted) return;
    const question = state.questions[state.currentQuestionIndex];
    if (!question) return;

    // Pick 2 wrong indices
    const wrongIndices = question.options
      .map((_, i) => i)
      .filter(i => i !== question.correctAnswer);
    const shuffledWrong = wrongIndices.sort(() => Math.random() - 0.5);
    const toHide = shuffledWrong.slice(0, 2);

    dispatch({
      type: 'USE_LIFELINE',
      payload: { name: 'fiftyFifty', hiddenIndices: toHide }
    });
  };

  const handleUseExtraTime = () => {
    if (state.lifelines.extraTime || hasSubmitted || timerDuration <= 0) return;
    addTime(15);
    dispatch({
      type: 'USE_LIFELINE',
      payload: { name: 'extraTime' }
    });
  };

  const handleUseHint = () => {
    if (state.lifelines.hint || hasSubmitted) return;
    dispatch({
      type: 'USE_LIFELINE',
      payload: { name: 'hint' }
    });
  };

  const handleReadyAfterPass = () => {
    sound.playClick();
    setShowPassScreen(false);
    dispatch({ type: 'NEXT_QUESTION' });
    reset();
    start();
  };

  if (!state.gameStarted || state.questions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <p className="text-muted-foreground font-medium text-lg">Preparing Scripture questions...</p>
      </div>
    );
  }

  // Pass & Play Screen
  if (showPassScreen) {
    const nextPlayer = state.players[state.currentPlayerIndex];
    return (
      <>
        <NavBar title="Pass the Device" />
        <div className="max-w-xl mx-auto px-4 py-8">
          <Card className="border-primary/40 shadow-xl overflow-hidden bg-card/95 backdrop-blur-sm">
            <CardHeader className="text-center pb-2">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-3 shadow-inner">
                <Smartphone className="w-8 h-8" />
              </div>
              <CardTitle className="text-2xl font-serif font-bold text-foreground">
                Pass Device to {nextPlayer?.name}
              </CardTitle>
              <CardDescription className="text-base text-muted-foreground">
                Make sure other players cannot see the screen before starting.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6 pt-4">
              <div className="rounded-xl border bg-muted/40 p-4 space-y-3">
                <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <span>Current Standings</span>
                  <Users className="w-4 h-4" />
                </div>
                <div className="space-y-2">
                  {state.players.map((p, idx) => {
                    let pScore = 0;
                    Object.values(state.answers).forEach(ansMap => {
                      if (ansMap[p.id]?.isCorrect) pScore++;
                    });
                    const isCurrent = idx === state.currentPlayerIndex;
                    return (
                      <div
                        key={p.id}
                        className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                          isCurrent
                            ? 'bg-primary/10 border-primary text-foreground font-semibold shadow-sm'
                            : 'bg-card border-border/60 text-muted-foreground'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-6 text-sm font-mono text-muted-foreground">#{idx + 1}</span>
                          <span className="font-medium text-foreground">{p.name}</span>
                          {isCurrent && (
                            <Badge variant="outline" className="border-primary text-primary text-[10px]">
                              Next Up
                            </Badge>
                          )}
                        </div>
                        <span className="font-bold text-primary">{pScore} pts</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <Button
                variant="gold"
                size="lg"
                className="w-full text-base font-semibold shadow-md py-6"
                onClick={handleReadyAfterPass}
              >
                I&apos;m Ready to Answer <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  const currentQuestion = state.questions[state.currentQuestionIndex];
  const currentPlayer = state.players[state.currentPlayerIndex];

  return (
    <>
      <NavBar />
      <div className="max-w-4xl mx-auto px-4 py-6 flex flex-col min-h-[calc(100vh-80px)]">
        {/* Game Header Bar */}
        <Card className="mb-4 bg-card border border-border shadow-sm">
          <CardContent className="p-4 flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-col gap-1">
              {isLocalMultiplayer && (
                <div className="flex items-center gap-2">
                  <span className="text-xs uppercase tracking-wider text-muted-foreground">Current Turn:</span>
                  <Badge variant="secondary" className="font-bold">
                    {currentPlayer?.name}
                  </Badge>
                </div>
              )}
              
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-sm sm:text-base font-semibold text-foreground">
                  Question <span className="font-bold font-mono text-gold-dark dark:text-gold">{state.currentQuestionIndex + 1}</span> of{' '}
                  <span className="font-mono">{state.questions.length}</span>
                </span>
                {state.streak >= 2 && (
                  <Badge variant="gold" className="gap-1 font-bold">
                    <Flame className="w-3.5 h-3.5 fill-gold-dark dark:fill-gold" /> {state.streak} Streak
                  </Badge>
                )}
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Lives Indicator for Survival Mode */}
              {isSurvival && (
                <div
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary border border-border"
                  title={`${state.lives} of ${state.maxLives} lives left`}
                >
                  {[0, 1, 2].map(i => {
                    const active = i < state.lives;
                    return (
                      <Heart
                        key={i}
                        className={`w-4 h-4 transition-all ${
                          active
                            ? 'text-red-600 fill-red-600'
                            : 'text-muted-foreground/30 fill-none'
                        }`}
                      />
                    );
                  })}
                </div>
              )}

              {/* Circular Timer Ring */}
              <Timer timeLeft={timeLeft} maxTime={timerDuration} />
            </div>
          </CardContent>
        </Card>

        {/* Lifelines Bar (Solo / Survival / Daily) */}
        {!isMultiplayer && !isLocalMultiplayer && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 mb-4">
            <Button
              variant="outline"
              size="sm"
              onClick={handleUseFiftyFifty}
              disabled={state.lifelines.fiftyFifty || hasSubmitted}
              className={`h-10 justify-center gap-2 transition-all ${
                state.lifelines.fiftyFifty
                  ? 'opacity-40 border-dashed'
                  : 'hover:border-foreground/40'
              }`}
              title="Remove two incorrect options"
            >
              <Scissors className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="font-medium text-xs sm:text-sm">50 : 50</span>
              {state.lifelines.fiftyFifty && <span className="text-[10px] text-muted-foreground ml-1">(Used)</span>}
            </Button>

            {!isBlitz && timerDuration > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleUseExtraTime}
                disabled={state.lifelines.extraTime || hasSubmitted}
                className={`h-10 justify-center gap-2 transition-all ${
                  state.lifelines.extraTime
                    ? 'opacity-40 border-dashed'
                    : 'hover:border-foreground/40'
                }`}
                title="Add 15 seconds to the timer"
              >
                <Clock className="w-3.5 h-3.5 text-gold-dark dark:text-gold" />
                <span className="font-medium text-xs sm:text-sm">+15s Time</span>
                {state.lifelines.extraTime && <span className="text-[10px] text-muted-foreground ml-1">(Used)</span>}
              </Button>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={handleUseHint}
              disabled={state.lifelines.hint || hasSubmitted}
              className={`h-10 justify-center gap-2 transition-all col-span-2 sm:col-span-1 ${
                state.lifelines.hint
                  ? 'opacity-40 border-dashed'
                  : 'hover:border-foreground/40'
              }`}
              title="Reveal Scripture context insight"
            >
              <Sparkles className="w-3.5 h-3.5 text-gold-dark dark:text-gold" />
              <span className="font-medium text-xs sm:text-sm">Scripture Hint</span>
              {state.lifelines.hint && <span className="text-[10px] text-muted-foreground ml-1">(Used)</span>}
            </Button>
          </div>
        )}

        {/* Game Main Question Card */}
        <div className="flex-1 flex flex-col justify-center">
          {waitingForOpponent ? (
            <Card className="p-8 text-center border-dashed border-2 border-border bg-card shadow-sm">
              <CardContent className="space-y-4 py-6">
                <Loader2 className="w-8 h-8 animate-spin text-gold mx-auto" />
                <h3 className="text-xl font-bold font-serif text-foreground">Answer Submitted</h3>
                <p className="text-muted-foreground max-w-md mx-auto text-sm">
                  Waiting for other players to submit their answer before revealing scripture context...
                </p>
              </CardContent>
            </Card>
          ) : (
            <QuestionCard
              key={state.currentQuestionIndex}
              question={currentQuestion}
              onAnswer={handleAnswer}
              selectedAnswer={selectedAnswer}
              showResult={reviewingAnswer}
              questionNumber={state.currentQuestionIndex + 1}
              totalQuestions={state.questions.length}
              hiddenOptionIndices={state.hiddenOptionIndices}
              showHint={state.showHint}
            />
          )}
        </div>

        {/* Game Stats Bottom Bar */}
        <Card className="mt-4 bg-card border border-border text-muted-foreground text-xs sm:text-sm font-medium">
          <CardContent className="p-3 flex items-center justify-center gap-6 flex-wrap">
            {isMultiplayer ? (
              <span className="flex items-center gap-2">
                <Users className="w-4 h-4 text-foreground" /> Online Match • 1 pt per correct answer
              </span>
            ) : isSurvival ? (
              <span className="flex items-center gap-2">
                <Trophy className="w-4 h-4 text-gold-dark dark:text-gold" /> Survival Mode • {correctCount} correct • {state.lives} lives remaining
              </span>
            ) : isBlitz ? (
              <span className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-red-600" /> Speed Blitz • {correctCount} answered correctly
              </span>
            ) : (
              <>
                <span className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-semibold">
                  <CheckCircle2 className="w-4 h-4" /> {correctCount} correct
                </span>
                <span className="flex items-center gap-1.5 text-red-700 dark:text-red-400 font-semibold">
                  <XCircle className="w-4 h-4" /> {answeredCount - correctCount} incorrect
                </span>
                <span className="flex items-center gap-1.5 text-foreground font-mono">
                  <Clock className="w-4 h-4 text-muted-foreground" /> {totalTime}s total
                </span>
              </>
            )}
          </CardContent>
        </Card>

        {/* Achievement Toast */}
        {state.achievementToast && (
          <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300">
            <Card className="border border-gold bg-card shadow-elevated p-4 flex items-center gap-3 max-w-sm">
              <span className="text-3xl">{state.achievementToast.icon}</span>
              <div>
                <span className="text-[10px] uppercase font-bold text-gold-dark dark:text-gold tracking-wider">Achievement Unlocked!</span>
                <h4 className="font-serif font-bold text-foreground text-sm">{state.achievementToast.title}</h4>
                <p className="text-xs text-muted-foreground">{state.achievementToast.description}</p>
              </div>
            </Card>
          </div>
        )}
      </div>
    </>
  );
}
