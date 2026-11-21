import { useCallback, useEffect, useRef, useState } from 'react';
import { splitIntoSpeechChunks } from '../utils/speechChunks';

function getSynth() {
  if (typeof window === 'undefined') return null;
  return window.speechSynthesis || null;
}

function pickIndonesianVoice(voices) {
  const list = Array.isArray(voices) ? voices : [];
  return (
    list.find((voice) => String(voice.lang || '').toLowerCase() === 'id-id') ||
    list.find((voice) => String(voice.lang || '').toLowerCase().startsWith('id')) ||
    null
  );
}

export function useSpeechNarrator() {
  const synth = getSynth();
  const isSupported = Boolean(synth) && typeof window.SpeechSynthesisUtterance === 'function';

  const [status, setStatus] = useState(isSupported ? 'idle' : 'unsupported');
  const [voiceLabel, setVoiceLabel] = useState('Suara bawaan');

  const queueRef = useRef([]);
  const indexRef = useRef(0);
  const timerRef = useRef(null);
  const mountedRef = useRef(true);
  const speakNextRef = useRef(null);

  const updateVoiceLabel = useCallback(() => {
    if (!isSupported || !synth) return;
    try {
      const voice = pickIndonesianVoice(synth.getVoices());
      setVoiceLabel(voice ? voice.name : 'Suara bawaan');
    } catch {
      setVoiceLabel('Suara bawaan');
    }
  }, [isSupported, synth]);

  const speakNext = useCallback(() => {
    if (!isSupported || !synth || !mountedRef.current) return;

    const queue = queueRef.current;
    const index = indexRef.current;

    if (index >= queue.length) {
      queueRef.current = [];
      indexRef.current = 0;
      setStatus('idle');
      return;
    }

    const utterance = new window.SpeechSynthesisUtterance(queue[index]);
    utterance.lang = 'id-ID';
    utterance.rate = 1;
    utterance.pitch = 1;

    const voice = pickIndonesianVoice(synth.getVoices());
    if (voice) utterance.voice = voice;

    utterance.onend = () => {
      if (!mountedRef.current) return;
      indexRef.current += 1;
      speakNextRef.current?.();
    };

    utterance.onerror = (event) => {
      if (!mountedRef.current) return;
      const reason = event?.error;
      if (reason === 'interrupted' || reason === 'canceled') return;
      setStatus('idle');
    };

    try {
      synth.speak(utterance);
    } catch {
      setStatus('idle');
    }
  }, [isSupported, synth]);

  speakNextRef.current = speakNext;

  const stop = useCallback(() => {
    queueRef.current = [];
    indexRef.current = 0;

    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    if (!isSupported || !synth) return;

    try {
      synth.cancel();
    } catch {
      // Ignore browsers that fail to cancel cleanly.
    }

    if (mountedRef.current) setStatus('idle');
  }, [isSupported, synth]);

  const play = useCallback((text) => {
    if (!isSupported) {
      setStatus('unsupported');
      return;
    }

    const chunks = splitIntoSpeechChunks(text, 200);
    if (chunks.length === 0) return;

    stop();
    queueRef.current = chunks;
    indexRef.current = 0;
    setStatus('playing');

    timerRef.current = window.setTimeout(() => {
      timerRef.current = null;
      if (mountedRef.current) speakNextRef.current?.();
    }, 50);
  }, [isSupported, stop]);

  const pause = useCallback(() => {
    if (!isSupported || !synth) return;
    if (status === 'playing' && synth.speaking) {
      synth.pause();
      setStatus('paused');
    }
  }, [isSupported, synth, status]);

  const resume = useCallback(() => {
    if (!isSupported || !synth) return;
    if (status === 'paused') {
      synth.resume();
      setStatus('playing');
    }
  }, [isSupported, synth, status]);

  useEffect(() => {
    mountedRef.current = true;
    if (!isSupported || !synth) return undefined;

    updateVoiceLabel();

    if (typeof synth.addEventListener === 'function') {
      synth.addEventListener('voiceschanged', updateVoiceLabel);
    } else {
      synth.onvoiceschanged = updateVoiceLabel;
    }

    return () => {
      mountedRef.current = false;
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      try {
        synth.cancel();
      } catch {
        // Ignore cleanup failures.
      }
      if (typeof synth.removeEventListener === 'function') {
        synth.removeEventListener('voiceschanged', updateVoiceLabel);
      } else if (synth.onvoiceschanged === updateVoiceLabel) {
        synth.onvoiceschanged = null;
      }
    };
  }, [isSupported, synth, updateVoiceLabel]);

  return {
    status,
    isSupported,
    voiceLabel,
    play,
    pause,
    resume,
    stop
  };
}
