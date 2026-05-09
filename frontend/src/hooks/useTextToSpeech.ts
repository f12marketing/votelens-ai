import { useState, useEffect, useRef, useCallback } from 'react';

interface TTSConfig {
  voice?: string;
  rate: number;
  pitch: number;
  volume: number;
}

interface TTSStatus {
  isSpeaking: boolean;
  isPaused: boolean;
  isSupported: boolean;
  availableVoices: SpeechSynthesisVoice[];
}

export const useTextToSpeech = (config: TTSConfig = { rate: 1.0, pitch: 1.0, volume: 1.0 }) => {
  const [status, setStatus] = useState<TTSStatus>({
    isSpeaking: false,
    isPaused: false,
    isSupported: false,
    availableVoices: [],
  });

  const [currentUtterance, setCurrentUtterance] = useState<SpeechSynthesisUtterance | null>(null);
  const synthesisRef = useRef<SpeechSynthesis | null>(null);
  const onEndCallbackRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      synthesisRef.current = window.speechSynthesis;
      setStatus(prev => ({ ...prev, isSupported: true }));

      // Load voices
      const loadVoices = () => {
        const voices = synthesisRef.current?.getVoices() || [];
        setStatus(prev => ({ ...prev, availableVoices: voices }));
      };

      loadVoices();
      synthesisRef.current.onvoiceschanged = loadVoices;
    }

    return () => {
      if (synthesisRef.current) {
        synthesisRef.current.cancel();
      }
    };
  }, []);

  const speak = useCallback((text: string, options?: Partial<TTSConfig> & { onEnd?: () => void }) => {
    if (!synthesisRef.current) return;

    // Cancel any ongoing speech
    synthesisRef.current.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    
    // Apply configuration
    utterance.rate = options?.rate ?? config.rate;
    utterance.pitch = options?.pitch ?? config.pitch;
    utterance.volume = options?.volume ?? config.volume;

    // Set voice if specified
    if (options?.voice || config.voice) {
      const voice = status.availableVoices.find(v => v.name === (options?.voice || config.voice));
      if (voice) {
        utterance.voice = voice;
      }
    }

    // Set callbacks
    utterance.onstart = () => {
      setStatus(prev => ({ ...prev, isSpeaking: true, isPaused: false }));
    };

    utterance.onpause = () => {
      setStatus(prev => ({ ...prev, isPaused: true }));
    };

    utterance.onresume = () => {
      setStatus(prev => ({ ...prev, isPaused: false }));
    };

    utterance.onend = () => {
      setStatus(prev => ({ ...prev, isSpeaking: false, isPaused: false }));
      if (options?.onEnd) {
        options.onEnd();
      }
      if (onEndCallbackRef.current) {
        onEndCallbackRef.current();
        onEndCallbackRef.current = null;
      }
    };

    utterance.onerror = (event) => {
      console.error('Speech synthesis error:', event);
      setStatus(prev => ({ ...prev, isSpeaking: false, isPaused: false }));
    };

    setCurrentUtterance(utterance);
    synthesisRef.current.speak(utterance);
  }, [config, status.availableVoices]);

  const pause = useCallback(() => {
    if (synthesisRef.current && status.isSpeaking) {
      synthesisRef.current.pause();
    }
  }, [status.isSpeaking]);

  const resume = useCallback(() => {
    if (synthesisRef.current && status.isPaused) {
      synthesisRef.current.resume();
    }
  }, [status.isPaused]);

  const cancel = useCallback(() => {
    if (synthesisRef.current) {
      synthesisRef.current.cancel();
    }
    setStatus(prev => ({ ...prev, isSpeaking: false, isPaused: false }));
  }, []);

  const speakSequence = useCallback(async (texts: string[], options?: Partial<TTSConfig>) => {
    for (const text of texts) {
      await new Promise<void>((resolve) => {
        onEndCallbackRef.current = resolve;
        speak(text, options);
      });
    }
  }, [speak]);

  const setOnEnd = useCallback((callback: () => void) => {
    onEndCallbackRef.current = callback;
  }, []);

  return {
    ...status,
    speak,
    pause,
    resume,
    cancel,
    speakSequence,
    setOnEnd,
    currentUtterance,
  };
};
