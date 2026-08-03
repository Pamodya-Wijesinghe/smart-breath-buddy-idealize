import { useState, useCallback, useRef, useEffect } from 'react';

export const useVoiceCoach = () => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isEnabled, setIsEnabled] = useState(true);
  
  // Use a ref to track current utterance so we can cancel it if needed
  const currentUtterance = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    // Stop speaking when component unmounts
    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const speak = useCallback((text: string) => {
    console.log("TTS Triggered: Attempting to speak:", text);
    
    if (!isEnabled) {
      console.log("TTS is disabled, skipping.");
      return;
    }
    if (!window.speechSynthesis) {
      console.log("TTS is not supported in this browser.");
      return;
    }

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    setIsSpeaking(true);
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Optional: pick a specific voice if available, otherwise default
    const voices = window.speechSynthesis.getVoices();
    const femaleVoice = voices.find(v => v.name.includes('Female') || v.name.includes('Samantha') || v.name.includes('Google UK English Female'));
    if (femaleVoice) {
      utterance.voice = femaleVoice;
      console.log("Using voice:", femaleVoice.name);
    } else {
      console.log("Using default voice.");
    }

    utterance.onend = () => {
      console.log("TTS finished speaking.");
      setIsSpeaking(false);
      currentUtterance.current = null;
    };
    
    utterance.onerror = (e) => {
      console.error("TTS Error:", e);
      setIsSpeaking(false);
      currentUtterance.current = null;
    };

    currentUtterance.current = utterance;
    console.log("TTS speak() called.");
    window.speechSynthesis.speak(utterance);
  }, [isEnabled]);

  const stop = useCallback(() => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
    currentUtterance.current = null;
  }, []);

  const toggleEnabled = useCallback(() => {
    setIsEnabled(prev => {
      const nextState = !prev;
      if (!nextState) {
        if (window.speechSynthesis) {
          window.speechSynthesis.cancel();
        }
        setIsSpeaking(false);
      }
      return nextState;
    });
  }, []);

  return {
    speak,
    stop,
    isSpeaking,
    isEnabled,
    toggleEnabled
  };
};

