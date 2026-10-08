import os
import time
from typing import Dict, Any, List
from .providers.google_provider import GoogleTranslationProvider
from .providers.mymemory_provider import MyMemoryTranslationProvider
from .providers.gemini_provider import GeminiTranslationProvider


# Supported language definitions with code, name, native script, flag emoji, category, and speech BCP-47 tag
SUPPORTED_LANGUAGES = [
    # 1. Core & Featured Languages
    {"code": "en", "name": "English", "native": "English", "flag": "🇺🇸", "category": "⭐ Core & Featured", "speech_code": "en-US"},
    {"code": "ta", "name": "Tamil", "native": "தமிழ்", "flag": "🇮🇳", "category": "⭐ Core & Featured", "speech_code": "ta-IN"},
    {"code": "hi", "name": "Hindi", "native": "हिन्दी", "flag": "🇮🇳", "category": "⭐ Core & Featured", "speech_code": "hi-IN"},
    {"code": "te", "name": "Telugu", "native": "తెలుగు", "flag": "🇮🇳", "category": "⭐ Core & Featured", "speech_code": "te-IN"},
    {"code": "ml", "name": "Malayalam", "native": "മലയാളം", "flag": "🇮🇳", "category": "⭐ Core & Featured", "speech_code": "ml-IN"},
    {"code": "kn", "name": "Kannada", "native": "ಕನ್ನಡ", "flag": "🇮🇳", "category": "⭐ Core & Featured", "speech_code": "kn-IN"},
    {"code": "fr", "name": "French", "native": "Français", "flag": "🇫🇷", "category": "⭐ Core & Featured", "speech_code": "fr-FR"},
    {"code": "de", "name": "German", "native": "Deutsch", "flag": "🇩🇪", "category": "⭐ Core & Featured", "speech_code": "de-DE"},
    {"code": "es", "name": "Spanish", "native": "Español", "flag": "🇪🇸", "category": "⭐ Core & Featured", "speech_code": "es-ES"},
    {"code": "ja", "name": "Japanese", "native": "日本語", "flag": "🇯🇵", "category": "⭐ Core & Featured", "speech_code": "ja-JP"},
    {"code": "ko", "name": "Korean", "native": "한국어", "flag": "🇰🇷", "category": "⭐ Core & Featured", "speech_code": "ko-KR"},

    # 2. Indian & South Asian Languages
    {"code": "bn", "name": "Bengali", "native": "বাংলা", "flag": "🇮🇳", "category": "🇮🇳 Indian & South Asian", "speech_code": "bn-IN"},
    {"code": "mr", "name": "Marathi", "native": "मराठी", "flag": "🇮🇳", "category": "🇮🇳 Indian & South Asian", "speech_code": "mr-IN"},
    {"code": "gu", "name": "Gujarati", "native": "ગુજરાતી", "flag": "🇮🇳", "category": "🇮🇳 Indian & South Asian", "speech_code": "gu-IN"},
    {"code": "pa", "name": "Punjabi", "native": "ਪੰਜਾਬੀ", "flag": "🇮🇳", "category": "🇮🇳 Indian & South Asian", "speech_code": "pa-IN"},
    {"code": "ur", "name": "Urdu", "native": "اردو", "flag": "🇵🇰", "category": "🇮🇳 Indian & South Asian", "speech_code": "ur-PK"},
    {"code": "or", "name": "Odia", "native": "ଓଡ଼ିଆ", "flag": "🇮🇳", "category": "🇮🇳 Indian & South Asian", "speech_code": "or-IN"},
    {"code": "as", "name": "Assamese", "native": "অসমীয়া", "flag": "🇮🇳", "category": "🇮🇳 Indian & South Asian", "speech_code": "as-IN"},
    {"code": "sa", "name": "Sanskrit", "native": "संस्कृतम्", "flag": "🇮🇳", "category": "🇮🇳 Indian & South Asian", "speech_code": "sa-IN"},
    {"code": "ne", "name": "Nepali", "native": "नेपाली", "flag": "🇳🇵", "category": "🇮🇳 Indian & South Asian", "speech_code": "ne-NP"},
    {"code": "si", "name": "Sinhala", "native": "සිංහල", "flag": "🇱🇰", "category": "🇮🇳 Indian & South Asian", "speech_code": "si-LK"},

    # 3. European Languages
    {"code": "it", "name": "Italian", "native": "Italiano", "flag": "🇮🇹", "category": "🌍 European Languages", "speech_code": "it-IT"},
    {"code": "pt", "name": "Portuguese", "native": "Português", "flag": "🇵🇹", "category": "🌍 European Languages", "speech_code": "pt-PT"},
    {"code": "ru", "name": "Russian", "native": "Русский", "flag": "🇷🇺", "category": "🌍 European Languages", "speech_code": "ru-RU"},
    {"code": "nl", "name": "Dutch", "native": "Nederlands", "flag": "🇳🇱", "category": "🌍 European Languages", "speech_code": "nl-NL"},
    {"code": "pl", "name": "Polish", "native": "Polski", "flag": "🇵🇱", "category": "🌍 European Languages", "speech_code": "pl-PL"},
    {"code": "sv", "name": "Swedish", "native": "Svenska", "flag": "🇸🇪", "category": "🌍 European Languages", "speech_code": "sv-SE"},
    {"code": "no", "name": "Norwegian", "native": "Norsk", "flag": "🇳🇴", "category": "🌍 European Languages", "speech_code": "nb-NO"},
    {"code": "da", "name": "Danish", "native": "Dansk", "flag": "🇩🇰", "category": "🌍 European Languages", "speech_code": "da-DK"},
    {"code": "fi", "name": "Finnish", "native": "Suomi", "flag": "🇫🇮", "category": "🌍 European Languages", "speech_code": "fi-FI"},
    {"code": "el", "name": "Greek", "native": "Ελληνικά", "flag": "🇬🇷", "category": "🌍 European Languages", "speech_code": "el-GR"},
    {"code": "cs", "name": "Czech", "native": "Čeština", "flag": "🇨🇿", "category": "🌍 European Languages", "speech_code": "cs-CZ"},
    {"code": "ro", "name": "Romanian", "native": "Română", "flag": "🇷🇴", "category": "🌍 European Languages", "speech_code": "ro-RO"},
    {"code": "hu", "name": "Hungarian", "native": "Magyar", "flag": "🇭🇺", "category": "🌍 European Languages", "speech_code": "hu-HU"},
    {"code": "uk", "name": "Ukrainian", "native": "Українська", "flag": "🇺🇦", "category": "🌍 European Languages", "speech_code": "uk-UA"},
    {"code": "ga", "name": "Irish", "native": "Gaeilge", "flag": "🇮🇪", "category": "🌍 European Languages", "speech_code": "ga-IE"},

    # 4. Asian & Middle Eastern Languages
    {"code": "ar", "name": "Arabic", "native": "العربية", "flag": "🇸🇦", "category": "🌏 Asian & Middle Eastern", "speech_code": "ar-SA"},
    {"code": "zh-CN", "name": "Chinese (Simplified)", "native": "简体中文", "flag": "🇨🇳", "category": "🌏 Asian & Middle Eastern", "speech_code": "zh-CN"},
    {"code": "zh-TW", "name": "Chinese (Traditional)", "native": "繁體中文", "flag": "🇹🇼", "category": "🌏 Asian & Middle Eastern", "speech_code": "zh-TW"},
    {"code": "tr", "name": "Turkish", "native": "Türkçe", "flag": "🇹🇷", "category": "🌏 Asian & Middle Eastern", "speech_code": "tr-TR"},
    {"code": "fa", "name": "Persian (Farsi)", "native": "فارسی", "flag": "🇮🇷", "category": "🌏 Asian & Middle Eastern", "speech_code": "fa-IR"},
    {"code": "he", "name": "Hebrew", "native": "עברית", "flag": "🇮🇱", "category": "🌏 Asian & Middle Eastern", "speech_code": "he-IL"},
    {"code": "id", "name": "Indonesian", "native": "Bahasa Indonesia", "flag": "🇮🇩", "category": "🌏 Asian & Middle Eastern", "speech_code": "id-ID"},
    {"code": "ms", "name": "Malay", "native": "Bahasa Melayu", "flag": "🇲🇾", "category": "🌏 Asian & Middle Eastern", "speech_code": "ms-MY"},
    {"code": "vi", "name": "Vietnamese", "native": "Tiếng Việt", "flag": "🇻🇳", "category": "🌏 Asian & Middle Eastern", "speech_code": "vi-VN"},
    {"code": "th", "name": "Thai", "native": "ไทย", "flag": "🇹🇭", "category": "🌏 Asian & Middle Eastern", "speech_code": "th-TH"},
    {"code": "tl", "name": "Filipino (Tagalog)", "native": "Filipino", "flag": "🇵🇭", "category": "🌏 Asian & Middle Eastern", "speech_code": "tl-PH"},
    {"code": "my", "name": "Burmese", "native": "မြန်မာဘာသာ", "flag": "🇲🇲", "category": "🌏 Asian & Middle Eastern", "speech_code": "my-MM"},
    {"code": "km", "name": "Khmer", "native": "ភាសាខ្មែរ", "flag": "🇰🇭", "category": "🌏 Asian & Middle Eastern", "speech_code": "km-KH"},

    # 5. African & Global Languages
    {"code": "sw", "name": "Swahili", "native": "Kiswahili", "flag": "🇰🇪", "category": "🌐 African & Global", "speech_code": "sw-KE"},
    {"code": "am", "name": "Amharic", "native": "አማርኛ", "flag": "🇪🇹", "category": "🌐 African & Global", "speech_code": "am-ET"},
    {"code": "yo", "name": "Yoruba", "native": "Yorùbá", "flag": "🇳🇬", "category": "🌐 African & Global", "speech_code": "yo-NG"},
    {"code": "zu", "name": "Zulu", "native": "isiZulu", "flag": "🇿🇦", "category": "🌐 African & Global", "speech_code": "zu-ZA"},
    {"code": "af", "name": "Afrikaans", "native": "Afrikaans", "flag": "🇿🇦", "category": "🌐 African & Global", "speech_code": "af-ZA"},
]

# Quick lookup by language code
LANGUAGE_MAP = {lang["code"]: lang for lang in SUPPORTED_LANGUAGES}


class TranslatorService:
    """
    Central orchestration service for translations.
    Manages provider configuration, failover logic, caching/timing,
    and validation.
    """

    def __init__(self):
        self.default_provider_name = os.getenv("TRANSLATION_PROVIDER", "google").lower().strip()
        self.providers = {
            "google": GoogleTranslationProvider(),
            "mymemory": MyMemoryTranslationProvider(),
            "gemini": GeminiTranslationProvider()
        }

    def get_supported_languages(self) -> List[Dict[str, str]]:
        """Return the curated list of supported languages."""
        return SUPPORTED_LANGUAGES

    def get_grouped_languages(self) -> Dict[str, List[Dict[str, str]]]:
        """Return supported languages organized by geographic/feature categories."""
        groups: Dict[str, List[Dict[str, str]]] = {}
        for lang in SUPPORTED_LANGUAGES:
            cat = lang.get("category", "Other")
            if cat not in groups:
                groups[cat] = []
            groups[cat].append(lang)
        return groups

    def get_language_info(self, code: str) -> Dict[str, str]:
        """Return metadata for a language code, or a fallback object."""
        if not code:
            return {"code": "auto", "name": "Auto Detect", "native": "Auto", "flag": "🌐", "speech_code": "en-US"}
        code = code.lower().strip()
        if code in LANGUAGE_MAP:
            return LANGUAGE_MAP[code]
        # Match base code if exact match not found (e.g., zh vs zh-CN)
        for c, info in LANGUAGE_MAP.items():
            if c.startswith(code) or code.startswith(c.split("-")[0]):
                return info
        return {"code": code, "name": code.upper(), "native": code, "flag": "🌐", "speech_code": f"{code}-{code.upper()}"}

    def translate_text(self, text: str, source_lang: str, target_lang: str, preferred_provider: str = None) -> Dict[str, Any]:
        """
        Translate input text with timing, validation, and automatic failover.
        """
        start_time = time.time()

        # Step 1: Input Validation
        if not text or not text.strip():
            return {
                "success": False,
                "error": "Input text cannot be empty. Please enter text to translate.",
                "translated_text": "",
                "source_language": source_lang or "auto",
                "target_language": target_lang,
                "detected_language": source_lang or "auto",
                "detected_language_name": "Unknown",
                "response_time_ms": 0
            }

        text = text.strip()
        if len(text) > 5000:
            return {
                "success": False,
                "error": "Text exceeds the 5,000 character limit. Please shorten your text.",
                "translated_text": "",
                "source_language": source_lang,
                "target_language": target_lang,
                "detected_language": source_lang,
                "detected_language_name": "Unknown",
                "response_time_ms": 0
            }

        target = target_lang.strip() if target_lang else "en"
        source = source_lang.strip() if source_lang else "auto"

        # Determine primary provider
        primary_name = (preferred_provider or self.default_provider_name).lower()
        if primary_name not in self.providers:
            primary_name = "google"

        primary_provider = self.providers[primary_name]

        # Step 2: Attempt primary provider
        result = primary_provider.translate(text, source, target)

        # Step 3: Automatic Failover if primary fails
        if not result.get("success"):
            fallback_order = ["google", "mymemory", "gemini"]
            for fb_name in fallback_order:
                if fb_name == primary_name:
                    continue
                fb_provider = self.providers[fb_name]
                # Skip Gemini if no API key is present
                if fb_name == "gemini" and not os.getenv("GEMINI_API_KEY"):
                    continue
                fb_result = fb_provider.translate(text, source, target)
                if fb_result.get("success"):
                    result = fb_result
                    break

        elapsed_ms = int((time.time() - start_time) * 1000)

        # Step 4: Resolve detected language info
        raw_detected = result.get("detected_source") or source
        detected_info = self.get_language_info(raw_detected)

        # Calculate character and word counts
        char_count = len(text)
        word_count = len(text.split())

        target_info = self.get_language_info(target)

        return {
            "success": result.get("success", False),
            "translated_text": result.get("translated_text", ""),
            "source_language": source,
            "target_language": target,
            "target_language_name": target_info.get("name", target),
            "target_language_flag": target_info.get("flag", "🌐"),
            "target_speech_code": target_info.get("speech_code", "en-US"),
            "detected_language": raw_detected,
            "detected_language_name": detected_info.get("name", raw_detected),
            "detected_language_flag": detected_info.get("flag", "🌐"),
            "provider": result.get("provider", primary_provider.get_name()),
            "response_time_ms": elapsed_ms,
            "character_count": char_count,
            "word_count": word_count,
            "error": result.get("error")
        }
