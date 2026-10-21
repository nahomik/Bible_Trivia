import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getLeaderboard, getMe, isAuthenticated } from '../api';
import NavBar from '../components/NavBar';
import { sound } from '../utils/audio';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import {
  Trophy,
  Flame,
  Target,
  Sparkles,
  Gamepad2
} from 'lucide-react';

export default function LeaderboardPage() {
  const navigate = useNavigate();
  const [leaderboard, setLeaderboard] = useState([]);
  const [sortBy, setSortBy] = useState('total_score');
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    if (isAuthenticated()) {
      getMe().then(setCurrentUser).catch(() => {});
    }
  }, []);

  useEffect(() => {
    fetchLeaderboard(sortBy);
  }, [sortBy]);

  const fetchLeaderboard = async (sort) => {
    setLoading(true);
    try {
      const data = await getLeaderboard(sort);
      setLeaderboard(data);
    } catch (err) {
      console.error('Failed to load leaderboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSortChange = (newSort) => {
    sound.playClick();
    setSortBy(newSort);
  };

  const top3 = leaderboard.slice(0, 3);

  const getMetricDisplay = (player, sort) => {
    if (sort === 'best_score') return `${player.best_score} pts`;
    if (sort === 'best_streak') return `${player.best_streak} streak`;
    if (sort === 'best_accuracy') return `${Math.round(player.best_accuracy)}%`;
    if (sort === 'games_played') return `${player.games_played} games`;
    return `${player.total_score} pts`;
  };

  return (
    <>
      <NavBar title="Global Leaderboard" />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8">
        {/* Header */}
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500 mx-auto shadow-sm">
            <Trophy className="w-8 h-8 text-amber-500" />
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-foreground">
            Champions of Scripture
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Compete with believers worldwide in Scripture knowledge, answering speed, and biblical accuracy.
          </p>

          {/* Sort Filter Tabs */}
          <div className="inline-flex items-center gap-1.5 p-1 rounded-xl bg-muted/60 border border-border mt-4 flex-wrap justify-center">
            <Button
              variant={sortBy === 'total_score' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => handleSortChange('total_score')}
              className="font-bold text-xs gap-1"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              Total Points
            </Button>
            <Button
              variant={sortBy === 'best_score' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => handleSortChange('best_score')}
              className="font-bold text-xs gap-1"
            >
              <Trophy className="w-3.5 h-3.5 text-amber-500" />
              Best Game Score
            </Button>
            <Button
              variant={sortBy === 'best_streak' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => handleSortChange('best_streak')}
              className="font-bold text-xs gap-1"
            >
              <Flame className="w-3.5 h-3.5 text-red-500" />
              Longest Streak
            </Button>
            <Button
              variant={sortBy === 'best_accuracy' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => handleSortChange('best_accuracy')}
              className="font-bold text-xs gap-1"
            >
              <Target className="w-3.5 h-3.5 text-emerald-500" />
              Accuracy
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-16 space-y-3">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm font-semibold text-muted-foreground">Loading Scripture rankings...</p>
          </div>
        ) : leaderboard.length === 0 ? (
          <Card className="text-center py-12 px-4 border-dashed">
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">No matches recorded yet. Claim the #1 position today!</p>
              <Button onClick={() => navigate('/settings')}>Play First Game</Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Top 3 Champions Podium */}
            {top3.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 items-end">
                {/* 2nd Place */}
                {top3[1] && (
                  <Card className="border-border bg-card/70 text-center p-6 space-y-3 order-2 md:order-1 hover:border-slate-400 transition-all">
                    <Badge variant="outline" className="font-bold text-xs">
                      🥈 2nd Place
                    </Badge>
                    <div className="w-16 h-16 rounded-full bg-muted border-2 border-border flex items-center justify-center text-3xl mx-auto">
                      {top3[1].avatar || '📖'}
                    </div>
                    <div>
                      <h4 className="font-bold text-lg text-foreground truncate">{top3[1].username}</h4>
                      <p className="text-2xl font-extrabold text-primary mt-1">{getMetricDisplay(top3[1], sortBy)}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{top3[1].games_played} games</p>
                    </div>
                  </Card>
                )}

                {/* 1st Place Champion */}
                {top3[0] && (
                  <Card className="border-2 border-amber-500 bg-gradient-to-b from-amber-500/10 via-card to-card text-center p-8 space-y-3 order-1 md:order-2 shadow-xl ring-2 ring-amber-500/20 md:-translate-y-2">
                    <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-500 text-white font-extrabold text-xs shadow-md mx-auto">
                      👑 Champion
                    </div>
                    <div className="w-20 h-20 rounded-full bg-amber-500/20 border-2 border-amber-500 flex items-center justify-center text-4xl mx-auto shadow-md">
                      {top3[0].avatar || '📖'}
                    </div>
                    <div>
                      <h4 className="font-extrabold text-xl text-foreground truncate">{top3[0].username}</h4>
                      <p className="text-3xl font-extrabold text-amber-500 mt-1">{getMetricDisplay(top3[0], sortBy)}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{top3[0].games_played} games played</p>
                    </div>
                  </Card>
                )}

                {/* 3rd Place */}
                {top3[2] && (
                  <Card className="border-border bg-card/70 text-center p-6 space-y-3 order-3 md:order-3 hover:border-amber-700/40 transition-all">
                    <Badge variant="outline" className="font-bold text-xs">
                      🥉 3rd Place
                    </Badge>
                    <div className="w-16 h-16 rounded-full bg-muted border-2 border-border flex items-center justify-center text-3xl mx-auto">
                      {top3[2].avatar || '📖'}
                    </div>
                    <div>
                      <h4 className="font-bold text-lg text-foreground truncate">{top3[2].username}</h4>
                      <p className="text-2xl font-extrabold text-primary mt-1">{getMetricDisplay(top3[2], sortBy)}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{top3[2].games_played} games</p>
                    </div>
                  </Card>
                )}
              </div>
            )}

            {/* Table of Rankings */}
            <Card className="overflow-hidden border-border shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-border bg-muted/40 text-xs uppercase font-extrabold text-muted-foreground tracking-wider">
                      <th className="py-3.5 px-4 text-center w-16">Rank</th>
                      <th className="py-3.5 px-4">Disciple</th>
                      <th className="py-3.5 px-4">Score</th>
                      <th className="py-3.5 px-4">Best Game</th>
                      <th className="py-3.5 px-4">Best Streak</th>
                      <th className="py-3.5 px-4">Accuracy</th>
                      <th className="py-3.5 px-4 text-right">Games</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60 text-sm">
                    {leaderboard.map((player, idx) => {
                      const isSelf = currentUser && player.id === currentUser.id;
                      return (
                        <tr
                          key={player.id}
                          className={`hover:bg-muted/30 transition-colors ${
                            isSelf ? 'bg-primary/10 font-bold' : ''
                          }`}
                        >
                          <td className="py-3.5 px-4 text-center font-extrabold">
                            <span
                              className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs ${
                                idx === 0
                                  ? 'bg-amber-500 text-white font-black'
                                  : idx === 1
                                  ? 'bg-slate-300 text-slate-900 font-bold dark:bg-slate-700 dark:text-white'
                                  : idx === 2
                                  ? 'bg-amber-700 text-white font-bold'
                                  : 'text-muted-foreground'
                              }`}
                            >
                              #{idx + 1}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-2.5">
                              <span className="text-xl leading-none">{player.avatar || '📖'}</span>
                              <span className="font-semibold text-foreground flex items-center gap-1.5">
                                {player.username}
                                {isSelf && (
                                  <Badge variant="default" className="text-[10px] px-1.5 py-0">
                                    You
                                  </Badge>
                                )}
                              </span>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 font-bold text-primary">{player.total_score}</td>
                          <td className="py-3.5 px-4 text-foreground/80 font-semibold">{player.best_score}</td>
                          <td className="py-3.5 px-4">
                            {player.best_streak ? (
                              <span className="inline-flex items-center gap-1 text-amber-500 font-bold">
                                <Flame className="w-3.5 h-3.5" />
                                {player.best_streak}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 font-semibold text-emerald-600 dark:text-emerald-400">
                            {Math.round(player.best_accuracy || 0)}%
                          </td>
                          <td className="py-3.5 px-4 text-right text-muted-foreground font-medium">
                            <span className="inline-flex items-center gap-1">
                              <Gamepad2 className="w-3.5 h-3.5" />
                              {player.games_played}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          </>
        )}
      </main>
    </>
  );
}
