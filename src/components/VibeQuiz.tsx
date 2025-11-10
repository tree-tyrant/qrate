import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Progress } from './ui/progress';
import { ArrowLeft, ArrowRight, Music } from 'lucide-react';

interface VibeQuizProps {
  spotifyData?: any;
  onComplete: (preferences: any) => void;
  onBack: () => void;
  isSubmitting?: boolean;
}

interface QuizAnswer {
  questionId: string;
  answer: string | string[];
}

export function VibeQuiz({ spotifyData, onComplete, onBack, isSubmitting: externalSubmitting }: VibeQuizProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<QuizAnswer[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submitting = externalSubmitting || isSubmitting;

  const questions = [
    {
      id: 'genres',
      title: 'What genres get you moving?',
      subtitle: 'Select all that apply',
      type: 'multiple',
      options: [
        { value: 'pop', label: '🎵 Pop', emoji: '🎵' },
        { value: 'hiphop', label: '🎤 Hip Hop', emoji: '🎤' },
        { value: 'rock', label: '🎸 Rock', emoji: '🎸' },
        { value: 'electronic', label: '🔊 Electronic', emoji: '🔊' },
        { value: 'rnb', label: '🎶 R&B', emoji: '🎶' },
        { value: 'latin', label: '🌶️ Latin', emoji: '🌶️' },
        { value: 'jazz', label: '🎺 Jazz', emoji: '🎺' },
        { value: 'indie', label: '🎧 Indie', emoji: '🎧' },
      ]
    },
    {
      id: 'energy',
      title: 'What energy level matches your vibe?',
      subtitle: 'Choose one that best describes your mood',
      type: 'single',
      options: [
        { value: 'high', label: '⚡ High Energy - Get me pumped!', emoji: '⚡' },
        { value: 'medium', label: '🎯 Medium Energy - Balanced vibes', emoji: '🎯' },
        { value: 'chill', label: '😌 Chill Energy - Keep it mellow', emoji: '😌' },
        { value: 'mixed', label: '🔄 Mixed Energy - Surprise me!', emoji: '🔄' },
      ]
    },
    {
      id: 'decades',
      title: 'Which decades speak to your soul?',
      subtitle: 'Select your favorite musical eras',
      type: 'multiple',
      options: [
        { value: '2020s', label: '🚀 2020s - Current hits', emoji: '🚀' },
        { value: '2010s', label: '📱 2010s - The decade of streaming', emoji: '📱' },
        { value: '2000s', label: '💿 2000s - Y2K vibes', emoji: '💿' },
        { value: '90s', label: '📻 90s - Classic bangers', emoji: '📻' },
        { value: '80s', label: '🌈 80s - Retro magic', emoji: '🌈' },
        { value: 'throwback', label: '⏰ Mix of all eras', emoji: '⏰' },
      ]
    },
    {
      id: 'mood',
      title: 'What mood are you bringing to this event?',
      subtitle: 'Your vibe attracts your tribe',
      type: 'single',
      options: [
        { value: 'party', label: '🎉 Party Mode - Let\'s celebrate!', emoji: '🎉' },
        { value: 'dance', label: '💃 Dance Floor - Ready to move', emoji: '💃' },
        { value: 'social', label: '🗣️ Social Vibes - Great for conversations', emoji: '🗣️' },
        { value: 'romantic', label: '💕 Romantic Feels - Love is in the air', emoji: '💕' },
        { value: 'nostalgic', label: '🌅 Nostalgic Mood - Take me back', emoji: '🌅' },
      ]
    },
    {
      id: 'explicit',
      title: 'How do you feel about explicit lyrics?',
      subtitle: 'Help us filter the playlist appropriately',
      type: 'single',
      options: [
        { value: 'any', label: '🔄 Any - I\'m cool with everything', emoji: '🔄' },
        { value: 'minimal', label: '⚠️ Minimal - Keep it mostly clean', emoji: '⚠️' },
        { value: 'none', label: '✨ Clean only - Family-friendly vibes', emoji: '✨' },
      ]
    }
  ];

  const currentQuestionData = questions[currentQuestion];
  const totalQuestions = questions.length;
  const progress = ((currentQuestion + 1) / totalQuestions) * 100;
  const isLastQuestion = currentQuestion === totalQuestions - 1;
  const firstOptionRef = useRef<HTMLButtonElement | null>(null);

  const handleAnswer = useCallback((value: string) => {
    const existingAnswerIndex = answers.findIndex(a => a.questionId === currentQuestionData.id);

    if (currentQuestionData.type === 'single') {
      const newAnswers = [...answers];
      if (existingAnswerIndex >= 0) {
        newAnswers[existingAnswerIndex] = { questionId: currentQuestionData.id, answer: value };
      } else {
        newAnswers.push({ questionId: currentQuestionData.id, answer: value });
      }
      setAnswers(newAnswers);
    } else {
      // Multiple choice
      const existingAnswer = answers[existingAnswerIndex];
      const currentSelections = Array.isArray(existingAnswer?.answer) ? existingAnswer.answer : [];

      let newSelections;
      if (currentSelections.includes(value)) {
        newSelections = currentSelections.filter(v => v !== value);
      } else {
        newSelections = [...currentSelections, value];
      }
      
      const newAnswers = [...answers];
      if (existingAnswerIndex >= 0) {
        newAnswers[existingAnswerIndex] = { questionId: currentQuestionData.id, answer: newSelections };
      } else {
        newAnswers.push({ questionId: currentQuestionData.id, answer: newSelections });
      }
      setAnswers(newAnswers);
    }
  }, [answers, currentQuestionData.id, currentQuestionData.type]);

  const getCurrentAnswer = useCallback(() => {
    const answer = answers.find(a => a.questionId === currentQuestionData.id);
    return answer?.answer || (currentQuestionData.type === 'multiple' ? [] : '');
  }, [answers, currentQuestionData.id, currentQuestionData.type]);

  const canProceed = useMemo(() => {
    const answer = getCurrentAnswer();
    if (currentQuestionData.type === 'multiple') {
      return Array.isArray(answer) && answer.length > 0;
    }
    return answer !== '';
  }, [currentQuestionData.type, getCurrentAnswer]);

  const generateGenrePreferences = useCallback(() => {
    const genreAnswers = (answers.find(a => a.questionId === 'genres')?.answer as string[]) || [];
    const genreMap: Record<string, string> = {
      'pop': 'Pop',
      'hiphop': 'Hip Hop',
      'rock': 'Rock',
      'electronic': 'Electronic',
      'rnb': 'R&B',
      'latin': 'Latin',
      'jazz': 'Jazz',
      'indie': 'Indie'
    };

    return genreAnswers.map((genre, index) => ({
      name: genreMap[genre] || genre,
      weight: Math.max(50 - (index * 10), 20) + Math.random() * 10
    }));
  }, [answers]);

  const generateArtistPreferences = useCallback(() => {
    // Generate mock artists based on genre preferences
    const mockArtists = [
      'Taylor Swift', 'Drake', 'The Weeknd', 'Dua Lipa', 'Bad Bunny',
      'Olivia Rodrigo', 'Post Malone', 'Billie Eilish', 'Harry Styles', 'Ariana Grande'
    ];

    return mockArtists.slice(0, 5).map((artist, index) => ({
      name: artist,
      weight: Math.max(80 - (index * 15), 30) + Math.random() * 20
    }));
  }, []);

  const generateTrackPreferences = useCallback(() => {
    // Generate mock tracks
    const mockTracks = [
      { id: '1', name: 'Blinding Lights', artists: [{ name: 'The Weeknd' }], popularity: 95 },
      { id: '2', name: 'Levitating', artists: [{ name: 'Dua Lipa' }], popularity: 89 },
      { id: '3', name: 'Anti-Hero', artists: [{ name: 'Taylor Swift' }], popularity: 92 },
      { id: '4', name: 'As It Was', artists: [{ name: 'Harry Styles' }], popularity: 88 },
      { id: '5', name: 'Unholy', artists: [{ name: 'Sam Smith' }], popularity: 85 }
    ];

    return mockTracks.map((track, index) => ({
      ...track,
      weight: Math.max(90 - (index * 10), 40) + Math.random() * 20
    }));
  }, []);

  const handleSubmit = useCallback(async () => {
    setIsSubmitting(true);

    const preferences = {
      isQuizResponse: true,
      genres: answers.find(a => a.questionId === 'genres')?.answer || [],
      energy: answers.find(a => a.questionId === 'energy')?.answer || 'medium',
      decades: answers.find(a => a.questionId === 'decades')?.answer || [],
      mood: answers.find(a => a.questionId === 'mood')?.answer || 'social',
      explicitPreference: answers.find(a => a.questionId === 'explicit')?.answer || 'any',
      completedAt: new Date().toISOString(),
      // Generate mock preference data based on quiz answers
      topGenres: generateGenrePreferences(),
      topArtists: generateArtistPreferences(),
      topTracks: generateTrackPreferences()
    };

    try {
      await Promise.resolve(onComplete(preferences));
      if (typeof window !== 'undefined') {
        confetti({ particleCount: 70, spread: 60, origin: { y: 0.7 } });
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [answers, generateArtistPreferences, generateGenrePreferences, generateTrackPreferences, onComplete]);

  const advance = useCallback(
    async (allowIncomplete = false) => {
      if (!allowIncomplete && !canProceed) return;

      if (currentQuestion < totalQuestions - 1) {
        setCurrentQuestion(prev => Math.min(prev + 1, totalQuestions - 1));
      } else {
        await handleSubmit();
      }
    },
    [canProceed, currentQuestion, handleSubmit, totalQuestions]
  );

  const handlePrevious = useCallback(() => {
    setCurrentQuestion(prev => Math.max(prev - 1, 0));
  }, []);

  const handleSelectAndAdvance = useCallback(
    (value: string) => {
      handleAnswer(value);
      if (currentQuestionData.type === 'single') {
        setTimeout(() => {
          advance();
        }, 120);
      }
    },
    [advance, currentQuestionData.type, handleAnswer]
  );

  const isSelected = (value: string) => {
    const answer = getCurrentAnswer();
    if (currentQuestionData.type === 'multiple') {
      return Array.isArray(answer) && answer.includes(value);
    }
    return answer === value;
  };

  const spotifyNudge = useMemo(() => {
    if (!spotifyData) return null;
    if (currentQuestionData.id === 'genres') {
      return 'We spotted a few genres you vibe with on Spotify—feel free to tweak!';
    }
    return null;
  }, [currentQuestionData.id, spotifyData]);

  const selectedCount = useMemo(() => {
    const answer = getCurrentAnswer();
    if (currentQuestionData.type === 'multiple') {
      return Array.isArray(answer) ? answer.length : 0;
    }
    return answer ? 1 : 0;
  }, [currentQuestionData.type, getCurrentAnswer]);

  useEffect(() => {
    firstOptionRef.current?.focus();
  }, [currentQuestion]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowRight') {
        event.preventDefault();
        if (canProceed) {
          advance();
        }
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault();
        handlePrevious();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [advance, canProceed, handlePrevious]);

  return (
    <div className="container mx-auto max-w-2xl px-5 py-8 sm:px-6 sm:py-10">
      <div className="mb-5 sm:mb-6">
        <div className="flex items-center justify-between mb-3">
          <Button variant="ghost" onClick={onBack} type="button">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
            <Music className="w-4 h-4" />
            Question {currentQuestion + 1} of {totalQuestions}
          </div>
        </div>

        <div className="flex items-center gap-2 mb-2">
          {questions.map((_, idx) => (
            <div
              key={idx}
              aria-hidden
              className={`h-2 rounded-full transition-all duration-200 ${
                idx <= currentQuestion ? 'bg-primary w-6' : 'bg-muted w-2'
              }`}
            />
          ))}
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentQuestion}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.18 }}
        >
          <Card role="group" aria-labelledby="vibe-quiz-title" aria-describedby="vibe-quiz-subtitle">
            <CardHeader className="text-center">
              <CardTitle id="vibe-quiz-title" className="text-2xl">
                {currentQuestionData.title}
              </CardTitle>
              <CardDescription id="vibe-quiz-subtitle">
                {currentQuestionData.subtitle}
              </CardDescription>
              <div className="mt-2 text-xs text-muted-foreground">
                {currentQuestionData.type === 'multiple'
                  ? 'Tip: Pick as many as you like'
                  : 'Tip: Tap an option to jump ahead'}
              </div>
              {spotifyNudge && (
                <div className="mt-2 text-xs text-primary">{spotifyNudge}</div>
              )}
            </CardHeader>
            <CardContent className="space-y-5">
              <div
                role={currentQuestionData.type === 'multiple' ? 'group' : 'radiogroup'}
                className="grid gap-2 sm:gap-3 sm:grid-cols-2"
              >
                {currentQuestionData.options.map((option, index) => {
                  const selected = isSelected(option.value);
                  return (
                    <Button
                      key={option.value}
                      type="button"
                      role={currentQuestionData.type === 'multiple' ? 'checkbox' : 'radio'}
                      aria-checked={selected}
                      variant={selected ? 'default' : 'outline'}
                      ref={index === 0 ? firstOptionRef : undefined}
                      className={`justify-start h-auto p-4 text-left transition-all border ${
                        selected ? 'ring-2 ring-primary shadow-lg shadow-primary/20' : 'hover:border-primary/40'
                      }`}
                      onClick={() =>
                        currentQuestionData.type === 'single'
                          ? handleSelectAndAdvance(option.value)
                          : handleAnswer(option.value)
                      }
                    >
                      <span className="text-xl mr-3">{option.emoji}</span>
                      <div className="flex flex-col">
                        <span className="font-medium">{option.label}</span>
                        {currentQuestionData.type === 'multiple' && selected && (
                          <span className="text-xs text-primary mt-0.5">Selected</span>
                        )}
                      </div>
                    </Button>
                  );
                })}
              </div>

              {currentQuestionData.type === 'multiple' && (
                <div className="text-xs text-muted-foreground">
                  {selectedCount > 0 ? `${selectedCount} selected` : 'No picks yet'}
                </div>
              )}

              <div className="flex items-center justify-between pt-4">
                <Button
                  variant="outline"
                  onClick={handlePrevious}
                  disabled={currentQuestion === 0 || submitting}
                  type="button"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Previous
                </Button>

                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    onClick={() => advance(true)}
                    disabled={submitting}
                    type="button"
                  >
                    Skip for now
                  </Button>
                  <Button
                    onClick={() => advance()}
                    disabled={!canProceed || submitting}
                    className="min-w-[140px]"
                    type="button"
                  >
                    {submitting ? (
                      'Submitting...'
                    ) : isLastQuestion ? (
                      'Complete Quiz'
                    ) : (
                      <>
                        Next
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}