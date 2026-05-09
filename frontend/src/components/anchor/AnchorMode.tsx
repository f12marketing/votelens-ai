import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Volume2, VolumeX, Settings, Mic, MicOff } from 'lucide-react';

interface AnchorConfig {
  style: 'news' | 'sports' | 'documentary';
  pacing: 'slow' | 'normal' | 'fast';
  detailLevel: 'brief' | 'standard' | 'detailed';
  includeNumbers: boolean;
  includePercentages: boolean;
  maxDuration: number;
}

interface AnchorCommentary {
  id: string;
  type: 'trend' | 'summary' | 'highlight' | 'analysis';
  content: string;
  tone: 'professional' | 'urgent' | 'celebratory' | 'cautious';
  duration: number;
  metadata: {
    timestamp: Date;
    confidence: number;
  };
}

interface AnchorModeProps {
  electionId?: string;
  analytics?: any;
  trends?: any[];
  onCommentaryGenerated?: (commentaries: AnchorCommentary[]) => void;
}

export const AnchorMode: React.FC<AnchorModeProps> = ({
  electionId,
  analytics,
  trends,
  onCommentaryGenerated,
}) => {
  const [isActive, setIsActive] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [commentaries, setCommentaries] = useState<AnchorCommentary[]>([]);
  const [currentCommentary, setCurrentCommentary] = useState<number>(0);
  const [config, setConfig] = useState<AnchorConfig>({
    style: 'news',
    pacing: 'normal',
    detailLevel: 'standard',
    includeNumbers: true,
    includePercentages: true,
    maxDuration: 60,
  });
  const [showSettings, setShowSettings] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const speechSynthesisRef = useRef<SpeechSynthesis | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      speechSynthesisRef.current = window.speechSynthesis;
      
      if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;
        recognitionRef.current.lang = 'en-US';
      }
    }

    return () => {
      if (speechSynthesisRef.current) {
        speechSynthesisRef.current.cancel();
      }
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const generateCommentary = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/anchor/conversational', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          trends: trends || [],
          analytics: analytics || {},
          config,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate commentary');
      }

      const data = await response.json();
      const newCommentaries = data.data;
      setCommentaries(newCommentaries);
      setCurrentCommentary(0);
      onCommentaryGenerated?.(newCommentaries);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate commentary');
    } finally {
      setLoading(false);
    }
  };

  const speak = (text: string) => {
    if (!speechSynthesisRef.current || isMuted) return;

    speechSynthesisRef.current.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    
    // Adjust pacing
    const rateMap = { slow: 0.8, normal: 1.0, fast: 1.2 };
    utterance.rate = rateMap[config.pacing];

    // Adjust pitch based on tone
    const pitchMap = { professional: 1.0, urgent: 1.1, celebratory: 1.1, cautious: 0.9 };
    utterance.pitch = pitchMap[currentCommentary?.tone || 'professional'] || 1.0;

    utterance.onend = () => {
      if (currentCommentary < commentaries.length - 1) {
        setCurrentCommentary(prev => prev + 1);
      } else {
        setIsPlaying(false);
      }
    };

    speechSynthesisRef.current.speak(utterance);
  };

  const startPlayback = async () => {
    if (commentaries.length === 0) {
      await generateCommentary();
    }
    setIsPlaying(true);
    setIsActive(true);
  };

  const pausePlayback = () => {
    if (speechSynthesisRef.current) {
      speechSynthesisRef.current.pause();
    }
    setIsPlaying(false);
  };

  const resumePlayback = () => {
    if (speechSynthesisRef.current) {
      speechSynthesisRef.current.resume();
    }
    setIsPlaying(true);
  };

  const stopPlayback = () => {
    if (speechSynthesisRef.current) {
      speechSynthesisRef.current.cancel();
    }
    setIsPlaying(false);
    setIsActive(false);
    setCurrentCommentary(0);
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    if (speechSynthesisRef.current) {
      if (isMuted) {
        speechSynthesisRef.current.resume();
      } else {
        speechSynthesisRef.current.pause();
      }
    }
  };

  const toggleListening = () => {
    if (!recognitionRef.current) {
      setError('Speech recognition not supported in this browser');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  useEffect(() => {
    if (isPlaying && commentaries.length > 0) {
      speak(commentaries[currentCommentary].content);
    }
  }, [isPlaying, currentCommentary, commentaries]);

  const handleConfigChange = (key: keyof AnchorConfig, value: any) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const applyPreset = (preset: 'news' | 'sports' | 'documentary') => {
    const presets: Record<string, AnchorConfig> = {
      news: {
        style: 'news',
        pacing: 'normal',
        detailLevel: 'standard',
        includeNumbers: true,
        includePercentages: true,
        maxDuration: 60,
      },
      sports: {
        style: 'sports',
        pacing: 'fast',
        detailLevel: 'brief',
        includeNumbers: true,
        includePercentages: true,
        maxDuration: 45,
      },
      documentary: {
        style: 'documentary',
        pacing: 'slow',
        detailLevel: 'detailed',
        includeNumbers: true,
        includePercentages: true,
        maxDuration: 120,
      },
    };
    setConfig(presets[preset]);
  };

  return (
    <div className="bg-gradient-to-br from-blue-900 to-purple-900 text-white p-6 rounded-lg shadow-xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Mic className="w-6 h-6" />
            AI Anchor Mode
          </h2>
          <p className="text-blue-200 text-sm mt-1">
            Professional election commentary powered by AI
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            title="Settings"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>

      {showSettings && (
        <div className="bg-black/30 p-4 rounded-lg mb-6">
          <h3 className="font-semibold mb-3">Anchor Settings</h3>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm text-blue-200 mb-1">Style Preset</label>
              <select
                value={config.style}
                onChange={(e) => applyPreset(e.target.value as any)}
                className="w-full bg-black/50 border border-blue-500/30 rounded px-3 py-2"
              >
                <option value="news">News</option>
                <option value="sports">Sports</option>
                <option value="documentary">Documentary</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm text-blue-200 mb-1">Pacing</label>
              <select
                value={config.pacing}
                onChange={(e) => handleConfigChange('pacing', e.target.value)}
                className="w-full bg-black/50 border border-blue-500/30 rounded px-3 py-2"
              >
                <option value="slow">Slow</option>
                <option value="normal">Normal</option>
                <option value="fast">Fast</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm text-blue-200 mb-1">Detail Level</label>
              <select
                value={config.detailLevel}
                onChange={(e) => handleConfigChange('detailLevel', e.target.value)}
                className="w-full bg-black/50 border border-blue-500/30 rounded px-3 py-2"
              >
                <option value="brief">Brief</option>
                <option value="standard">Standard</option>
                <option value="detailed">Detailed</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm text-blue-200 mb-1">Max Duration</label>
              <input
                type="number"
                value={config.maxDuration}
                onChange={(e) => handleConfigChange('maxDuration', parseInt(e.target.value))}
                className="w-full bg-black/50 border border-blue-500/30 rounded px-3 py-2"
                min="30"
                max="300"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={config.includeNumbers}
                onChange={(e) => handleConfigChange('includeNumbers', e.target.checked)}
                className="w-4 h-4"
              />
              <span className="text-sm">Include Numbers</span>
            </label>
            
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={config.includePercentages}
                onChange={(e) => handleConfigChange('includePercentages', e.target.checked)}
                className="w-4 h-4"
              />
              <span className="text-sm">Include Percentages</span>
            </label>
          </div>
        </div>
      )}

      <div className="bg-black/30 p-4 rounded-lg mb-6">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm text-blue-200">
            {commentaries.length > 0 ? `${currentCommentary + 1} / ${commentaries.length}` : 'No commentary generated'}
          </span>
          <span className="text-sm text-blue-200">
            {commentaries[currentCommentary]?.duration || 0}s
          </span>
        </div>

        <div className="h-32 overflow-y-auto mb-4 bg-black/20 rounded p-3">
          {commentaries.length > 0 ? (
            <p className="text-lg leading-relaxed">
              {commentaries[currentCommentary]?.content || 'Generate commentary to begin'}
            </p>
          ) : (
            <p className="text-blue-300 text-center">
              Generate commentary to see AI-generated election updates
            </p>
          )}
        </div>

        <div className="flex items-center justify-center gap-4">
          {!isActive ? (
            <button
              onClick={startPlayback}
              disabled={loading}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 px-6 py-3 rounded-lg font-semibold transition-colors disabled:opacity-50"
            >
              <Play className="w-5 h-5" />
              {loading ? 'Generating...' : 'Start Commentary'}
            </button>
          ) : (
            <>
              {!isPlaying ? (
                <button
                  onClick={resumePlayback}
                  className="flex items-center gap-2 bg-green-600 hover:bg-green-700 px-4 py-3 rounded-lg font-semibold transition-colors"
                >
                  <Play className="w-5 h-5" />
                  Resume
                </button>
              ) : (
                <button
                  onClick={pausePlayback}
                  className="flex items-center gap-2 bg-yellow-600 hover:bg-yellow-700 px-4 py-3 rounded-lg font-semibold transition-colors"
                >
                  <Pause className="w-5 h-5" />
                  Pause
                </button>
              )}
              
              <button
                onClick={stopPlayback}
                className="flex items-center gap-2 bg-red-600 hover:bg-red-700 px-4 py-3 rounded-lg font-semibold transition-colors"
              >
                <Stop className="w-5 h-5" />
                Stop
              </button>
            </>
          )}

          <button
            onClick={toggleMute}
            className={`p-3 rounded-lg transition-colors ${
              isMuted ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'
            }`}
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </button>

          <button
            onClick={toggleListening}
            disabled={!recognitionRef.current}
            className={`p-3 rounded-lg transition-colors ${
              isListening ? 'bg-red-600 hover:bg-red-700' : 'bg-purple-600 hover:bg-purple-700'
            } disabled:opacity-50`}
            title={isListening ? 'Stop Listening' : 'Start Listening'}
          >
            {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-600/20 border border-red-500 text-red-200 px-4 py-2 rounded mb-4">
          {error}
        </div>
      )}

      <div className="grid grid-cols-3 gap-4">
        <button
          onClick={() => generateCommentary()}
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg font-semibold transition-colors disabled:opacity-50"
        >
          Generate New Commentary
        </button>
        
        <button
          onClick={() => setCurrentCommentary(Math.max(0, currentCommentary - 1))}
          disabled={currentCommentary === 0}
          className="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded-lg font-semibold transition-colors disabled:opacity-50"
        >
          Previous
        </button>
        
        <button
          onClick={() => setCurrentCommentary(Math.min(commentaries.length - 1, currentCommentary + 1))}
          disabled={currentCommentary === commentaries.length - 1}
          className="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded-lg font-semibold transition-colors disabled:opacity-50"
        >
          Next
        </button>
      </div>

      {commentaries.length > 0 && (
        <div className="mt-4">
          <h3 className="font-semibold mb-2">Commentary Timeline</h3>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {commentaries.map((commentary, index) => (
              <div
                key={commentary.id}
                onClick={() => setCurrentCommentary(index)}
                className={`p-2 rounded cursor-pointer transition-colors ${
                  index === currentCommentary ? 'bg-blue-600' : 'bg-black/20 hover:bg-black/30'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{commentary.type.toUpperCase()}</span>
                  <span className="text-xs text-blue-200">{commentary.duration}s</span>
                </div>
                <p className="text-sm text-blue-200 truncate mt-1">
                  {commentary.content}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
