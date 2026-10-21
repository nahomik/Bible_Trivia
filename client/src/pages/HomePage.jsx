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
  Zap,
  Users,
  Globe,
  Trophy,
  ChevronRight,
  Sparkles,
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
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-10">
        {/* Verse of the Day Banner */}
        <div className="relative overflow-hidden rounded-2xl border border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-background to-indigo-500/10 p-5 sm:p-6 shadow-sm">
          <div className="flex items-start sm:items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center shrink-0 text-amber-500">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <p className="font-serif italic text-base sm:text-lg text-foreground font-semibold leading-relaxed">
                &ldquo;{verse.text}&rdquo;
              </p>
              <span className="text-xs sm:text-sm font-bold text-amber-600 dark:text-amber-400 mt-1 inline-block">
                — {verse.ref}
              </span>
            </div>
          </div>
        </div>

        {/* Hero Section */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-primary/20 bg-primary/10 text-xs font-bold text-primary shadow-sm">
            <span>✝️</span> {lang === 'am' ? 'ከ 5,150+ በላይ የመጽሐፍ ቅዱስ ጥያቄዎች • በሁሉም 66ቱ መጻሕፍት' : 'Over 5,150+ Scripture Questions • All 66 Books • English & አማርኛ'}
          </div>
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-foreground">
            {lang === 'am' ? (
              <>የመጽሐፍ ቅዱስ <span className="bg-gradient-to-r from-amber-500 via-indigo-500 to-purple-600 bg-clip-text text-transparent">ዕውቀት ውድድር</span></>
            ) : (
              <>Bible Trivia <span className="bg-gradient-to-r from-amber-500 via-indigo-500 to-purple-600 bg-clip-text text-transparent">Challenge</span></>
            )}
          </h1>
          <p className="text-muted-foreground text-base sm:text-xl leading-relaxed">
            {lang === 'am'
              ? 'ከኦሪት ዘፍጥረት እስከ ዮሐንስ ራእይ ድረስ ያለዎትን የመጽሐፍ ቅዱስ ዕውቀት ይፈትሹ። ከእያንዳንዱ መልስ በኋላ በሚቀርቡት የመጽሐፍ ቅዱስ ታሪኮችና ጥቅሶች መንፈሳዊ ዕውቀትዎን ያሳድጉ።'
              : 'Test your knowledge of the Word of God from Genesis to Revelation. Deepen your faith with exact verse references and inspiring biblical stories after every answer.'}
          </p>
        </div>

        {/* Daily Challenge Highlight Card */}
        <Card
          className="border-2 border-amber-500/40 bg-gradient-to-br from-amber-500/10 via-card to-indigo-500/5 shadow-md hover:shadow-xl hover:border-amber-500 transition-all cursor-pointer group"
          onClick={() => handleStartMode('daily')}
        >
          <CardContent className="p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <div className="flex items-center gap-2">
                <Badge variant="gold" className="gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  Daily Scripture Challenge
                </Badge>
                {dailyStreak > 0 && (
                  <Badge variant="destructive" className="gap-1 bg-amber-500 border-none font-bold">
                    <Flame className="w-3.5 h-3.5 text-white" />
                    {dailyStreak} Day Streak
                  </Badge>
                )}
              </div>
              <CardTitle className="text-2xl sm:text-3xl font-extrabold text-foreground group-hover:text-primary transition-colors">
                Today&apos;s 5 Scripture Questions
              </CardTitle>
              <CardDescription className="text-base text-muted-foreground">
                {isDailyDone
                  ? `Completed today! You scored ${dailyResult?.score || 0}/${dailyResult?.total || 5}. Check back tomorrow to maintain your holy streak!`
                  : "Play today's curated questions. Every believer worldwide receives the exact same 5 questions today."}
              </CardDescription>
            </div>

            <Button
              variant={isDailyDone ? 'outline' : 'gold'}
              size="lg"
              className="gap-2 font-bold shrink-0 w-full md:w-auto"
            >
              {isDailyDone ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  Completed Today
                </>
              ) : (
                <>
                  Play Today&apos;s 5
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Game Modes Section */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
                {lang === 'am' ? 'የጨዋታ ዓይነት ይምረጡ' : 'Select Game Mode'}
              </h2>
              <p className="text-sm text-muted-foreground">
                {lang === 'am' ? 'የመጽሐፍ ቅዱስ ጉዞዎን ይምረጡ' : 'Choose your pathway through the Scriptures'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {/* Solo Journey */}
            <Card
              className="border-border hover:border-primary/60 hover:shadow-lg transition-all cursor-pointer group flex flex-col justify-between"
              onClick={() => handleStartMode('solo')}
            >
              <CardHeader className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                    <BookOpen className="w-6 h-6" />
                  </div>
                  <Badge variant="secondary">{lang === 'am' ? 'መደበኛ' : 'Classic'}</Badge>
                </div>
                <CardTitle className="text-xl font-bold group-hover:text-primary transition-colors">
                  {t('modeSolo', lang)}
                </CardTitle>
                <CardDescription>
                  {t('modeSoloDesc', lang)}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0 flex items-center justify-between text-xs font-semibold text-muted-foreground border-t border-border/40 mt-4 pt-4">
                <span>{lang === 'am' ? '🎯 የሚስተካከሉ ሕጎች' : '🎯 Customizable Rules'}</span>
                <ChevronRight className="w-4 h-4 text-primary group-hover:translate-x-1 transition-transform" />
              </CardContent>
            </Card>

            {/* Survival Rush */}
            <Card
              className="border-border hover:border-destructive/60 hover:shadow-lg transition-all cursor-pointer group flex flex-col justify-between"
              onClick={() => handleStartMode('survival')}
            >
              <CardHeader className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-xl bg-destructive/10 border border-destructive/20 flex items-center justify-center text-destructive group-hover:scale-110 transition-transform">
                    <ShieldAlert className="w-6 h-6" />
                  </div>
                  <Badge variant="destructive">{lang === 'am' ? 'ከፍተኛ ፉክክር' : 'High Stakes'}</Badge>
                </div>
                <CardTitle className="text-xl font-bold group-hover:text-destructive transition-colors">
                  {t('modeSurvival', lang)}
                </CardTitle>
                <CardDescription>
                  {t('modeSurvivalDesc', lang)}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0 flex items-center justify-between text-xs font-semibold text-muted-foreground border-t border-border/40 mt-4 pt-4">
                <span>{lang === 'am' ? '❤️❤️❤️ 3 ዕድሎች' : '❤️❤️❤️ 3 Lives'}</span>
                <ChevronRight className="w-4 h-4 text-destructive group-hover:translate-x-1 transition-transform" />
              </CardContent>
            </Card>

            {/* Speed Blitz */}
            <Card
              className="border-border hover:border-amber-500/60 hover:shadow-lg transition-all cursor-pointer group flex flex-col justify-between"
              onClick={() => handleStartMode('blitz')}
            >
              <CardHeader className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 group-hover:scale-110 transition-transform">
                    <Zap className="w-6 h-6" />
                  </div>
                  <Badge variant="gold">{lang === 'am' ? '60 ሰከንድ' : '60s Sprint'}</Badge>
                </div>
                <CardTitle className="text-xl font-bold group-hover:text-amber-500 transition-colors">
                  {t('modeBlitz', lang)}
                </CardTitle>
                <CardDescription>
                  {t('modeBlitzDesc', lang)}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0 flex items-center justify-between text-xs font-semibold text-muted-foreground border-t border-border/40 mt-4 pt-4">
                <span>{lang === 'am' ? '⏱️ 60 ሰከንድ ሰዓት ቆጣሪ' : '⏱️ 60s Total Timer'}</span>
                <ChevronRight className="w-4 h-4 text-amber-500 group-hover:translate-x-1 transition-transform" />
              </CardContent>
            </Card>

            {/* Pass & Play */}
            <Card
              className="border-border hover:border-emerald-500/60 hover:shadow-lg transition-all cursor-pointer group flex flex-col justify-between"
              onClick={() => handleStartMode('local')}
            >
              <CardHeader className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 group-hover:scale-110 transition-transform">
                    <Users className="w-6 h-6" />
                  </div>
                  <Badge variant="success">{lang === 'am' ? 'ኅብረት' : 'Fellowship'}</Badge>
                </div>
                <CardTitle className="text-xl font-bold group-hover:text-emerald-500 transition-colors">
                  {t('modePassPlay', lang)}
                </CardTitle>
                <CardDescription>
                  {t('modePassPlayDesc', lang)}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0 flex items-center justify-between text-xs font-semibold text-muted-foreground border-t border-border/40 mt-4 pt-4">
                <span>{lang === 'am' ? '📱 ከ 2-8 ተጫዋቾች በአንድ ስልክ' : '📱 2-8 Local Players'}</span>
                <ChevronRight className="w-4 h-4 text-emerald-500 group-hover:translate-x-1 transition-transform" />
              </CardContent>
            </Card>

            {/* Online Multiplayer */}
            <Card
              className="border-border hover:border-primary/60 hover:shadow-lg transition-all cursor-pointer group flex flex-col justify-between"
              onClick={() => handleStartMode('online')}
            >
              <CardHeader className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                    <Globe className="w-6 h-6" />
                  </div>
                  <Badge variant="secondary">{lang === 'am' ? 'የቀጥታ' : 'Real-Time'}</Badge>
                </div>
                <CardTitle className="text-xl font-bold group-hover:text-primary transition-colors">
                  {t('modeOnline', lang)}
                </CardTitle>
                <CardDescription>
                  {t('modeOnlineDesc', lang)}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0 flex items-center justify-between text-xs font-semibold text-muted-foreground border-t border-border/40 mt-4 pt-4">
                <span>{lang === 'am' ? '⚡ የቀጥታ ግንኙነት' : '⚡ Live WebSockets'}</span>
                <ChevronRight className="w-4 h-4 text-primary group-hover:translate-x-1 transition-transform" />
              </CardContent>
            </Card>

            {/* Global Leaderboard Card */}
            <Card
              className="border-border hover:border-amber-500/60 hover:shadow-lg transition-all cursor-pointer group flex flex-col justify-between bg-gradient-to-br from-card to-amber-500/5"
              onClick={() => navigate('/leaderboard')}
            >
              <CardHeader className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 group-hover:scale-110 transition-transform">
                    <Trophy className="w-6 h-6" />
                  </div>
                  <Badge variant="gold">{lang === 'am' ? 'አሸናፊዎች' : 'Champions'}</Badge>
                </div>
                <CardTitle className="text-xl font-bold group-hover:text-amber-500 transition-colors">
                  {lang === 'am' ? 'የደረጃ ሰንጠረዥ' : 'Global Leaderboard'}
                </CardTitle>
                <CardDescription>
                  {lang === 'am'
                    ? 'ከዓለም ዙሪያ ካሉ አማኞች ጋር በውጤትና በትክክለኛነት ደረጃዎን ይመልከቱ።'
                    : 'See where you rank against believers worldwide in score, streaks, and biblical accuracy.'}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0 flex items-center justify-between text-xs font-semibold text-muted-foreground border-t border-border/40 mt-4 pt-4">
                <span>{lang === 'am' ? '🏆 የማኅበረሰብ ሰሌዳ' : '🏆 Community Podiums'}</span>
                <ChevronRight className="w-4 h-4 text-amber-500 group-hover:translate-x-1 transition-transform" />
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Global Statistics Banner */}
        <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-sm">
          <div className="grid grid-cols-3 gap-6 sm:gap-12 text-center sm:text-left w-full sm:w-auto">
            <div>
              <div className="text-2xl sm:text-3xl font-extrabold text-primary">5,150+</div>
              <div className="text-xs sm:text-sm font-semibold text-muted-foreground">
                {lang === 'am' ? 'የመጽሐፍ ቅዱስ ጥያቄዎች' : 'Scripture Questions'}
              </div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-extrabold text-amber-500">66</div>
              <div className="text-xs sm:text-sm font-semibold text-muted-foreground">
                {lang === 'am' ? 'የመጽሐፍ ቅዱስ መጻሕፍት' : 'Books of the Bible'}
              </div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-extrabold text-emerald-500">100%</div>
              <div className="text-xs sm:text-sm font-semibold text-muted-foreground">
                {lang === 'am' ? 'በእግዚአብሔር ቃል ላይ' : 'Biblically Rooted'}
              </div>
            </div>
          </div>

          <Button
            variant="outline"
            size="lg"
            onClick={() => navigate('/leaderboard')}
            className="font-bold gap-2 w-full sm:w-auto"
          >
            <Trophy className="w-4 h-4 text-amber-500" />
            {lang === 'am' ? 'የደረጃ ሰንጠረዥ ይመልከቱ' : 'View Community Rankings'}
          </Button>
        </div>
      </main>
    </>
  );
}
