'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}

type UseDictationReturn = {
  isSupported: boolean;
  isListening: boolean;
  interimTranscript: string;
  finalTranscript: string;
  toggle: () => void;
  stop: () => void;
  clear: () => void;
};

/**
 * DICTADO PERFECTO
 * - Tiempo real (interim) sin span gris (lo entrega en texto plano)
 * - Final rápido, sin duplicaciones
 * - Cursor lo controla cada componente con use-dictation-input
 */
export const useDictation = (): UseDictationReturn => {
  const [isListening, setIsListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [finalTranscript, setFinalTranscript] = useState('');

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const finalRef = useRef('');

  const isSupported =
    typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  const stop = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
      recognitionRef.current = null;
    }
    setIsListening(false);
    setInterimTranscript('');
  }, []);

  const clear = useCallback(() => {
    setInterimTranscript('');
    setFinalTranscript('');
    finalRef.current = '';
  }, []);

  const toggle = useCallback(() => {
    if (!isSupported) return;

    if (isListening) {
      stop();
      return;
    }

    const SpeechRecognitionAPI =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) return;

    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'es-ES';
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      finalRef.current = '';
      setIsListening(true);
      setInterimTranscript('');
      setFinalTranscript('');
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = '';
      let finalText = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const text = result[0].transcript;
        if (result.isFinal) {
          finalText += text;
        } else {
          interim += text;
        }
      }

      // Interim en vivo, sin mutar finalRef
      setInterimTranscript(interim.trim());

      // Sólo actualizar final si hay texto nuevo distinto de lo ya acumulado
      if (finalText) {
        const nextFinal = `${finalRef.current} ${finalText}`.trim();
        if (nextFinal !== finalRef.current) {
          finalRef.current = nextFinal;
          setFinalTranscript(nextFinal);
          setInterimTranscript('');
        }
      }
    };

    recognition.onend = () => {
      setIsListening(false);
      recognitionRef.current = null;
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error === 'no-speech' || event.error === 'aborted') {
        return;
      }
      setIsListening(false);
      recognitionRef.current = null;
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
    } catch {
      // ignore
    }
  }, [isListening, isSupported, stop]);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // ignore
        }
      }
    };
  }, []);

  return {
    isSupported,
    isListening,
    interimTranscript,
    finalTranscript,
    toggle,
    stop,
    clear,
  };
};

export default useDictation;
