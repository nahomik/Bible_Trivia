import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { sound } from '../utils/audio';
import { cleanText, getScriptureVerse, getScriptureStory } from '../utils/scriptureHelper';
import { BookOpen, CheckCircle2, XCircle, Sparkles, Lightbulb, Clock } from 'lucide-react';

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
  if (!question) return null;

  const verseRef = getScriptureVerse(question);
  const story = getScriptureStory(question);

  const cleanOption = (text) => cleanText(text);

  const getOptionClasses = (index) => {
    if (hiddenOptionIndices.includes(index)) {
      return 'opacity-20 pointer-events-none scale-95 border-dashed';
    }
    if (!showResult) {
      if (selectedAnswer === index) {
        return 'border-primary ring-2 ring-primary bg-primary/10 shadow-md';
      }
      return 'border-border bg-card hover:border-primary/60 hover:bg-accent/60 shadow-sm';
    }
    if (index === question.correctAnswer) {
      return 'border-emerald-500 bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 ring-2 ring-emerald-500 shadow-lg';
    }
    if (selectedAnswer === index && index !== question.correctAnswer) {
      return 'border-destructive bg-destructive/15 text-destructive ring-2 ring-destructive';
    }
    return 'border-border/60 opacity-60';
  };

  const handleOptionClick = (index) => {
    if (showResult || hiddenOptionIndices.includes(index)) return;
    sound.playClick();
    onAnswer(index);
  };

  return (
    <Card className="w-full border-border bg-card shadow-lg overflow-hidden relative transition-all">
      {/* Top accent bar */}
      <div className="h-1.5 w-full bg-gradient-to-r from-indigo-500 via-amber-400 to-indigo-600" />

      <CardHeader className="p-6 pb-4">
        {/* Header Badges & Meta */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-primary" />
              Question {questionNumber} of {totalQuestions}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge variant="gold" className="flex items-center gap-1">
              <BookOpen className="w-3 h-3" />
              {cleanText(question.book)}
            </Badge>
            <Badge variant="outline">{question.testament} Testament</Badge>
            <Badge variant="secondary">{question.category}</Badge>
            <Badge variant="outline">{question.difficulty}</Badge>
          </div>
        </div>

        {/* Scripture Hint if Lifeline was activated */}
        {showHint && (
          <div className="flex items-start gap-3 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 text-sm mb-3 animate-in fade-in slide-in-from-top-2 duration-300">
            <Lightbulb className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <strong className="block text-amber-600 dark:text-amber-400 font-bold mb-0.5">Divine Insight:</strong>
              <span>{story}</span>
            </div>
          </div>
        )}

        {/* Question Text */}
        <CardTitle className="text-xl sm:text-2xl font-extrabold text-foreground leading-snug mt-1">
          {cleanText(question.question)}
        </CardTitle>
      </CardHeader>

      <CardContent className="p-6 pt-2">
        {/* 4 Balanced Options Grid - Equalized min-height so no option baits length */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mb-6">
          {question.options.map((option, index) => {
            const letter = String.fromCharCode(65 + index);
            const isCorrectOption = showResult && index === question.correctAnswer;
            const isWrongSelected = showResult && selectedAnswer === index && index !== question.correctAnswer;

            return (
              <button
                key={index}
                onClick={() => handleOptionClick(index)}
                disabled={showResult || hiddenOptionIndices.includes(index)}
                className={`relative flex items-center min-h-[68px] p-4 rounded-xl border-2 text-left font-semibold text-base transition-all duration-200 cursor-pointer ${getOptionClasses(index)}`}
              >
                {/* Letter Circle */}
                <span className={`w-9 h-9 rounded-full shrink-0 flex items-center justify-center font-bold text-sm mr-3 border transition-colors ${
                  isCorrectOption
                    ? 'bg-emerald-500 text-white border-emerald-500 shadow-sm'
                    : isWrongSelected
                    ? 'bg-destructive text-white border-destructive'
                    : 'bg-muted border-border text-foreground'
                }`}>
                  {letter}
                </span>

                {/* Option Text with uniform styling */}
                <span className="flex-1 text-foreground leading-snug pr-2">
                  {cleanOption(option)}
                </span>

                {/* Status Icon Indicator */}
                {isCorrectOption && (
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                )}
                {isWrongSelected && (
                  <XCircle className="w-5 h-5 text-destructive shrink-0" />
                )}
              </button>
            );
          })}
        </div>

        {/* Real-time Scripture Verse & Story Narrative Reveal */}
        {showResult && (
          <div className="mt-4 rounded-2xl border border-border bg-muted/40 p-5 shadow-sm animate-in fade-in zoom-in-95 duration-300">
            {/* Status Header */}
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-3 border-b border-border/60">
              <div className="flex items-center gap-2">
                {selectedAnswer === question.correctAnswer ? (
                  <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-extrabold text-lg">
                    <Sparkles className="w-5 h-5 text-emerald-500" />
                    <span>Correct Answer!</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 text-destructive font-extrabold text-lg">
                    <XCircle className="w-5 h-5 text-destructive" />
                    <span>{selectedAnswer === -1 ? "Time's Up!" : "Incorrect"}</span>
                  </div>
                )}
              </div>

              {/* Exact Verse Citation Badge */}
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-700 dark:text-amber-300 font-bold text-sm">
                <BookOpen className="w-4 h-4 text-amber-500" />
                <span>Scripture: {verseRef}</span>
              </div>
            </div>

            {/* If wrong, clearly remind correct answer */}
            {selectedAnswer !== question.correctAnswer && (
              <div className="text-sm font-semibold text-foreground/90 mb-3 bg-card/60 p-2.5 rounded-lg border border-border/60">
                Correct answer was: <strong className="text-emerald-600 dark:text-emerald-400">{cleanOption(question.options[question.correctAnswer])}</strong>
              </div>
            )}

            {/* Scripture Story & Context to Read */}
            <div className="text-left space-y-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1">
                📖 Biblical Story &amp; Context
              </span>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                {story}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
