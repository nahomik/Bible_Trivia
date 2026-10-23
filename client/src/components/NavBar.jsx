import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useGame } from '../context/GameContext';
import { isAuthenticated, getMe, logout, updateAvatar } from '../api';
import { sound } from '../utils/audio';
import { getDailyStreak } from '../utils/dailyChallenge';
import { t } from '../utils/translations';
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
  Users
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

  const isAmharic = state?.language === 'am';

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
      <header className="sticky top-0 z-50 w-full border-b border-border bg-card/95 backdrop-blur-md transition-colors">
        <div className="max-w-7xl mx-auto flex h-16 items-center justify-between px-4 sm:px-6">
          {/* Brand Logo & Name */}
          <div
            className="flex items-center gap-3 cursor-pointer select-none group"
            onClick={() => handleNav('/')}
          >
            <div className="w-10 h-10 rounded-lg bg-secondary border border-border flex items-center justify-center text-foreground group-hover:border-gold transition-colors">
              <BookOpen className="w-5 h-5 text-gold-dark dark:text-gold" />
            </div>
            <div>
              <div className="font-serif font-black tracking-wider text-base sm:text-lg leading-tight text-foreground uppercase">
                {isAmharic ? 'የመጽሐፍ ቅዱስ ዕውቀት' : 'Scripture Trivia'}
              </div>
              <div className="text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">
                {isAmharic ? 'የመንፈስ ፈተና' : 'The Bible Challenge'}
              </div>
            </div>
          </div>

          {/* Optional Title tag if provided */}
          {title && (
            <div className="hidden lg:flex items-center px-3 py-1 rounded-md bg-secondary border border-border text-xs font-semibold text-foreground">
              {title}
            </div>
          )}

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            <Button
              variant={isNavActive('/') ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => handleNav('/')}
              className="gap-1.5 font-medium"
            >
              <Home className="w-4 h-4 text-muted-foreground" />
              <span>{t('navHome', state.language)}</span>
            </Button>

            <Button
              variant={isNavActive('/settings') && state.mode === 'daily' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => handleNav('/settings?mode=daily')}
              className="gap-1.5 font-medium"
            >
              <Calendar className="w-4 h-4 text-gold-dark dark:text-gold" />
              <span>{t('modeDaily', state.language)}</span>
              {streak > 0 && (
                <span className="inline-flex items-center gap-0.5 text-[11px] px-1.5 py-0.2 rounded bg-amber-500/15 text-amber-700 dark:text-amber-400 font-bold border border-amber-500/30">
                  <Flame className="w-3 h-3 text-amber-600 dark:text-amber-400 fill-amber-500" />
                  {streak}
                </span>
              )}
            </Button>

            <Button
              variant={isNavActive('/online') ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => handleNav('/online')}
              className="gap-1.5 font-medium"
            >
              <Users className="w-4 h-4 text-muted-foreground" />
              <span>{isAmharic ? 'የመስመር ላይ' : 'Multiplayer'}</span>
            </Button>

            <Button
              variant={isNavActive('/leaderboard') ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => handleNav('/leaderboard')}
              className="gap-1.5 font-medium"
            >
              <Trophy className="w-4 h-4 text-gold-dark dark:text-gold" />
              <span>{t('navLeaderboard', state.language)}</span>
            </Button>

            <Button
              variant={isNavActive('/stats') ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => handleNav('/stats')}
              className="gap-1.5 font-medium"
            >
              <BarChart3 className="w-4 h-4 text-muted-foreground" />
              <span>{t('navProfile', state.language)}</span>
            </Button>
          </nav>

          {/* Quick Action Controls */}
          <div className="flex items-center gap-2">
            {/* Segmented Language Switcher */}
            <div className="inline-flex items-center rounded-lg border border-border bg-secondary p-0.5 shadow-sm text-xs font-semibold">
              <button
                type="button"
                onClick={() => {
                  if (state.language !== 'en') {
                    dispatch({ type: 'TOGGLE_LANGUAGE' });
                    sound.playClick();
                  }
                }}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  !isAmharic
                    ? 'bg-card text-foreground font-bold shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                EN
              </button>
              <button
                type="button"
                onClick={() => {
                  if (state.language !== 'am') {
                    dispatch({ type: 'TOGGLE_LANGUAGE' });
                    sound.playClick();
                  }
                }}
                className={`px-2.5 py-1 rounded-md transition-all font-serif ${
                  isAmharic
                    ? 'bg-card text-foreground font-bold shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                አማ
              </button>
            </div>

            {/* Audio Toggle */}
            <Button
              variant="outline"
              size="icon"
              onClick={() => {
                dispatch({ type: 'TOGGLE_SOUND' });
              }}
              title={state.soundMuted ? 'Unmute Audio' : 'Mute Audio'}
            >
              {state.soundMuted ? (
                <VolumeX className="w-4 h-4 text-muted-foreground" />
              ) : (
                <Volume2 className="w-4 h-4 text-foreground" />
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
              title="Toggle Theme"
            >
              {state.theme === 'dark' ? (
                <Sun className="w-4 h-4 text-gold" />
              ) : (
                <Moon className="w-4 h-4 text-muted-foreground" />
              )}
            </Button>

            {/* User Avatar / Login */}
            {user ? (
              <div className="relative flex items-center gap-1.5 pl-1">
                <button
                  onClick={() => setShowAvatarDialog(true)}
                  title="Change Avatar"
                  className="w-9 h-9 rounded-lg bg-secondary border border-border hover:border-gold flex items-center justify-center text-lg shadow-sm transition-all"
                >
                  {user.avatar || '📖'}
                </button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleLogout}
                  title="Sign Out"
                  className="hidden sm:inline-flex text-muted-foreground hover:text-destructive"
                >
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <Button
                variant="default"
                size="sm"
                onClick={() => handleNav('/login')}
                className="hidden sm:inline-flex font-semibold"
              >
                Sign In
              </Button>
            )}

            {/* Mobile Menu Button */}
            <Button
              variant="outline"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border bg-card p-4 space-y-2">
            <Button
              variant={isNavActive('/') ? 'secondary' : 'ghost'}
              className="w-full justify-start font-medium gap-2.5"
              onClick={() => handleNav('/')}
            >
              <Home className="w-4 h-4 text-muted-foreground" />
              <span>{t('navHome', state.language)}</span>
            </Button>
            <Button
              variant={isNavActive('/settings') && state.mode === 'daily' ? 'secondary' : 'ghost'}
              className="w-full justify-start font-medium gap-2.5"
              onClick={() => handleNav('/settings?mode=daily')}
            >
              <Calendar className="w-4 h-4 text-gold-dark dark:text-gold" />
              <span>{t('modeDaily', state.language)}</span>
              {streak > 0 && <span className="ml-auto font-bold text-xs text-amber-600">🔥 {streak}</span>}
            </Button>
            <Button
              variant={isNavActive('/online') ? 'secondary' : 'ghost'}
              className="w-full justify-start font-medium gap-2.5"
              onClick={() => handleNav('/online')}
            >
              <Users className="w-4 h-4 text-muted-foreground" />
              <span>{isAmharic ? 'የመስመር ላይ' : 'Multiplayer'}</span>
            </Button>
            <Button
              variant={isNavActive('/leaderboard') ? 'secondary' : 'ghost'}
              className="w-full justify-start font-medium gap-2.5"
              onClick={() => handleNav('/leaderboard')}
            >
              <Trophy className="w-4 h-4 text-gold-dark dark:text-gold" />
              <span>{t('navLeaderboard', state.language)}</span>
            </Button>
            <Button
              variant={isNavActive('/stats') ? 'secondary' : 'ghost'}
              className="w-full justify-start font-medium gap-2.5"
              onClick={() => handleNav('/stats')}
            >
              <BarChart3 className="w-4 h-4 text-muted-foreground" />
              <span>{t('navProfile', state.language)}</span>
            </Button>

            <div className="pt-2 border-t border-border">
              {user ? (
                <Button
                  variant="outline"
                  className="w-full justify-start font-medium gap-2.5 text-destructive"
                  onClick={handleLogout}
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out ({user.username})
                </Button>
              ) : (
                <Button
                  variant="default"
                  className="w-full justify-center font-bold"
                  onClick={() => handleNav('/login')}
                >
                  Sign In / Register
                </Button>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Avatar Picker Dialog */}
      <Dialog open={showAvatarDialog} onOpenChange={setShowAvatarDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold font-serif">
              Select Profile Emblem
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
                className={`aspect-square flex items-center justify-center text-2xl rounded-lg border transition-all ${
                  user?.avatar === av
                    ? 'border-gold bg-gold/15 shadow-sm font-bold'
                    : 'border-border bg-secondary hover:border-foreground/40'
                }`}
              >
                {av}
              </button>
            ))}
          </div>

          <div className="flex justify-end">
            <Button variant="outline" onClick={() => setShowAvatarDialog(false)}>
              Done
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
