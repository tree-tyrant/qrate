import { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Label } from './ui/label';
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
  const progress = ((currentQuestion + 1) / questions.length) * 100;

  const handleAnswer = (value: string) => {
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
  };

  const getCurrentAnswer = () => {
    const answer = answers.find(a => a.questionId === currentQuestionData.id);
    return answer?.answer || (currentQuestionData.type === 'multiple' ? [] : '');
  };

  const canProceed = () => {
    const answer = getCurrentAnswer();
    if (currentQuestionData.type === 'multiple') {
      return Array.isArray(answer) && answer.length > 0;
    }
    return answer !== '';
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      handleSubmit();
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    // Convert quiz answers to preferences format
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

    onComplete(preferences);
  };

  const generateGenrePreferences = () => {
    const genreAnswers = answers.find(a => a.questionId === 'genres')?.answer as string[] || [];
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
  };

  const generateArtistPreferences = () => {
    // Generate mock artists based on genre preferences
    const mockArtists = [
      'Taylor Swift', 'Drake', 'The Weeknd', 'Dua Lipa', 'Bad Bunny',
      'Olivia Rodrigo', 'Post Malone', 'Billie Eilish', 'Harry Styles', 'Ariana Grande'
    ];

    return mockArtists.slice(0, 5).map((artist, index) => ({
      name: artist,
      weight: Math.max(80 - (index * 15), 30) + Math.random() * 20
    }));
  };

  const generateTrackPreferences = () => {
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
  };

  const isSelected = (value: string) => {
    const answer = getCurrentAnswer();
    if (currentQuestionData.type === 'multiple') {
      return Array.isArray(answer) && answer.includes(value);
    }
    return answer === value;
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl px-[50px] py-[100px]">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <Button variant="ghost" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Music className="w-4 h-4" />
            Question {currentQuestion + 1} of {questions.length}
          </div>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">
            {currentQuestionData.title}
          </CardTitle>
          <CardDescription>
            {currentQuestionData.subtitle}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3">
            {currentQuestionData.options.map((option) => (
              <Button
                key={option.value}
                variant={isSelected(option.value) ? "default" : "outline"}
                className="justify-start p-4 h-auto text-left"
                onClick={() => handleAnswer(option.value)}
              >
                <span className="text-lg mr-3">{option.emoji}</span>
                <span>{option.label}</span>
              </Button>
            ))}
          </div>

          <div className="flex justify-between pt-6">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentQuestion === 0}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Previous
            </Button>

            <Button
              onClick={handleNext}
              disabled={!canProceed() || submitting}
              className="min-w-[120px]"
            >
              {submitting ? (
                'Submitting...'
              ) : currentQuestion === questions.length - 1 ? (
                'Complete Quiz'
              ) : (
                <>
                  Next
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}