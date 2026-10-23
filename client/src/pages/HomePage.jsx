import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../context/GameContext';
import { isAuthenticated, getMe } from '../api';
import NavBar from '../components/NavBar';
import { sound } from '../utils/audio';
import { isDailyCompletedToday, getDailyStreak, getDailyResult } from '../utils/dailyChallenge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import {
  BookOpen,
  Calendar,
  Flame,
  ShieldAlert,
  Users,
  Trophy,
  ChevronRight,
  ScrollText,
  Compass,
  CheckCircle2
} from 'lucide-react';
import { t } from '../utils/translations';

const SCRIPTURE_VERSES = [
  {
    en: { text: "Your word is a lamp to my feet and a light to my path.", ref: "Psalm 119:105" },
    am: { text: "ሕግህ ለእግሬ መብራት ለመንገዴም ብርሃን ነው።", ref: "መዝሙረ ዳዊት 119:105" }
  },
  {
    en: { text: "All Scripture is God-breathed and useful for teaching, rebuking, correcting and training in righteousness.", ref: "2 Timothy 3:16" },
    am: { text: "የእግዚአብሔር መንፈስ ያለበት መጽሐፍ ሁሉ ለትምህርትና ለተግሣጽ ልብንም ለማቅናት ይጠቅማል።", ref: "2ኛ ጢሞቴዎስ 3:16" }
  }
];

export default function HomePage() {
  const navigate = useNavigate();
  const { state, dispatch } = useGame();
  const lang = state?.language || 'en';
  const verse = SCRIPTURE_VERSES[0][lang] || SCRIPTURE_VERSES[0].en;
  const isDailyDone = isDailyCompletedToday();
  const dailyStreak = getDailyStreak();
  const dailyResult = getDailyResult();

  useEffect(() => {
    if (isAuthenticated()) {
      getMe()
        .then(u => {
          dispatch({ type: 'SET_USER', payload: u });
          if (!state.playerName) {
            dispatch({ type: 'SET_PLAYER_NAME', payload: u.username });
          }
        })
        .catch(() => {});
    }
  }, [dispatch, state.playerName]);

  const handleStartMode = (mode) => {
    sound.playClick();
    dispatch({ type: 'SET_MODE', payload: mode });
    if (mode === 'online') {
      navigate('/online');
    } else {
      navigate(`/settings?mode=${mode}`);
    }
  };

  return (
    <>
      <NavBar />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-10">
        
        {/* Scripture Verse of the Day Plate */}
        <div className="relative rounded-xl border border-border bg-card p-6 sm:p-7 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1.5 flex-1">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gold-dark dark:text-gold">
                <ScrollText className="w-3.5 h-3.5" />
                <span>{lang === 'am' ? 'የዕለቱ ቅዱስ ቃል' : 'Scripture of the Day'}</span>
              </div>
              <blockquote className="font-serif italic text-lg sm:text-xl text-foreground font-medium leading-relaxed">
                &ldquo;{verse.text}&rdquo;
              </blockquote>
              <div className="text-xs sm:text-sm font-semibold text-muted-foreground">
                — {verse.ref}
              </div>
            </div>
          </div>
        </div>

        {/* Hero Section */}
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border bg-secondary text-xs font-semibold text-muted-foreground">
            <span className="w-1.5 h-1.5 rounded-full bg-gold" />
            <span>
              {lang === 'am'
                ? '475 የተመረጡ ጥያቄዎች • ከኦሪት ዘፍጥረት እስከ ዮሐንስ ራእይ • አማርኛ እና English'
                : '475 Curated Scripture Questions • Genesis to Revelation • English & አማርኛ'}
            </span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black font-serif tracking-tight text-foreground">
            {lang === 'am' ? 'የመጽሐፍ ቅዱስ ዕውቀት ውድድር' : 'Scripture Trivia Challenge'}
          </h1>

          <p className="text-muted-foreground text-base sm:text-lg leading-relaxed">
            {lang === 'am'
              ? 'በመጽሐፍ ቅዱስ ዕውቀትዎ ላይ የተመሰረተ ትክክለኛ ጥያቄና መልስ። እያንዳንዱ ጥያቄ ትክክለኛውን ጥቅስና ታሪክ ያካትታል።'
              : 'Test your knowledge of the Word of God. Every question is verified with scripture citations and historical biblical context.'}
          </p>
        </div>

        {/* Daily Scripture Challenge Card */}
        <Card
          className="border-2 border-border hover:border-foreground/30 transition-all cursor-pointer group bg-card shadow-sm"
          onClick={() => handleStartMode('daily')}
        >
          <CardContent className="p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-xl">
              <div className="flex items-center gap-2">
                <Badge variant="gold" className="gap-1 font-bold">
                  <Calendar className="w-3.5 h-3.5" />
                  {lang === 'am' ? 'የዕለቱ ውድድር' : 'Daily Challenge'}
                </Badge>
                {dailyStreak > 0 && (
                  <Badge variant="secondary" className="gap-1 font-bold text-amber-700 dark:text-amber-400">
                    <Flame className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 fill-amber-500" />
                    {dailyStreak} {lang === 'am' ? 'ቀናት ተከታታይ' : 'Day Streak'}
                  </Badge>
                )}
              </div>
              <CardTitle className="text-2xl font-bold font-serif text-foreground group-hover:text-gold-dark dark:group-hover:text-gold transition-colors">
                {lang === 'am' ? 'የዛሬዎቹ 5 የመጽሐፍ ቅዱስ ጥያቄዎች' : "Today's 5 Scripture Questions"}
              </CardTitle>
              <CardDescription className="text-sm sm:text-base text-muted-foreground">
                {isDailyDone
                  ? (lang === 'am'
                      ? `የዛሬውን ጨርሰዋል! ያገኙት ውጤት ${dailyResult?.score || 0}/${dailyResult?.total || 5} ነው። ነገ ለቀጣዩ ፈተና ይመለሱ!`
                      : `Completed today! You scored ${dailyResult?.score || 0}/${dailyResult?.total || 5}. Check back tomorrow for the next challenge!`)
                  : (lang === 'am'
                      ? 'የዛሬውን 5 ጥያቄዎች ይመልሱ። በዓለም ዙሪያ ያሉ አማኞች ዛሬ ተመሳሳይ 5 ጥያቄዎችን ይወስዳሉ።'
                      : 'Play today\'s curated questions. Every player worldwide receives the exact same 5 questions today.')}
              </CardDescription>
            </div>

            <Button
              variant={isDailyDone ? 'outline' : 'gold'}
              size="lg"
              className="w-full md:w-auto shrink-0 font-bold"
            >
              {isDailyDone ? (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  {lang === 'am' ? 'ውጤት ይመልከቱ' : 'View Results'}
                </>
              ) : (
                <>
                  <Calendar className="w-4 h-4 mr-2" />
                  {lang === 'am' ? 'ጀምር' : 'Play Today'}
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Game Modes Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-1 border-b border-border">
            <h2 className="text-lg font-bold font-serif text-foreground tracking-wide uppercase">
              {lang === 'am' ? 'የጨዋታ ዓይነቶች' : 'Select Game Mode'}
            </h2>
            <span className="text-xs font-semibold text-muted-foreground">
              {lang === 'am' ? 'ብቻ ወይም ከጓደኞች ጋር' : 'Solo & Multiplayer'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Mode 1: Classic Study */}
            <Card
              className="border-border hover:border-foreground/40 transition-all cursor-pointer group flex flex-col justify-between"
              onClick={() => handleStartMode('solo')}
            >
              <CardHeader className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-lg bg-secondary border border-border flex items-center justify-center text-foreground group-hover:border-foreground/30">
                    <BookOpen className="w-5 h-5 text-gold-dark dark:text-gold" />
                  </div>
                  <Badge variant="outline">{lang === 'am' ? 'ነጻ ምርጫ' : 'Customizable'}</Badge>
                </div>
                <CardTitle className="text-xl font-bold font-serif text-foreground">
                  {t('modeSolo', lang)}
                </CardTitle>
                <CardDescription>
                  {t('modeSoloDesc', lang)}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0 flex items-center justify-between text-xs font-semibold text-muted-foreground border-t border-border mt-3 pt-3">
                <span>{lang === 'am' ? 'ብሉይና ሐዲስ ኪዳን • ምዕራፎች' : 'Filter by Testament & Category'}</span>
                <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-transform" />
              </CardContent>
            </Card>

            {/* Mode 2: Survival Rush */}
            <Card
              className="border-border hover:border-foreground/40 transition-all cursor-pointer group flex flex-col justify-between"
              onClick={() => handleStartMode('survival')}
            >
              <CardHeader className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-lg bg-secondary border border-border flex items-center justify-center text-foreground group-hover:border-foreground/30">
                    <ShieldAlert className="w-5 h-5 text-red-600 dark:text-red-400" />
                  </div>
                  <Badge variant="destructive">{lang === 'am' ? '3 ሕይወት' : '3 Lives'}</Badge>
                </div>
                <CardTitle className="text-xl font-bold font-serif text-foreground">
                  {t('modeSurvival', lang)}
                </CardTitle>
                <CardDescription>
                  {t('modeSurvivalDesc', lang)}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0 flex items-center justify-between text-xs font-semibold text-muted-foreground border-t border-border mt-3 pt-3">
                <span>{lang === 'am' ? 'የጥንካሬ ፈተና • ፈጣን ፍጥነት' : 'Sudden Death • Highest Streak'}</span>
                <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-transform" />
              </CardContent>
            </Card>

            {/* Mode 3: Online Multiplayer */}
            <Card
              className="border-border hover:border-foreground/40 transition-all cursor-pointer group flex flex-col justify-between"
              onClick={() => handleStartMode('online')}
            >
              <CardHeader className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-lg bg-secondary border border-border flex items-center justify-center text-foreground group-hover:border-foreground/30">
                    <Users className="w-5 h-5 text-gold-dark dark:text-gold" />
                  </div>
                  <Badge variant="gold">{lang === 'am' ? 'የቀጥታ ክፍል' : 'Live Room'}</Badge>
                </div>
                <CardTitle className="text-xl font-bold font-serif text-foreground">
                  {t('modeOnline', lang)}
                </CardTitle>
                <CardDescription>
                  {t('modeOnlineDesc', lang)}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0 flex items-center justify-between text-xs font-semibold text-muted-foreground border-t border-border mt-3 pt-3">
                <span>{lang === 'am' ? 'ክፍል ይፍጠሩ • በኮድ ይጋብዙ' : '6-Digit Code • Real-Time Scoring'}</span>
                <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-transform" />
              </CardContent>
            </Card>

            {/* Mode 4: Pass & Play (Local Multiplayer) */}
            <Card
              className="border-border hover:border-foreground/40 transition-all cursor-pointer group flex flex-col justify-between"
              onClick={() => handleStartMode('local')}
            >
              <CardHeader className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-lg bg-secondary border border-border flex items-center justify-center text-foreground group-hover:border-foreground/30">
                    <Compass className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <Badge variant="secondary">{lang === 'am' ? 'በአንድ ስልክ' : 'Same Device'}</Badge>
                </div>
                <CardTitle className="text-xl font-bold font-serif text-foreground">
                  {t('modePassPlay', lang)}
                </CardTitle>
                <CardDescription>
                  {t('modePassPlayDesc', lang)}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0 flex items-center justify-between text-xs font-semibold text-muted-foreground border-t border-border mt-3 pt-3">
                <span>{lang === 'am' ? 'ተራ በተራ ማስተላለፍ' : 'Turn-by-Turn Local Head-to-Head'}</span>
                <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-transform" />
              </CardContent>
            </Card>

          </div>
        </div>

        {/* Global Statistics & Trust Strip */}
        <div className="rounded-xl border border-border bg-card p-6 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-sm">
          <div className="grid grid-cols-3 gap-6 sm:gap-12 text-center sm:text-left w-full sm:w-auto">
            <div>
              <div className="text-2xl font-bold font-serif text-foreground">475</div>
              <div className="text-xs font-medium text-muted-foreground">
                {lang === 'am' ? 'የመጽሐፍ ቅዱስ ጥያቄዎች' : 'Scripture Questions'}
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold font-serif text-gold-dark dark:text-gold">66</div>
              <div className="text-xs font-medium text-muted-foreground">
                {lang === 'am' ? 'የመጽሐፍ ቅዱስ መጻሕፍት' : 'Books of the Bible'}
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold font-serif text-emerald-700 dark:text-emerald-400">100%</div>
              <div className="text-xs font-medium text-muted-foreground">
                {lang === 'am' ? 'በጥቅስ የተረጋገጠ' : 'Verse-Verified'}
              </div>
            </div>
          </div>

          <Button
            variant="outline"
            onClick={() => navigate('/leaderboard')}
            className="font-semibold gap-2 w-full sm:w-auto"
          >
            <Trophy className="w-4 h-4 text-gold-dark dark:text-gold" />
            <span>{lang === 'am' ? 'የደረጃ ሰንጠረዥ ይመልከቱ' : 'Community Leaderboard'}</span>
          </Button>
        </div>

      </main>
    </>
  );
}
