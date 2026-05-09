import React, { useState } from 'react';
import { Lightbulb, BookOpen, GraduationCap, ChevronRight, ChevronLeft, Volume2, Clock } from 'lucide-react';

interface ELI15Explanation {
  id: string;
  originalTopic: string;
  simplifiedExplanation: string;
  analogy: string;
  visualStory: string;
  keyPoints: string[];
  difficultyLevel: 'easy' | 'medium' | 'hard';
  readingTime: number;
}

interface ELI15ModeProps {
  data?: any;
  electionData?: any;
  concept?: string;
  context?: string;
  mode?: 'analytics' | 'election' | 'concept';
}

export const ELI15Mode: React.FC<ELI15ModeProps> = ({
  data,
  electionData,
  concept,
  context,
  mode = 'analytics',
}) => {
  const [explanation, setExplanation] = useState<ELI15Explanation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentSection, setCurrentSection] = useState<number>(0);
  const [showVisual, setShowVisual] = useState(false);
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizAnswered, setQuizAnswered] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [quizResult, setQuizResult] = useState<boolean | null>(null);

  const sections = [
    { id: 'explanation', title: 'Simple Explanation', icon: Lightbulb },
    { id: 'analogy', title: 'Analogy', icon: BookOpen },
    { id: 'visual', title: 'Visual Story', icon: GraduationCap },
    { id: 'keyPoints', title: 'Key Points', icon: Lightbulb },
  ];

  const generateExplanation = async () => {
    setLoading(true);
    setError(null);

    try {
      let endpoint = '';
      let body = {};

      switch (mode) {
        case 'analytics':
          endpoint = '/api/eli15/analytics';
          body = { data: data || [] };
          break;
        case 'election':
          endpoint = '/api/eli15/election';
          body = { election: electionData };
          break;
        case 'concept':
          endpoint = '/api/eli15/concept';
          body = { concept, context };
          break;
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error('Failed to generate explanation');
      }

      const result = await response.json();
      setExplanation(result.data);
      setCurrentSection(0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate explanation');
    } finally {
      setLoading(false);
    }
  };

  const speakText = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleQuizAnswer = (answerIndex: number) => {
    setSelectedAnswer(answerIndex);
    setQuizAnswered(true);
    setQuizResult(answerIndex === 0); // Assuming first option is correct for demo
  };

  const renderSection = () => {
    if (!explanation) return null;

    switch (currentSection) {
      case 0:
        return (
          <div className="space-y-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                What this means in simple terms:
              </h3>
              <p className="text-lg leading-relaxed text-gray-800 dark:text-gray-200">
                {explanation.simplifiedExplanation}
              </p>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <Clock className="w-4 h-4" />
              <span>Reading time: {explanation.readingTime} min</span>
              <span>•</span>
              <span>Difficulty: {explanation.difficultyLevel}</span>
            </div>
          </div>
        );
      case 1:
        return (
          <div className="space-y-4">
            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
              <h3 className="font-semibold text-green-900 dark:text-green-100 mb-2">
                Think of it like this:
              </h3>
              <p className="text-lg leading-relaxed text-gray-800 dark:text-gray-200">
                {explanation.analogy}
              </p>
            </div>
            <button
              onClick={() => speakText(explanation.analogy)}
              className="flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
            >
              <Volume2 className="w-4 h-4" />
              Read aloud
            </button>
          </div>
        );
      case 2:
        return (
          <div className="space-y-4">
            <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
              <h3 className="font-semibold text-purple-900 dark:text-purple-100 mb-2">
                Picture this:
              </h3>
              <p className="text-lg leading-relaxed text-gray-800 dark:text-gray-200">
                {explanation.visualStory}
              </p>
            </div>
            <div className="bg-gray-100 dark:bg-gray-800 p-6 rounded-lg">
              <div className="text-center text-gray-500 dark:text-gray-400">
                <GraduationCap className="w-16 h-16 mx-auto mb-2" />
                <p>Visual illustration would appear here</p>
                <p className="text-sm mt-1">Showing {explanation.originalTopic} in a simple diagram</p>
              </div>
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">
              Key Points to Remember:
            </h3>
            <div className="space-y-2">
              {explanation.keyPoints.map((point, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg"
                >
                  <span className="flex-shrink-0 w-6 h-6 bg-yellow-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                    {index + 1}
                  </span>
                  <p className="text-gray-800 dark:text-gray-200">{point}</p>
                </div>
              ))}
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  const renderQuiz = () => {
    if (!explanation) return null;

    const quizData = {
      question: `What did you learn about ${explanation.originalTopic}?`,
      options: [
        'It helps make elections fair',
        'It\'s not important',
        'Only for politicians',
        'Too complicated',
      ],
      correctAnswer: 0,
      explanation: explanation.simplifiedExplanation,
    };

    return (
      <div className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white p-6 rounded-lg">
        <h3 className="font-bold text-xl mb-4">Quick Quiz!</h3>
        <p className="text-lg mb-6">{quizData.question}</p>
        
        <div className="space-y-3">
          {quizData.options.map((option, index) => (
            <button
              key={index}
              onClick={() => !quizAnswered && handleQuizAnswer(index)}
              disabled={quizAnswered}
              className={`w-full text-left p-4 rounded-lg transition-all ${
                quizAnswered
                  ? index === quizData.correctAnswer
                    ? 'bg-green-500 ring-2 ring-green-300'
                    : index === selectedAnswer
                    ? 'bg-red-500 ring-2 ring-red-300'
                    : 'bg-white/20 opacity-50'
                  : 'bg-white/20 hover:bg-white/30'
              }`}
            >
              <span className="font-medium">{option}</span>
            </button>
          ))}
        </div>

        {quizAnswered && (
          <div className={`mt-6 p-4 rounded-lg ${
            quizResult ? 'bg-green-400/20' : 'bg-red-400/20'
          }`}>
            <p className="font-semibold">
              {quizResult ? '✓ Correct!' : '✗ Not quite right'}
            </p>
            <p className="text-sm mt-2 opacity-90">{quizData.explanation}</p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 p-6 rounded-lg shadow-lg border-2 border-yellow-200 dark:border-yellow-800">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="bg-yellow-500 p-2 rounded-lg">
            <Lightbulb className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Explain Like I'm 15
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Simple explanations for complex election data
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowQuiz(!showQuiz)}
          className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
            showQuiz
              ? 'bg-gray-600 hover:bg-gray-700 text-white'
              : 'bg-indigo-600 hover:bg-indigo-700 text-white'
          }`}
        >
          {showQuiz ? 'Back to Explanation' : 'Take Quiz'}
        </button>
      </div>

      {showQuiz ? (
        renderQuiz()
      ) : (
        <>
          {!explanation ? (
            <div className="text-center py-12">
              <Lightbulb className="w-16 h-16 mx-auto mb-4 text-yellow-500" />
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Click below to get a simple explanation
              </p>
              <button
                onClick={generateExplanation}
                disabled={loading}
                className="bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors disabled:opacity-50"
              >
                {loading ? 'Generating...' : 'Explain This Simply'}
              </button>
            </div>
          ) : (
            <>
              {/* Section Navigation */}
              <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
                {sections.map((section, index) => (
                  <button
                    key={section.id}
                    onClick={() => setCurrentSection(index)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors whitespace-nowrap ${
                      currentSection === index
                        ? 'bg-yellow-500 text-white'
                        : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    <section.icon className="w-4 h-4" />
                    <span className="font-medium">{section.title}</span>
                  </button>
                ))}
              </div>

              {/* Content */}
              <div className="min-h-[300px]">
                {renderSection()}
              </div>

              {/* Navigation Arrows */}
              <div className="flex items-center justify-between mt-6">
                <button
                  onClick={() => setCurrentSection(Math.max(0, currentSection - 1))}
                  disabled={currentSection === 0}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </button>
                
                <div className="flex items-center gap-2">
                  {sections.map((_, index) => (
                    <div
                      key={index}
                      className={`w-2 h-2 rounded-full transition-colors ${
                        currentSection === index ? 'bg-yellow-500' : 'bg-gray-300 dark:bg-gray-700'
                      }`}
                    />
                  ))}
                </div>

                <button
                  onClick={() => setCurrentSection(Math.min(sections.length - 1, currentSection + 1))}
                  disabled={currentSection === sections.length - 1}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={generateExplanation}
                  disabled={loading}
                  className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-3 rounded-lg font-semibold transition-colors disabled:opacity-50"
                >
                  Generate New Explanation
                </button>
                
                <button
                  onClick={() => speakText(explanation.simplifiedExplanation)}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg font-semibold transition-colors"
                >
                  <Volume2 className="w-4 h-4" />
                  Read Aloud
                </button>
              </div>
            </>
          )}
        </>
      )}

      {error && (
        <div className="bg-red-100 dark:bg-red-900/20 border border-red-500 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg mt-4">
          {error}
        </div>
      )}
    </div>
  );
};
