/**
 * AI Language Translator - Speech Services (STT & TTS)
 * CodeAlpha Artificial Intelligence Internship
 *
 * Professional Web Speech API integration:
 * - SpeechRecognition (Speech-to-Text) with continuous recognition & interim results
 * - SpeechSynthesis (Text-to-Speech) with target language voices & audio waves
 */

const SpeechModule = (() => {
  // Speech Recognition API resolution with browser vendor prefixes
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition || null;
  let recognition = null;
  let isListening = false;
  let intentionalStop = false;
  let sessionFinalTranscript = '';
  let sessionInterimTranscript = '';

  // Speech Synthesis (Text-to-Speech)
  const synth = window.speechSynthesis || null;
  let currentUtterance = null;
  let isSpeaking = false;

  /**
   * Check if Speech Recognition is supported by the browser.
   */
  function isRecognitionSupported() {
    return !!SpeechRecognition;
  }

  /**
   * Check if Speech Synthesis is supported by the browser.
   */
  function isSynthesisSupported() {
    return !!synth;
  }

  /**
   * Check if currently listening.
   */
  function isCurrentlyListening() {
    return isListening;
  }

  /**
   * Check if currently speaking.
   */
  function isCurrentlySpeaking() {
    return isSpeaking;
  }

  /**
   * Start speech recognition with continuous listening and live interim results.
   *
   * @param {Object} options
   * @param {string} options.langCode - BCP-47 language tag (e.g. 'ta-IN', 'en-US', 'hi-IN')
   * @param {string} options.langName - Human-readable language name (e.g. 'Tamil', 'English')
   * @param {Function} options.onStart - Callback when microphone recording starts
   * @param {Function} options.onInterim - Callback for live streaming updates { finalText, interimText, combinedText }
   * @param {Function} options.onEnd - Callback when recording ends { finalText, intentional }
   * @param {Function} options.onError - Callback on error (userFriendlyMessage, rawError, isFatal)
   */
  function startListening(options = {}) {
    const {
      langCode = 'en-US',
      langName = 'English',
      onStart,
      onInterim,
      onEnd,
      onError
    } = options;

    if (!isRecognitionSupported()) {
      if (onError) {
        onError(
          'Voice input is not supported in this browser. Please use Google Chrome, Microsoft Edge, or Safari.',
          'not-supported',
          true
        );
      }
      return false;
    }

    // If text-to-speech is currently playing, stop it so mic doesn't capture speaker audio
    stopSpeaking();

    // If an existing recognition instance is somehow active, stop it cleanly first
    if (isListening && recognition) {
      intentionalStop = true;
      try { recognition.stop(); } catch (e) { /* ignore */ }
    }

    // Reset session buffers
    sessionFinalTranscript = '';
    sessionInterimTranscript = '';
    intentionalStop = false;

    try {
      recognition = new SpeechRecognition();
      recognition.continuous = true;       // Continuous mode preserves pauses and sentences
      recognition.interimResults = true;   // Live transcription preview
      recognition.maxAlternatives = 1;
      recognition.lang = langCode || 'en-US';

      recognition.onstart = () => {
        isListening = true;
        intentionalStop = false;
        if (onStart) {
          onStart({ langCode, langName });
        }
      };

      recognition.onresult = (event) => {
        let interimText = '';
        let currentFinalAccumulator = '';

        // Iterate through all results in the current session
        for (let i = 0; i < event.results.length; ++i) {
          const result = event.results[i];
          const segmentTranscript = result[0].transcript;

          if (result.isFinal) {
            const cleanSegment = segmentTranscript.trim();
            if (cleanSegment) {
              if (currentFinalAccumulator) {
                currentFinalAccumulator += ' ' + cleanSegment;
              } else {
                currentFinalAccumulator = cleanSegment;
              }
            }
          } else {
            interimText += segmentTranscript;
          }
        }

        sessionFinalTranscript = currentFinalAccumulator;
        sessionInterimTranscript = interimText;

        const combined = (sessionFinalTranscript + (sessionInterimTranscript ? ' ' + sessionInterimTranscript : '')).trim();

        if (onInterim) {
          onInterim({
            finalText: sessionFinalTranscript,
            interimText: sessionInterimTranscript,
            combinedText: combined
          });
        }
      };

      recognition.onerror = (event) => {
        let friendlyMessage = 'Voice recognition error occurred.';
        let isFatal = true;

        switch (event.error) {
          case 'not-allowed':
          case 'service-not-allowed':
            friendlyMessage = 'Microphone permission denied. Please allow microphone access in your browser site settings.';
            break;
          case 'no-speech':
            friendlyMessage = 'No speech was detected. Please check your microphone and speak clearly.';
            isFatal = false; // in continuous mode, no-speech is often temporary
            break;
          case 'audio-capture':
            friendlyMessage = 'Microphone is unavailable or in use by another application.';
            break;
          case 'network':
            friendlyMessage = 'Speech recognition network error. Please verify your internet connection.';
            break;
          case 'language-not-supported':
            friendlyMessage = `Speech recognition does not support language code "${langCode}" on this browser.`;
            break;
          case 'aborted':
            friendlyMessage = 'Voice input was stopped.';
            isFatal = false;
            break;
          default:
            friendlyMessage = `Voice recognition error: ${event.error}`;
        }

        if (isFatal) {
          isListening = false;
        }

        if (onError) {
          onError(friendlyMessage, event.error, isFatal);
        }
      };

      recognition.onend = () => {
        isListening = false;

        // If any unfinalized interim speech remains upon stopping, merge it into final transcript
        if (sessionInterimTranscript && sessionInterimTranscript.trim()) {
          const trailing = sessionInterimTranscript.trim();
          if (!sessionFinalTranscript.endsWith(trailing)) {
            sessionFinalTranscript += (sessionFinalTranscript ? ' ' : '') + trailing;
          }
          sessionInterimTranscript = '';
        }

        const resultText = sessionFinalTranscript.trim();

        if (onEnd) {
          onEnd({
            finalText: resultText,
            intentional: intentionalStop
          });
        }
      };

      recognition.start();
      return true;
    } catch (err) {
      isListening = false;
      if (onError) {
        onError('Failed to initialize speech recognition: ' + err.message, 'init-failed', true);
      }
      return false;
    }
  }

  /**
   * Stop active speech recognition session cleanly.
   */
  function stopListening() {
    if (!recognition || !isListening) return;
    intentionalStop = true;
    try {
      recognition.stop();
    } catch (e) {
      isListening = false;
    }
  }

  /**
   * Cancel active speech recognition without committing text.
   */
  function cancelListening() {
    if (!recognition || !isListening) return;
    intentionalStop = true;
    sessionFinalTranscript = '';
    sessionInterimTranscript = '';
    try {
      recognition.abort();
    } catch (e) {
      isListening = false;
    }
  }

  /**
   * Speak given text in the target language using Web Speech Synthesis.
   */
  function speakText(text, langCode, onStart, onEnd, onError) {
    if (!isSynthesisSupported()) {
      if (onError) onError('Text-to-speech is not supported in this browser.');
      return;
    }

    if (!text || !text.trim()) {
      if (onError) onError('No text available to speak.');
      return;
    }

    // If currently speaking, stop current audio
    if (synth.speaking) {
      synth.cancel();
      isSpeaking = false;
      if (onEnd) onEnd();
      return;
    }

    // If microphone is listening, stop it before speaking
    stopListening();

    try {
      currentUtterance = new SpeechSynthesisUtterance(text);
      currentUtterance.lang = langCode || 'en-US';
      currentUtterance.rate = 0.95;
      currentUtterance.pitch = 1.0;

      // Match available browser voices if possible
      const voices = synth.getVoices();
      if (voices && voices.length > 0) {
        const matchingVoice = voices.find(v => v.lang.toLowerCase().startsWith((langCode || '').toLowerCase().slice(0, 2)));
        if (matchingVoice) {
          currentUtterance.voice = matchingVoice;
        }
      }

      currentUtterance.onstart = () => {
        isSpeaking = true;
        if (onStart) onStart();
      };

      currentUtterance.onend = () => {
        isSpeaking = false;
        if (onEnd) onEnd();
      };

      currentUtterance.onerror = (e) => {
        isSpeaking = false;
        if (onEnd) onEnd();
        if (onError && e.error !== 'canceled') {
          onError('Speech synthesis failed: ' + e.error);
        }
      };

      synth.speak(currentUtterance);
    } catch (err) {
      isSpeaking = false;
      if (onEnd) onEnd();
      if (onError) onError('Text-to-speech error: ' + err.message);
    }
  }

  function stopSpeaking() {
    if (synth && synth.speaking) {
      synth.cancel();
      isSpeaking = false;
    }
  }

  return {
    isRecognitionSupported,
    isSynthesisSupported,
    isCurrentlyListening,
    isCurrentlySpeaking,
    startListening,
    stopListening,
    cancelListening,
    speakText,
    stopSpeaking
  };
})();
