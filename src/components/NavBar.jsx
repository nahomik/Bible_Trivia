import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useGame } from '../context/GameContext';
import { isAuthenticated, getMe, logout, updateAvatar } from '../api';
import { sound } from '../utils/audio';
import { getDailyStreak } from '../utils/dailyChallenge';
import { Button } from './ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from './ui/dialog';
import {
  BookOpen,
  Home,
  Calendar,
  Trophy,
  BarChart3,
  Volume2,
  VolumeX,
  Moon,
  Sun,
  LogOut,
  Menu,
  X,
  Flame,
  Sparkles
} from 'lucide-react';

const AVATAR_OPTIONS = ['📖', '🕊️', '👑', '✝️', '🛡️', '⛵', '🍞', '🕯️', '🍇', '🦁', '⚡', '🌟'];

export default function NavBar({ title }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { state, dispatch } = useGame();
  const [user, setUser] = useState(state.user || null);
  const [showAvatarDialog, setShowAvatarDialog] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const streak = getDailyStreak();

  useEffect(() => {
    if (isAuthenticated() && !user) {
      getMe()
        .then(u => {
          setUser(u);
          dispatch({ type: 'SET_USER', payload: u });
          if (!state.playerName) {
            dispatch({ type: 'SET_PLAYER_NAME', payload: u.username });
          }
        })
        .catch(() => setUser(null));
    }
  }, [user, dispatch, state.playerName]);

  const handleNav = (path) => {
    sound.playClick();
    setMobileMenuOpen(false);
    if (location.pathname === '/game' && path !== '/game') {
      if (!window.confirm('Are you sure you want to leave the active game? Progress will be lost.')) {
        return;
      }
    }
    dispatch({ type: 'RESET_GAME' });
    navigate(path);
  };

  const handleLogout = () => {
    sound.playClick();
    logout();
    setUser(null);
    dispatch({ type: 'SET_USER', payload: null });
    setMobileMenuOpen(false);
    navigate('/');
  };

  const handleSelectAvatar = async (av) => {
    sound.playClick();
    try {
      await updateAvatar(av);
      const updated = { ...user, avatar: av };
      setUser(updated);
      dispatch({ type: 'SET_USER', payload: updated });
    } catch (err) {
      console.error(err);
    }
    setShowAvatarDialog(false);
  };

  const isNavActive = (path) => location.pathname === path;

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/85 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex h-16 items-center justify-between px-4 sm:px-6">
          {/* Brand Logo */}
          <div
            className="flex items-center gap-2.5 cursor-pointer select-none transition-transform active:scale-95"
            onClick={() => handleNav('/')}
          >
            <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-sm">
              <BookOpen className="w-5 h-5 text-primary" />
            </div>
            <div>
              <div className="font-extrabold text-base sm:text-lg leading-tight flex items-center gap-1.5">
                <span className="bg-gradient-to-r from-amber-500 to-indigo-500 bg-clip-text text-transparent">
                  Bible Trivia
                </span>
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              </div>
              <p className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
                Scripture Challenge
              </p>
            </div>
          </div>

          {/* Title tag if provided */}
          {title && (
            <div className="hidden lg:flex items-center px-3 py-1 rounded-full bg-secondary border border-border text-xs font-bold text-foreground">
              {title}
            </div>
          )}

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            <Button
              variant={isNavActive('/') ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => handleNav('/')}
              className={`gap-1.5 font-bold ${isNavActive('/') ? 'bg-secondary text-primary' : ''}`}
            >
              <Home className="w-4 h-4" />
              Home
            </Button>

            <Button
              variant={isNavActive('/settings') && state.mode === 'daily' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => handleNav('/settings?mode=daily')}
              className="gap-1.5 font-bold relative"
            >
              <Calendar className="w-4 h-4 text-amber-500" />
              Daily
              {streak > 0 && (
                <span className="ml-1 inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500 text-white shadow-sm">
                  <Flame className="w-2.5 h-2.5" /> {streak}
                </span>
              )}
            </Button>

            <Button
              variant={isNavActive('/leaderboard') ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => handleNav('/leaderboard')}
              className={`gap-1.5 font-bold ${isNavActive('/leaderboard') ? 'bg-secondary text-primary' : ''}`}
            >
              <Trophy className="w-4 h-4 text-amber-500" />
              Leaderboard
            </Button>

            <Button
              variant={isNavActive('/stats') ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => handleNav('/stats')}
              className={`gap-1.5 font-bold ${isNavActive('/stats') ? 'bg-secondary text-primary' : ''}`}
            >
              <BarChart3 className="w-4 h-4 text-primary" />
              Stats &amp; Badges
            </Button>
          </nav>

          {/* Right Action Controls */}
          <div className="flex items-center gap-2">
            {/* Audio Toggle */}
            <Button
              variant="outline"
              size="icon"
              onClick={() => {
                dispatch({ type: 'TOGGLE_SOUND' });
                sound.playClick();
              }}
              title={state.soundMuted ? 'Unmute Audio' : 'Mute Audio'}
              className="rounded-lg h-9 w-9"
            >
              {state.soundMuted ? (
                <VolumeX className="w-4 h-4 text-muted-foreground" />
              ) : (
                <Volume2 className="w-4 h-4 text-primary" />
              )}
            </Button>

            {/* Theme Toggle */}
            <Button
              variant="outline"
              size="icon"
              onClick={() => {
                dispatch({ type: 'TOGGLE_THEME' });
                sound.playClick();
              }}
              title={state.theme === 'light' ? 'Dark Mode' : 'Light Mode'}
              className="rounded-lg h-9 w-9"
            >
              {state.theme === 'light' ? (
                <Moon className="w-4 h-4 text-foreground" />
              ) : (
                <Sun className="w-4 h-4 text-amber-400" />
              )}
            </Button>

            {/* User Profile Chip or Sign In */}
            {user ? (
              <div
                className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-border bg-card shadow-sm cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => setShowAvatarDialog(true)}
              >
                <span className="text-lg leading-none">{user.avatar || '📖'}</span>
                <span className="text-xs font-bold text-foreground max-w-[80px] sm:max-w-[110px] truncate">
                  {user.username}
                </span>
                <button
                  className="p-1 text-muted-foreground hover:text-destructive transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleLogout();
                  }}
                  title="Sign Out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <Button
                variant="default"
                size="sm"
                onClick={() => handleNav('/login')}
                className="font-bold gap-1 shadow-sm"
              >
                Sign In
              </Button>
            )}

            {/* Mobile Hamburger Toggle */}
            <Button
              variant="outline"
              size="icon"
              className="md:hidden rounded-lg h-9 w-9"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border bg-card p-4 space-y-2 animate-in slide-in-from-top-2 duration-200">
            <Button
              variant={isNavActive('/') ? 'secondary' : 'ghost'}
              className="w-full justify-start font-bold gap-2"
              onClick={() => handleNav('/')}
            >
              <Home className="w-4 h-4" />
              Home
            </Button>
            <Button
              variant={isNavActive('/settings') && state.mode === 'daily' ? 'secondary' : 'ghost'}
              className="w-full justify-start font-bold gap-2"
              onClick={() => handleNav('/settings?mode=daily')}
            >
              <Calendar className="w-4 h-4 text-amber-500" />
              Daily Challenge {streak > 0 && `(🔥 ${streak})`}
            </Button>
            <Button
              variant={isNavActive('/leaderboard') ? 'secondary' : 'ghost'}
              className="w-full justify-start font-bold gap-2"
              onClick={() => handleNav('/leaderboard')}
            >
              <Trophy className="w-4 h-4 text-amber-500" />
              Leaderboard
            </Button>
            <Button
              variant={isNavActive('/stats') ? 'secondary' : 'ghost'}
              className="w-full justify-start font-bold gap-2"
              onClick={() => handleNav('/stats')}
            >
              <BarChart3 className="w-4 h-4 text-primary" />
              Stats &amp; Badges
            </Button>
            {user ? (
              <Button
                variant="destructive"
                className="w-full justify-start font-bold gap-2 mt-2"
                onClick={handleLogout}
              >
                <LogOut className="w-4 h-4" />
                Sign Out ({user.username})
              </Button>
            ) : (
              <Button
                variant="default"
                className="w-full justify-start font-bold gap-2 mt-2"
                onClick={() => handleNav('/login')}
              >
                Sign In / Register
              </Button>
            )}
          </div>
        )}
      </header>

      {/* shadcn Dialog for Biblical Avatar Picker */}
      <Dialog open={showAvatarDialog} onOpenChange={setShowAvatarDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-extrabold flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              Select Biblical Avatar
            </DialogTitle>
            <DialogDescription>
              Choose an emblem to represent your profile on global leaderboards and online lobbies.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-4 gap-3 py-4">
            {AVATAR_OPTIONS.map((av) => (
              <button
                key={av}
                onClick={() => handleSelectAvatar(av)}
                className={`aspect-square flex items-center justify-center text-3xl rounded-xl border-2 transition-all hover:scale-105 ${
                  user?.avatar === av
                    ? 'border-amber-500 bg-amber-500/15 shadow-md ring-2 ring-amber-500/30'
                    : 'border-border bg-muted/40 hover:bg-accent'
                }`}
              >
                {av}
              </button>
            ))}
          </div>

          <div className="flex justify-end">
            <Button variant="secondary" onClick={() => setShowAvatarDialog(false)}>
              Done
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
