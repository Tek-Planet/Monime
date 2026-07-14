import { useState, useCallback, useEffect, useRef } from "react";
import { useLanguage } from "@/contexts/LanguageContext";

interface TTSOptions {
  rate?: number;
  pitch?: number;
  volume?: number;
}

const LANGUAGE_VOICE_MAP: Record<string, string> = {
  en: "en-US",
  krio: "en-GB", // Fallback for Krio
  fr: "fr-FR",
  ar: "ar-SA",
};

export function useTextToSpeech(options: TTSOptions = {}) {
  const { language } = useLanguage();
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isReadAloudMode, setIsReadAloudMode] = useState(false);
  const [rate, setRate] = useState(options.rate ?? 0.9);
  const [supported, setSupported] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    setSupported("speechSynthesis" in window);
  }, []);

  const getVoiceLang = useCallback(() => {
    return LANGUAGE_VOICE_MAP[language] || "en-US";
  }, [language]);

  const speak = useCallback(
    (text: string) => {
      if (!supported || !text.trim()) return;

      // Cancel any ongoing speech
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = getVoiceLang();
      utterance.rate = rate;
      utterance.pitch = options.pitch ?? 1;
      utterance.volume = options.volume ?? 1;

      // Try to find a matching voice
      const voices = window.speechSynthesis.getVoices();
      const lang = getVoiceLang();
      const matchingVoice = voices.find((v) => v.lang.startsWith(lang.split("-")[0]));
      if (matchingVoice) utterance.voice = matchingVoice;

      utterance.onstart = () => {
        setIsSpeaking(true);
        setIsPaused(false);
      };
      utterance.onend = () => {
        setIsSpeaking(false);
        setIsPaused(false);
      };
      utterance.onerror = () => {
        setIsSpeaking(false);
        setIsPaused(false);
      };

      utteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    },
    [supported, getVoiceLang, rate, options.pitch, options.volume]
  );

  const pause = useCallback(() => {
    if (supported && isSpeaking) {
      window.speechSynthesis.pause();
      setIsPaused(true);
    }
  }, [supported, isSpeaking]);

  const resume = useCallback(() => {
    if (supported && isPaused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
    }
  }, [supported, isPaused]);

  const stop = useCallback(() => {
    if (supported) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      setIsPaused(false);
    }
  }, [supported]);

  const readPageContent = useCallback(() => {
    if (!supported) return;

    const main = document.querySelector("main");
    if (!main) return;

    // Gather readable text from semantic elements
    const selectors = [
      "h1", "h2", "h3", "h4",
      "p",
      "[aria-label]",
      "button:not([aria-hidden])",
      "label",
      "th", "td",
      ".stat-value",
      ".card-title",
    ];

    const textParts: string[] = [];
    const elements = main.querySelectorAll(selectors.join(", "));
    elements.forEach((el) => {
      const text = (el as HTMLElement).getAttribute("aria-label") || (el as HTMLElement).innerText;
      if (text?.trim() && text.length < 500) {
        textParts.push(text.trim());
      }
    });

    const uniqueTexts = [...new Set(textParts)];
    if (uniqueTexts.length > 0) {
      speak(uniqueTexts.join(". "));
    }
  }, [supported, speak]);

  // Handle click-to-read in read-aloud mode
  useEffect(() => {
    if (!isReadAloudMode || !supported) return;

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;

      // Don't intercept clicks on the accessibility toolbar itself
      const toolbar = target.closest("[data-accessibility-toolbar]");
      if (toolbar) return;

      // Find the closest readable element
      const readable = target.closest(
        "button, a, h1, h2, h3, h4, p, label, td, th, span, [aria-label], [role='button'], li, .card"
      ) as HTMLElement | null;

      if (readable) {
        e.preventDefault();
        e.stopPropagation();
        const text =
          readable.getAttribute("aria-label") ||
          readable.innerText ||
          readable.textContent;
        if (text?.trim()) {
          speak(text.trim());
        }
      }
    };

    // Use capture phase so we intercept before normal handlers
    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, [isReadAloudMode, supported, speak]);

  // Add visual indicator when read-aloud mode is active
  useEffect(() => {
    if (isReadAloudMode) {
      document.body.classList.add("read-aloud-mode");
    } else {
      document.body.classList.remove("read-aloud-mode");
    }
    return () => document.body.classList.remove("read-aloud-mode");
  }, [isReadAloudMode]);

  return {
    speak,
    pause,
    resume,
    stop,
    isSpeaking,
    isPaused,
    supported,
    isReadAloudMode,
    setIsReadAloudMode,
    readPageContent,
    rate,
    setRate,
  };
}
