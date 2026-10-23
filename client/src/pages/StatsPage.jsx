import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getStats, getGameHistory, isAuthenticated } from '../api';
import NavBar from '../components/NavBar';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Progress } from '../components/ui/progress';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs';
import { ACHIEVEMENTS, getUnlockedAchievements } from '../utils/achievements';
import { getSeenQuestionIds } from '../utils/seenQuestions';
import questions from '../data/questions.json';
import { sound } from '../utils/audio';
import {
  Trophy,
  Flame,
  Gamepad2,
  CheckCircle2,
  Target,
  BookOpen,
  Award,
  History,
  ArrowRight,
  Lock,
  Check,
  Star,
  Sparkles,
  Loader2
} from 'lucide-react';
import './Stats.css';

export default function StatsPage() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [history, setHistory] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/login');
      return;
    }

    loadData();
  }, [navigate]);

  const loadData = async () => {
    try {
      const [statsData, historyData] = await Promise.all([
        getStats(),
        getGameHistory()
      ]);
      setStats(statsData);
      setHistory(historyData);
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const unlockedIds = new Set(getUnlockedAchievements());
  const seenCount = getSeenQuestionIds().length;
  const totalQuestions = questions.length;
  const masteryPercentage = Math.round((seenCount / totalQuestions) * 100);

  if (loading) {
    return (
      <>
        <NavBar title="Your Statistics" />
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
          <p className="text-muted-foreground font-medium text-lg">Loading your Scripture journey...</p>
        </div>
      </>
    );
  }

  const avgAccuracy = stats?.total_questions > 0 
    ? Math.round((stats.total_correct / stats.total_questions) * 100) 
    : 0;

  return (
    <>
      <NavBar title="Your Scripture Journey" />
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        {/* Hero Section */}
        <div className="text-center space-y-3">
          <Badge variant="gold" className="gap-1.5 px-3 py-1 text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5" /> Disciple Profile
          </Badge>
          <h1 className="text-3xl sm:text-4xl font-serif font-black tracking-tight text-foreground">
            Your Scripture Growth &amp; Records
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto text-base">
            Track your knowledge across all 66 books of the Bible, review game histories, and collect badges.
          </p>
        </div>

        {/* Shadcn Tabs Container */}
        <Tabs value={activeTab} onValueChange={(val) => { sound.playClick(); setActiveTab(val); }} className="w-full">
          <div className="flex justify-center mb-6">
            <TabsList className="grid grid-cols-3 max-w-md w-full h-11 bg-muted/60 p-1 border">
              <TabsTrigger value="overview" className="text-xs sm:text-sm font-semibold gap-1.5">
                <Target className="w-4 h-4" /> Overview
              </TabsTrigger>
              <TabsTrigger value="badges" className="text-xs sm:text-sm font-semibold gap-1.5">
                <Award className="w-4 h-4" /> Badges ({unlockedIds.size}/{ACHIEVEMENTS.length})
              </TabsTrigger>
              <TabsTrigger value="history" className="text-xs sm:text-sm font-semibold gap-1.5">
                <History className="w-4 h-4" /> History ({history.length})
              </TabsTrigger>
            </TabsList>
          </div>

          {/* TAB 1: OVERVIEW & MASTERY */}
          <TabsContent value="overview" className="space-y-6 focus-visible:outline-none">
            {stats && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <Card className="border bg-card/90 shadow-sm">
                  <CardContent className="p-5 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      <Gamepad2 className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="text-2xl sm:text-3xl font-black font-mono text-foreground">{stats.games_played}</div>
                      <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Games Played</div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border bg-card/90 shadow-sm">
                  <CardContent className="p-5 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
                      <Star className="w-6 h-6 fill-current" />
                    </div>
                    <div>
                      <div className="text-2xl sm:text-3xl font-black font-mono text-primary">{stats.total_score}</div>
                      <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Points</div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border bg-card/90 shadow-sm">
                  <CardContent className="p-5 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-yellow-500/10 text-yellow-500 flex items-center justify-center shrink-0">
                      <Trophy className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="text-2xl sm:text-3xl font-black font-mono text-foreground">{stats.best_score}</div>
                      <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Best Score</div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border bg-card/90 shadow-sm">
                  <CardContent className="p-5 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                      <Target className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="text-2xl sm:text-3xl font-black font-mono text-foreground">{avgAccuracy}%</div>
                      <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Overall Accuracy</div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border bg-card/90 shadow-sm">
                  <CardContent className="p-5 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center shrink-0">
                      <Flame className="w-6 h-6 fill-current" />
                    </div>
                    <div>
                      <div className="text-2xl sm:text-3xl font-black font-mono text-rose-500">{stats.best_streak}</div>
                      <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Best Streak</div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border bg-card/90 shadow-sm">
                  <CardContent className="p-5 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="text-2xl sm:text-3xl font-black font-mono text-foreground">{stats.total_correct}</div>
                      <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Questions Correct</div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Scripture Mastery Progress Card */}
            <Card className="border-primary/30 bg-card/90 shadow-sm">
              <CardContent className="p-6 space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-5 h-5 text-primary" />
                      <h3 className="font-serif font-bold text-lg text-foreground">Scripture Knowledge Coverage</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      You have explored <strong className="text-foreground">{seenCount}</strong> of{' '}
                      <strong className="text-foreground">{totalQuestions}</strong> questions in the library.
                    </p>
                  </div>
                  <Badge variant="gold" className="text-base font-bold font-mono px-3 py-1">
                    {masteryPercentage}%
                  </Badge>
                </div>

                <Progress value={Math.max(masteryPercentage, 2)} className="h-3" />
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
              <Button
                variant="gold"
                size="lg"
                className="w-full sm:w-auto font-semibold shadow-md px-6 py-5"
                onClick={() => navigate('/settings')}
              >
                Play New Game <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="w-full sm:w-auto font-semibold px-6 py-5"
                onClick={() => navigate('/leaderboard')}
              >
                <Trophy className="w-4 h-4 mr-2 text-amber-500" /> View Global Leaderboard
              </Button>
            </div>
          </TabsContent>

          {/* TAB 2: BADGES & ACHIEVEMENTS */}
          <TabsContent value="badges" className="focus-visible:outline-none">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {ACHIEVEMENTS.map(ach => {
                const isUnlocked = unlockedIds.has(ach.id);
                return (
                  <Card
                    key={ach.id}
                    className={`border transition-all ${
                      isUnlocked
                        ? 'bg-card/95 border-amber-500/40 shadow-sm hover:border-amber-500/70'
                        : 'bg-muted/30 border-border/60 opacity-60'
                    }`}
                  >
                    <CardContent className="p-4 flex items-center gap-4">
                      <div
                        className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shrink-0 shadow-inner ${
                          isUnlocked ? 'bg-amber-500/10 border border-amber-500/30' : 'bg-muted border'
                        }`}
                      >
                        {ach.icon}
                      </div>

                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-serif font-bold text-foreground text-sm">{ach.title}</h4>
                          <Badge
                            variant={ach.rarity === 'Legendary' ? 'gold' : ach.rarity === 'Epic' ? 'default' : 'outline'}
                            className="text-[10px] px-2 py-0.5"
                          >
                            {ach.rarity}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">{ach.description}</p>
                        <div className="pt-1">
                          {isUnlocked ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                              <Check className="w-3.5 h-3.5" /> Unlocked
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground">
                              <Lock className="w-3.5 h-3.5" /> Locked
                            </span>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          {/* TAB 3: GAME HISTORY */}
          <TabsContent value="history" className="focus-visible:outline-none">
            {history.length === 0 ? (
              <Card className="p-8 text-center border-dashed bg-card/80">
                <CardContent className="space-y-4 py-6">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
                    <History className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold font-serif text-foreground">No Games Played Yet</h3>
                  <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                    Start playing Scripture trivia games to record your match results and watch your knowledge grow!
                  </p>
                  <Button variant="gold" onClick={() => navigate('/settings')} className="mt-2">
                    Play Your First Game
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {history.map((game) => (
                  <Card key={game.id} className="border bg-card/90 shadow-xs hover:border-primary/40 transition-all">
                    <CardContent className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="font-mono text-xs uppercase font-bold text-primary">
                            {game.mode || 'SOLO'}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {new Date(game.played_at).toLocaleDateString(undefined, {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-4 gap-4 sm:gap-6 text-center w-full sm:w-auto">
                        <div>
                          <div className="text-xs uppercase text-muted-foreground">Score</div>
                          <div className="text-base font-bold font-mono text-primary">{game.score}</div>
                        </div>
                        <div>
                          <div className="text-xs uppercase text-muted-foreground">Accuracy</div>
                          <div className="text-base font-bold font-mono text-foreground">{Math.round(game.accuracy)}%</div>
                        </div>
                        <div>
                          <div className="text-xs uppercase text-muted-foreground">Correct</div>
                          <div className="text-base font-bold font-mono text-foreground">
                            {game.correct_answers}/{game.total_questions}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs uppercase text-muted-foreground">Time</div>
                          <div className="text-base font-bold font-mono text-muted-foreground">{game.time_taken}s</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
