import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { useGame } from '../context/GameContext';
import { sound } from '../utils/audio';
import { cleanText, getScriptureVerse, getScriptureStory } from '../utils/scriptureHelper';
import { getLocalizedQuestion, t } from '../utils/translations';
import { BookOpen, CheckCircle2, XCircle, Lightbulb, Clock, Check, X } from 'lucide-react';

export default function QuestionCard({
  question,
  onAnswer,
  selectedAnswer,
  showResult,
  questionNumber,
  totalQuestions,
  hiddenOptionIndices = [],
  showHint = false
}) {
  const { state } = useGame();
  if (!question) return null;

  const currentLang = state?.language || 'en';
  const localizedQ = getLocalizedQuestion(question, currentLang);
  const verseRef = getScriptureVerse(localizedQ);
  const story = getScriptureStory(localizedQ);

  const cleanOption = (text) => cleanText(text);

  const getOptionClasses = (index) => {
    if (hiddenOptionIndices.includes(index)) {
      return 'opacity-25 pointer-events-none border-dashed bg-muted/40';
    }
    if (!showResult) {
      if (selectedAnswer === index) {
        return 'border-foreground bg-secondary ring-2 ring-foreground/20 shadow-sm';
      }
      return 'border-border bg-card hover:border-foreground/40 hover:bg-secondary/60 shadow-sm';
    }
    if (index === question.correctAnswer) {
      return 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-950 dark:text-emerald-200 ring-2 ring-emerald-500/30';
    }
    if (selectedAnswer === index && index !== question.correctAnswer) {
      return 'border-red-600 bg-red-50 dark:bg-red-950/40 text-red-950 dark:text-red-200 ring-2 ring-red-500/30';
    }
    return 'border-border/60 opacity-50 bg-card';
  };

  const handleOptionClick = (index) => {
    if (showResult || hiddenOptionIndices.includes(index)) return;
    sound.playClick();
    onAnswer(index);
  };

  return (
    <Card className="w-full border-border bg-card shadow-sm transition-all overflow-hidden">
      <CardHeader className="p-5 sm:p-7 pb-4">
        {/* Header Meta Strip */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4 pb-3 border-b border-border">
          <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <Clock className="w-3.5 h-3.5 text-gold-dark dark:text-gold" />
            <span>
              {t('question', currentLang)} {questionNumber} {t('of', currentLang)} {totalQuestions}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <Badge variant="gold" className="gap-1 font-bold">
              <BookOpen className="w-3 h-3" />
              {cleanText(localizedQ.book)}
            </Badge>
            <Badge variant="outline">{localizedQ.testament}</Badge>
            <Badge variant="secondary">{localizedQ.category}</Badge>
            <Badge variant="outline">{localizedQ.difficulty}</Badge>
          </div>
        </div>

        {/* Lifeline Divine Hint */}
        {showHint && (
          <div className="flex items-start gap-3 p-3.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700/60 text-amber-950 dark:text-amber-200 text-sm mb-4">
            <Lightbulb className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div>
              <strong className="block text-amber-800 dark:text-amber-400 font-bold mb-0.5">
                {currentLang === 'am' ? 'መንፈሳዊ ፍንጭ፡' : 'Scripture Insight:'}
              </strong>
              <span>{story}</span>
            </div>
          </div>
        )}

        {/* Question Heading */}
        <CardTitle className="text-xl sm:text-2xl font-bold font-sans text-foreground leading-snug">
          {cleanText(localizedQ.question)}
        </CardTitle>
      </CardHeader>

      <CardContent className="p-5 sm:p-7 pt-2">
        {/* 4 Multiple Choice Option Tiles */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          {localizedQ.options.map((option, index) => {
            const letter = String.fromCharCode(65 + index);
            const isCorrectOption = showResult && index === question.correctAnswer;
            const isWrongSelected = showResult && selectedAnswer === index && index !== question.correctAnswer;

            return (
              <button
                key={index}
                onClick={() => handleOptionClick(index)}
                disabled={showResult || hiddenOptionIndices.includes(index)}
                className={`relative flex items-center min-h-[64px] p-3.5 sm:p-4 rounded-lg border-2 text-left font-medium text-base transition-all duration-150 cursor-pointer ${getOptionClasses(index)}`}
              >
                {/* Letter Box */}
                <span className={`w-8 h-8 rounded-md shrink-0 flex items-center justify-center font-bold text-xs mr-3 border transition-colors ${
                  isCorrectOption
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : isWrongSelected
                    ? 'bg-red-600 text-white border-red-600'
                    : 'bg-secondary border-border text-foreground'
                }`}>
                  {letter}
                </span>

                {/* Option Text */}
                <span className="flex-1 text-foreground leading-snug pr-2 font-medium">
                  {cleanOption(option)}
                </span>

                {/* Status Indicator */}
                {isCorrectOption && (
                  <Check className="w-5 h-5 text-emerald-600 shrink-0 stroke-[2.5]" />
                )}
                {isWrongSelected && (
                  <X className="w-5 h-5 text-red-600 shrink-0 stroke-[2.5]" />
                )}
              </button>
            );
          })}
        </div>

        {/* Scripture Study & Explanation Box */}
        {showResult && (
          <div className="mt-4 rounded-lg border border-border bg-secondary/50 p-4 sm:p-5">
            {/* Answer Status & Verse Reference */}
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-3 border-b border-border/80">
              <div className="flex items-center gap-2">
                {selectedAnswer === question.correctAnswer ? (
                  <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-bold text-base">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span>{currentLang === 'am' ? 'ትክክለኛ መልስ!' : 'Correct Answer!'}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 text-red-700 dark:text-red-400 font-bold text-base">
                    <XCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
                    <span>
                      {selectedAnswer === -1
                        ? t('timesUp', currentLang)
                        : (currentLang === 'am' ? 'ትክክል አልነበረም' : 'Incorrect')}
                    </span>
                  </div>
                )}
              </div>

              {/* Scripture Citation Badge */}
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-card border border-border text-foreground font-semibold text-xs">
                <BookOpen className="w-3.5 h-3.5 text-gold-dark dark:text-gold" />
                <span>{verseRef}</span>
              </div>
            </div>

            {/* Answer Correction reminder if incorrect */}
            {selectedAnswer !== question.correctAnswer && (
              <div className="text-sm font-semibold text-foreground mb-3 p-2.5 rounded-md bg-card border border-border">
                {currentLang === 'am' ? 'ትክክለኛው መልስ፡ ' : 'Correct answer: '}
                <strong className="text-emerald-700 dark:text-emerald-400 ml-1">
                  {cleanOption(localizedQ.options[question.correctAnswer])}
                </strong>
              </div>
            )}

            {/* Commentary note */}
            <div className="text-left space-y-1">
              <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                <span>{t('scriptureStoryHeader', currentLang)}</span>
              </div>
              <p className="text-sm text-foreground/80 leading-relaxed font-sans">
                {story}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
