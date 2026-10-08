/**
 * AI Language Translator - Main Application Controller
 * CodeAlpha Artificial Intelligence Internship
 */

document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const sourceText = document.getElementById('source-text');
  const targetText = document.getElementById('target-text');
  const sourceLang = document.getElementById('source-lang');
  const targetLang = document.getElementById('target-lang');
  const providerSelect = document.getElementById('provider-select');
  const swapBtn = document.getElementById('swap-btn');
  const translateBtn = document.getElementById('translate-btn');
  const clearBtn = document.getElementById('clear-btn');
  const copyBtn = document.getElementById('copy-btn');
  const copySourceBtn = document.getElementById('copy-source-btn');
  const voiceBtn = document.getElementById('voice-btn');
  const ttsBtn = document.getElementById('tts-btn');
  const themeToggle = document.getElementById('theme-toggle');
  const clearHistoryBtn = document.getElementById('clear-history-btn');
  const historyList = document.getElementById('history-list');
  const historyCount = document.getElementById('history-count');
  const toastContainer = document.getElementById('toast-container');

  // Status Metrics & Counters
  const sourceCharCount = document.getElementById('source-char-count');
  const sourceWordCount = document.getElementById('source-word-count');
  const targetCharCount = document.getElementById('target-char-count');
  const targetWordCount = document.getElementById('target-word-count');
  const voiceStatus = document.getElementById('voice-status');
  const voiceStatusText = document.getElementById('voice-status-text');

  // Live Speech Recognition Elements
  const liveSpeechBox = document.getElementById('live-speech-box');
  const liveSpeechLangText = document.getElementById('live-speech-lang-text');
  const liveFinalTranscript = document.getElementById('live-final-transcript');
  const liveInterimTranscript = document.getElementById('live-interim-transcript');
  const liveSpeechPlaceholder = document.getElementById('live-speech-placeholder');
  const cancelSpeechBtn = document.getElementById('cancel-speech-btn');

  // Status Bar Elements
  const statusDetected = document.getElementById('status-detected');
  const statusTarget = document.getElementById('status-target');
  const statusProvider = document.getElementById('status-provider');
  const statusLatency = document.getElementById('status-latency');

  // State Variables
  let currentDetectedLang = 'auto';
  let currentTargetSpeechCode = 'en-US';
  let lastTranslatedSource = '';
  let recordingBaseText = '';
  let voiceStatusTimer = null;
  const HISTORY_STORAGE_KEY = 'codealpha_ai_translator_history';
  const THEME_STORAGE_KEY = 'codealpha_ai_translator_theme';

  // ==========================================================================
  // 1. THEME MANAGEMENT (DARK / LIGHT)
  // ==========================================================================
  function initTheme() {
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY) || 'dark';
    applyTheme(savedTheme);
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(THEME_STORAGE_KEY, theme);
    if (themeToggle) {
      themeToggle.innerHTML = theme === 'light'
        ? '<i class="fas fa-moon"></i>'
        : '<i class="fas fa-sun"></i>';
      themeToggle.setAttribute('title', theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode');
    }
  }

  themeToggle?.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
    const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
    applyTheme(nextTheme);
    showToast(`Switched to ${nextTheme} mode`, 'info', 2000);
  });

  // ==========================================================================
  // 2. TEXT COUNTERS & VALIDATION
  // ==========================================================================
  function updateSourceCounters() {
    const text = sourceText.value;
    const chars = text.length;
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;

    sourceCharCount.textContent = chars.toLocaleString();
    sourceWordCount.textContent = words.toLocaleString();

    if (chars > 5000) {
      sourceCharCount.style.color = 'var(--accent-rose)';
    } else {
      sourceCharCount.style.color = '';
    }
  }

  function updateTargetCounters() {
    const text = targetText.textContent || '';
    if (targetText.classList.contains('placeholder-text')) {
      targetCharCount.textContent = '0';
      targetWordCount.textContent = '0';
      return;
    }
    const chars = text.length;
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    targetCharCount.textContent = chars.toLocaleString();
    targetWordCount.textContent = words.toLocaleString();
  }

  sourceText.addEventListener('input', updateSourceCounters);

  // ==========================================================================
  // 3. TRANSLATION FLOW
  // ==========================================================================
  async function performTranslation() {
    if (SpeechModule.isCurrentlyListening()) {
      SpeechModule.stopListening();
    }

    const text = sourceText.value.trim();

    if (!text) {
      showToast('Please enter text to translate', 'error', 3000);
      sourceText.focus();
      sourceText.classList.add('shake');
      setTimeout(() => sourceText.classList.remove('shake'), 500);
      return;
    }

    if (text.length > 5000) {
      showToast('Text exceeds 5,000 characters limit', 'error', 3000);
      return;
    }

    // Set Loading UI State
    setLoadingState(true);

    try {
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text: text,
          source_lang: sourceLang.value,
          target_lang: targetLang.value,
          provider: providerSelect ? providerSelect.value : null
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Render translated text
        targetText.textContent = data.translated_text;
        targetText.classList.remove('placeholder-text');
        lastTranslatedSource = text;

        // Update target speech code & detected language
        currentTargetSpeechCode = data.target_speech_code || 'en-US';
        currentDetectedLang = data.detected_language || 'auto';

        // Update Status Bar
        updateStatusBar(data);

        // Update target counters
        updateTargetCounters();

        // Save to History
        saveToHistory({
          id: Date.now().toString(),
          sourceText: text,
          translatedText: data.translated_text,
          sourceLangCode: data.source_language === 'auto' ? data.detected_language : data.source_language,
          sourceLangName: data.detected_language_name || 'Detected',
          sourceFlag: data.detected_language_flag || '🌐',
          targetLangCode: data.target_language,
          targetLangName: data.target_language_name,
          targetFlag: data.target_language_flag || '🌐',
          timestamp: new Date().toISOString()
        });

        showToast(`Translated in ${data.response_time_ms} ms`, 'success', 2500);
      } else {
        const errorMsg = data.error || 'Translation failed. Please try again.';
        showToast(errorMsg, 'error', 4500);
        statusLatency.textContent = 'Failed';
      }
    } catch (err) {
      showToast('Network error while connecting to translator service.', 'error', 4500);
      console.error('Translation Error:', err);
    } finally {
      setLoadingState(false);
    }
  }

  function setLoadingState(isLoading) {
    if (isLoading) {
      translateBtn.disabled = true;
      translateBtn.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i><span>Translating...</span>';
      statusLatency.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
    } else {
      translateBtn.disabled = false;
      translateBtn.innerHTML = '<i class="fas fa-language"></i><span>Translate</span>';
    }
  }

  function updateStatusBar(data) {
    if (statusDetected) {
      statusDetected.textContent = `${data.detected_language_flag || '🌐'} ${data.detected_language_name} (${data.detected_language})`;
    }
    if (statusTarget) {
      statusTarget.textContent = `${data.target_language_flag || '🌐'} ${data.target_language_name} (${data.target_language})`;
    }
    if (statusProvider) {
      statusProvider.textContent = data.provider || 'AI Engine';
    }
    if (statusLatency) {
      statusLatency.textContent = `⏱️ ${data.response_time_ms} ms`;
    }
  }

  translateBtn.addEventListener('click', performTranslation);

  // ==========================================================================
  // 4. SWAP LANGUAGES
  // ==========================================================================
  swapBtn.addEventListener('click', () => {
    if (SpeechModule.isCurrentlyListening()) {
      SpeechModule.stopListening();
    }
    const currentSrc = sourceLang.value;
    const currentTgt = targetLang.value;

    let newSrc = currentTgt;
    let newTgt = currentSrc;

    // If source was 'auto', swap target into source, and pick detected or default for target
    if (currentSrc === 'auto') {
      if (currentDetectedLang && currentDetectedLang !== 'auto') {
        newTgt = currentDetectedLang;
      } else {
        newTgt = 'en';
      }
    }

    sourceLang.value = newSrc;
    targetLang.value = newTgt;

    // Swap text if both exist
    const currentSourceText = sourceText.value.trim();
    const currentTargetText = targetText.textContent.trim();

    if (currentTargetText && !targetText.classList.contains('placeholder-text')) {
      sourceText.value = currentTargetText;
      targetText.textContent = currentSourceText;
      updateSourceCounters();
      updateTargetCounters();
    }

    // Visual button rotation
    swapBtn.style.transform = 'rotate(180deg) scale(1.1)';
    setTimeout(() => {
      swapBtn.style.transform = '';
    }, 300);

    showToast('Languages swapped', 'info', 1800);
  });

  // ==========================================================================
  // 5. COPY & CLEAR ACTIONS
  // ==========================================================================
  copyBtn.addEventListener('click', async () => {
    const textToCopy = targetText.textContent.trim();
    if (!textToCopy || targetText.classList.contains('placeholder-text')) {
      showToast('Nothing to copy yet', 'info', 2000);
      return;
    }

    try {
      await navigator.clipboard.writeText(textToCopy);
      copyBtn.innerHTML = '<i class="fas fa-check"></i>';
      copyBtn.classList.add('copied');
      showToast('Translation copied to clipboard!', 'success', 2000);
      setTimeout(() => {
        copyBtn.innerHTML = '<i class="fas fa-copy"></i>';
        copyBtn.classList.remove('copied');
      }, 2000);
    } catch (err) {
      showToast('Failed to copy text', 'error', 2000);
    }
  });

  copySourceBtn?.addEventListener('click', async () => {
    const textToCopy = sourceText.value.trim();
    if (!textToCopy) {
      showToast('Nothing to copy', 'info', 2000);
      return;
    }
    try {
      await navigator.clipboard.writeText(textToCopy);
      showToast('Source text copied!', 'success', 2000);
    } catch (err) {
      showToast('Failed to copy source text', 'error', 2000);
    }
  });

  clearBtn.addEventListener('click', () => {
    if (SpeechModule.isCurrentlyListening()) {
      SpeechModule.cancelListening();
      voiceBtn.classList.remove('listening');
      voiceBtn.innerHTML = '<i class="fas fa-microphone"></i>';
      voiceBtn.setAttribute('title', 'Voice Input (Microphone)');
      if (liveSpeechBox) liveSpeechBox.style.display = 'none';
      if (voiceStatus) voiceStatus.classList.remove('active');
    }
    sourceText.value = '';
    targetText.innerHTML = '<span class="placeholder-text-inner">Translation will appear here...</span>';
    targetText.classList.add('placeholder-text');
    lastTranslatedSource = '';
    SpeechModule.stopSpeaking();
    updateSourceCounters();
    updateTargetCounters();
    sourceText.focus();
    showToast('Cleared editor', 'info', 1500);
  });

  // ==========================================================================
  // 6. VOICE INPUT (SPEECH-TO-TEXT) CONTROLLER
  // ==========================================================================

  // Map of language codes to BCP-47 speech tags and human-readable names
  const SPEECH_LANG_MAP = {
    'en': { code: 'en-US', name: 'English' },
    'ta': { code: 'ta-IN', name: 'Tamil' },
    'hi': { code: 'hi-IN', name: 'Hindi' },
    'te': { code: 'te-IN', name: 'Telugu' },
    'ml': { code: 'ml-IN', name: 'Malayalam' },
    'kn': { code: 'kn-IN', name: 'Kannada' },
    'fr': { code: 'fr-FR', name: 'French' },
    'de': { code: 'de-DE', name: 'German' },
    'es': { code: 'es-ES', name: 'Spanish' },
    'ja': { code: 'ja-JP', name: 'Japanese' },
    'ko': { code: 'ko-KR', name: 'Korean' },
    'bn': { code: 'bn-IN', name: 'Bengali' },
    'mr': { code: 'mr-IN', name: 'Marathi' },
    'gu': { code: 'gu-IN', name: 'Gujarati' },
    'pa': { code: 'pa-IN', name: 'Punjabi' },
    'ur': { code: 'ur-PK', name: 'Urdu' },
    'or': { code: 'or-IN', name: 'Odia' },
    'as': { code: 'as-IN', name: 'Assamese' },
    'sa': { code: 'sa-IN', name: 'Sanskrit' },
    'ne': { code: 'ne-NP', name: 'Nepali' },
    'si': { code: 'si-LK', name: 'Sinhala' },
    'it': { code: 'it-IT', name: 'Italian' },
    'pt': { code: 'pt-PT', name: 'Portuguese' },
    'ru': { code: 'ru-RU', name: 'Russian' },
    'nl': { code: 'nl-NL', name: 'Dutch' },
    'pl': { code: 'pl-PL', name: 'Polish' },
    'sv': { code: 'sv-SE', name: 'Swedish' },
    'no': { code: 'nb-NO', name: 'Norwegian' },
    'da': { code: 'da-DK', name: 'Danish' },
    'fi': { code: 'fi-FI', name: 'Finnish' },
    'el': { code: 'el-GR', name: 'Greek' },
    'cs': { code: 'cs-CZ', name: 'Czech' },
    'ro': { code: 'ro-RO', name: 'Romanian' },
    'hu': { code: 'hu-HU', name: 'Hungarian' },
    'uk': { code: 'uk-UA', name: 'Ukrainian' },
    'ga': { code: 'ga-IE', name: 'Irish' },
    'ar': { code: 'ar-SA', name: 'Arabic' },
    'zh-CN': { code: 'zh-CN', name: 'Chinese (Simplified)' },
    'zh-TW': { code: 'zh-TW', name: 'Chinese (Traditional)' },
    'tr': { code: 'tr-TR', name: 'Turkish' },
    'fa': { code: 'fa-IR', name: 'Persian' },
    'he': { code: 'he-IL', name: 'Hebrew' },
    'id': { code: 'id-ID', name: 'Indonesian' },
    'ms': { code: 'ms-MY', name: 'Malay' },
    'vi': { code: 'vi-VN', name: 'Vietnamese' },
    'th': { code: 'th-TH', name: 'Thai' },
    'tl': { code: 'tl-PH', name: 'Filipino' },
    'my': { code: 'my-MM', name: 'Burmese' },
    'km': { code: 'km-KH', name: 'Khmer' },
    'sw': { code: 'sw-KE', name: 'Swahili' },
    'am': { code: 'am-ET', name: 'Amharic' },
    'yo': { code: 'yo-NG', name: 'Yoruba' },
    'zu': { code: 'zu-ZA', name: 'Zulu' },
    'af': { code: 'af-ZA', name: 'Afrikaans' }
  };

  /**
   * Determine the exact BCP-47 speech tag and display name for source language.
   */
  function getSpeechLanguageDetails(langCode) {
    if (!langCode || langCode === 'auto') {
      const browserLocale = navigator.language || 'en-US';
      const cleanLocale = browserLocale.split('-')[0];
      const matched = SPEECH_LANG_MAP[cleanLocale] || { name: 'English', code: 'en-US' };
      return {
        code: browserLocale,
        name: `${matched.name} (Auto: ${browserLocale})`,
        isAuto: true
      };
    }

    if (SPEECH_LANG_MAP[langCode]) {
      return {
        code: SPEECH_LANG_MAP[langCode].code,
        name: SPEECH_LANG_MAP[langCode].name,
        isAuto: false
      };
    }

    const selectedOption = sourceLang.options[sourceLang.selectedIndex];
    const speechCode = selectedOption?.dataset?.speech || 'en-US';
    const rawName = selectedOption?.text || langCode;
    const name = rawName.split('(')[0].replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, '').trim() || langCode;

    return {
      code: speechCode,
      name: name,
      isAuto: false
    };
  }

  function handleVoiceInputToggle() {
    // If currently listening, click acts as STOP
    if (SpeechModule.isCurrentlyListening()) {
      if (voiceStatusText) voiceStatusText.textContent = 'Processing speech...';
      SpeechModule.stopListening();
      return;
    }

    // Stop text-to-speech if currently playing
    SpeechModule.stopSpeaking();

    // Snapshot existing source text before recording
    recordingBaseText = sourceText.value;

    const langDetails = getSpeechLanguageDetails(sourceLang.value);

    const started = SpeechModule.startListening({
      langCode: langDetails.code,
      langName: langDetails.name,
      onStart: ({ langCode, langName }) => {
        voiceBtn.classList.add('listening');
        voiceBtn.innerHTML = '<i class="fas fa-stop"></i>';
        voiceBtn.setAttribute('title', 'Stop Listening (Click to finish)');

        if (liveSpeechBox) liveSpeechBox.style.display = 'flex';
        if (liveSpeechLangText) liveSpeechLangText.textContent = `Listening in ${langName}...`;
        if (liveFinalTranscript) liveFinalTranscript.textContent = '';
        if (liveInterimTranscript) liveInterimTranscript.textContent = '';
        if (liveSpeechPlaceholder) liveSpeechPlaceholder.style.display = 'inline';

        if (voiceStatus) voiceStatus.classList.add('active');
        if (voiceStatusText) voiceStatusText.textContent = `🎤 Listening in ${langName}`;

        if (voiceStatusTimer) clearTimeout(voiceStatusTimer);

        if (langDetails.isAuto) {
          showToast(`🎤 Listening in ${langDetails.name}. Select Tamil, Hindi, etc., for native recognition.`, 'info', 3500);
        } else {
          showToast(`🎤 Listening in ${langName}... Speak into microphone`, 'info', 2500);
        }
      },
      onInterim: ({ finalText, interimText }) => {
        if (liveSpeechPlaceholder) {
          liveSpeechPlaceholder.style.display = (finalText || interimText) ? 'none' : 'inline';
        }
        if (liveFinalTranscript) {
          liveFinalTranscript.textContent = finalText;
        }
        if (liveInterimTranscript) {
          liveInterimTranscript.textContent = (finalText ? ' ' : '') + interimText;
        }
      },
      onEnd: ({ finalText, intentional }) => {
        voiceBtn.classList.remove('listening');
        voiceBtn.innerHTML = '<i class="fas fa-microphone"></i>';
        voiceBtn.setAttribute('title', 'Voice Input (Microphone)');

        if (liveSpeechBox) liveSpeechBox.style.display = 'none';

        if (finalText && finalText.trim()) {
          const cleanSpeech = finalText.trim();
          let merged = cleanSpeech;
          if (recordingBaseText && recordingBaseText.trim()) {
            merged = recordingBaseText.trim() + ' ' + cleanSpeech;
          }

          // Place recognized speech into source input box without triggering translation
          sourceText.value = merged;
          updateSourceCounters();

          if (voiceStatusText) {
            voiceStatusText.innerHTML = '<i class="fas fa-check" style="color: var(--accent-emerald);"></i> Voice input complete';
          }
          if (voiceStatus) voiceStatus.classList.add('active');

          voiceStatusTimer = setTimeout(() => {
            if (voiceStatus) voiceStatus.classList.remove('active');
          }, 3500);

          showToast('Voice input complete! Press Translate to translate.', 'success', 3000);
        } else {
          if (voiceStatus) voiceStatus.classList.remove('active');
        }
      },
      onError: (friendlyMsg, rawError, isFatal) => {
        if (isFatal) {
          voiceBtn.classList.remove('listening');
          voiceBtn.innerHTML = '<i class="fas fa-microphone"></i>';
          voiceBtn.setAttribute('title', 'Voice Input (Microphone)');
          if (liveSpeechBox) liveSpeechBox.style.display = 'none';
          if (voiceStatus) voiceStatus.classList.remove('active');
        }
        if (rawError !== 'aborted') {
          showToast(friendlyMsg, 'error', 4500);
        }
      }
    });

    if (!started && !SpeechModule.isRecognitionSupported()) {
      showToast('Speech recognition is not supported in this browser. Please try Google Chrome, Microsoft Edge, or Safari.', 'error', 5000);
    }
  }

  voiceBtn.addEventListener('click', handleVoiceInputToggle);

  cancelSpeechBtn?.addEventListener('click', () => {
    SpeechModule.cancelListening();
    voiceBtn.classList.remove('listening');
    voiceBtn.innerHTML = '<i class="fas fa-microphone"></i>';
    voiceBtn.setAttribute('title', 'Voice Input (Microphone)');
    if (liveSpeechBox) liveSpeechBox.style.display = 'none';
    if (voiceStatus) voiceStatus.classList.remove('active');
    sourceText.value = recordingBaseText;
    updateSourceCounters();
    showToast('Voice recording cancelled', 'info', 1800);
  });

  // Stop active microphone if user changes source language mid-speech
  sourceLang.addEventListener('change', () => {
    if (SpeechModule.isCurrentlyListening()) {
      SpeechModule.stopListening();
      showToast('Stopped microphone recording due to source language change.', 'info', 2500);
    }
  });

  // ==========================================================================
  // 7. TEXT-TO-SPEECH (TTS AUDIO PLAYBACK)
  // ==========================================================================
  ttsBtn.addEventListener('click', () => {
    const textToSpeak = targetText.textContent.trim();
    if (!textToSpeak || targetText.classList.contains('placeholder-text')) {
      showToast('Translate text first to listen', 'info', 2500);
      return;
    }

    // Determine target speech code
    const selected = targetLang.options[targetLang.selectedIndex];
    const speechCode = selected?.dataset?.speech || currentTargetSpeechCode || 'en-US';

    SpeechModule.speakText(
      textToSpeak,
      speechCode,
      () => {
        ttsBtn.classList.add('speaking');
        ttsBtn.innerHTML = '<i class="fas fa-volume-up"></i><div class="sound-wave"><span></span><span></span><span></span></div>';
      },
      () => {
        ttsBtn.classList.remove('speaking');
        ttsBtn.innerHTML = '<i class="fas fa-volume-up"></i>';
      },
      (errMsg) => {
        showToast(errMsg, 'error', 3000);
      }
    );
  });

  // ==========================================================================
  // 8. TRANSLATION HISTORY (LOCALSTORAGE PERSISTENCE)
  // ==========================================================================
  function loadHistory() {
    try {
      const stored = localStorage.getItem(HISTORY_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      console.error('Failed to parse history from localStorage', e);
      return [];
    }
  }

  function saveToHistory(item) {
    const list = loadHistory();
    // Avoid immediate duplicate of identical translation
    if (list.length > 0 && list[0].sourceText === item.sourceText && list[0].targetLangCode === item.targetLangCode) {
      return;
    }
    list.unshift(item);
    // Keep max 25 recent items
    const trimmed = list.slice(0, 25);
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(trimmed));
    renderHistory();
  }

  function renderHistory() {
    const list = loadHistory();
    historyCount.textContent = list.length.toString();

    if (!list || list.length === 0) {
      historyList.innerHTML = `
        <div class="history-empty-state">
          <i class="fas fa-history history-empty-icon"></i>
          <p>No translation history yet.</p>
          <span style="font-size: 0.78rem;">Your recent translations will automatically appear here.</span>
        </div>
      `;
      return;
    }

    historyList.innerHTML = list.map((item, index) => {
      const timeFormatted = formatTime(item.timestamp);
      return `
        <div class="history-item" data-index="${index}">
          <div class="history-content">
            <div class="history-meta">
              <span class="history-lang-badge">
                ${item.sourceFlag} ${item.sourceLangCode.toUpperCase()} ➔ ${item.targetFlag} ${item.targetLangCode.toUpperCase()}
              </span>
              <span class="history-time">• ${timeFormatted}</span>
            </div>
            <div class="history-text-source">${escapeHtml(item.sourceText)}</div>
            <div class="history-text-target">${escapeHtml(item.translatedText)}</div>
          </div>
          <div class="history-actions">
            <button class="icon-btn restore-history-btn" title="Restore in editor" data-index="${index}">
              <i class="fas fa-arrow-up-right-from-square"></i>
            </button>
            <button class="icon-btn copy-history-btn" title="Copy translation" data-index="${index}">
              <i class="fas fa-copy"></i>
            </button>
            <button class="icon-btn delete-history-btn" title="Delete entry" data-index="${index}">
              <i class="fas fa-trash-can"></i>
            </button>
          </div>
        </div>
      `;
    }).join('');

    // Attach event listeners to history buttons
    historyList.querySelectorAll('.restore-history-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const idx = parseInt(btn.dataset.index, 10);
        restoreHistoryItem(idx);
      });
    });

    historyList.querySelectorAll('.copy-history-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const idx = parseInt(btn.dataset.index, 10);
        const item = list[idx];
        if (item) {
          await navigator.clipboard.writeText(item.translatedText);
          showToast('History item copied!', 'success', 2000);
        }
      });
    });

    historyList.querySelectorAll('.delete-history-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const idx = parseInt(btn.dataset.index, 10);
        deleteHistoryItem(idx);
      });
    });
  }

  function restoreHistoryItem(index) {
    const list = loadHistory();
    const item = list[index];
    if (!item) return;

    sourceText.value = item.sourceText;
    targetText.textContent = item.translatedText;
    targetText.classList.remove('placeholder-text');

    if (item.sourceLangCode) sourceLang.value = item.sourceLangCode;
    if (item.targetLangCode) targetLang.value = item.targetLangCode;

    updateSourceCounters();
    updateTargetCounters();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    showToast('Restored translation into editor', 'info', 2000);
  }

  function deleteHistoryItem(index) {
    const list = loadHistory();
    list.splice(index, 1);
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(list));
    renderHistory();
    showToast('Item deleted from history', 'info', 1500);
  }

  clearHistoryBtn?.addEventListener('click', () => {
    const list = loadHistory();
    if (list.length === 0) {
      showToast('History is already empty', 'info', 1500);
      return;
    }
    if (confirm('Are you sure you want to clear your translation history?')) {
      localStorage.removeItem(HISTORY_STORAGE_KEY);
      renderHistory();
      showToast('Translation history cleared', 'info', 2000);
    }
  });

  function formatTime(isoString) {
    if (!isoString) return '';
    try {
      const date = new Date(isoString);
      const now = new Date();
      const diffSec = Math.floor((now - date) / 1000);

      if (diffSec < 60) return 'Just now';
      if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
      if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
      return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    } catch {
      return '';
    }
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // ==========================================================================
  // 9. TOAST NOTIFICATION SYSTEM
  // ==========================================================================
  function showToast(message, type = 'info', duration = 3000) {
    if (!toastContainer) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    let icon = 'info-circle';
    if (type === 'success') icon = 'circle-check';
    if (type === 'error') icon = 'triangle-exclamation';

    toast.innerHTML = `
      <i class="fas fa-${icon}"></i>
      <span>${escapeHtml(message)}</span>
    `;

    toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.animation = 'slide-toast 0.3s cubic-bezier(0.16, 1, 0.3, 1) reverse forwards';
      setTimeout(() => toast.remove(), 300);
    }, duration);
  }

  // ==========================================================================
  // 10. ACCESSIBILITY & KEYBOARD SHORTCUTS
  // ==========================================================================
  document.addEventListener('keydown', (e) => {
    // Ctrl + Enter or Cmd + Enter: Trigger Translate
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      performTranslation();
    }
    // Escape: Clear text if in editor
    if (e.key === 'Escape' && document.activeElement === sourceText) {
      if (sourceText.value) {
        clearBtn.click();
      }
    }
    // Alt + S: Swap languages
    if (e.altKey && (e.key === 's' || e.key === 'S')) {
      e.preventDefault();
      swapBtn.click();
    }
    // Alt + C: Copy translation
    if (e.altKey && (e.key === 'c' || e.key === 'C')) {
      e.preventDefault();
      copyBtn.click();
    }
  });

  // Initialize features
  initTheme();
  updateSourceCounters();
  updateTargetCounters();
  renderHistory();
});
