/**
 * Speech synthesis utility functions
 */

export const speak = (rawText: string): void => {
  const text = String(rawText || "").trim();
  if (!text || !("speechSynthesis" in window)) return;

  try {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    utterance.rate = 0.9;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;
    window.speechSynthesis.speak(utterance);
  } catch (error) {
    console.error("Speech synthesis error:", error);
  }
};

export const stopSpeech = (): void => {
  if ("speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
};
