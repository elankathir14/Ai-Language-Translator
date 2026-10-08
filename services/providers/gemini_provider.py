import os
import requests
from typing import Dict, Any
from .base_provider import BaseTranslationProvider


class GeminiTranslationProvider(BaseTranslationProvider):
    """
    Modular Google Gemini AI Translation Provider.
    Uses Gemini API for high-fidelity, nuanced contextual translations.
    Activated when GEMINI_API_KEY is provided or TRANSLATION_PROVIDER=gemini.
    """

    def __init__(self, api_key: str = None):
        self.api_key = api_key or os.getenv("GEMINI_API_KEY", "").strip()
        self.session = requests.Session()

    def get_name(self) -> str:
        return "Google Gemini AI (1.5 Flash)"

    def translate(self, text: str, source_lang: str, target_lang: str) -> Dict[str, Any]:
        if not self.api_key:
            return {
                "success": False,
                "translated_text": "",
                "detected_source": source_lang,
                "provider": self.get_name(),
                "error": "Gemini API key is not configured in .env (GEMINI_API_KEY)."
            }

        if not text or not text.strip():
            return {
                "success": False,
                "translated_text": "",
                "detected_source": source_lang,
                "provider": self.get_name(),
                "error": "Input text cannot be empty."
            }

        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={self.api_key}"

        prompt = (
            f"You are a professional language translator. "
            f"Translate the following text accurately into target language code '{target_lang}'. "
            f"Source language is '{source_lang}' (if 'auto', detect it accurately). "
            f"Output ONLY the translated text without explanations, prefixes, or quotes.\n\n"
            f"Text to translate:\n{text}"
        )

        payload = {
            "contents": [
                {
                    "parts": [
                        {"text": prompt}
                    ]
                }
            ],
            "generationConfig": {
                "temperature": 0.2,
                "maxOutputTokens": 2048
            }
        }

        try:
            response = self.session.post(url, json=payload, timeout=15)
            if response.status_code == 200:
                data = response.json()
                candidates = data.get("candidates", [])
                if candidates:
                    parts = candidates[0].get("content", {}).get("parts", [])
                    if parts:
                        translated = parts[0].get("text", "").strip()
                        return {
                            "success": True,
                            "translated_text": translated,
                            "detected_source": source_lang,
                            "provider": self.get_name(),
                            "error": None
                        }

            return {
                "success": False,
                "translated_text": "",
                "detected_source": source_lang,
                "provider": self.get_name(),
                "error": f"Gemini API returned error ({response.status_code}): {response.text}"
            }
        except Exception as e:
            return {
                "success": False,
                "translated_text": "",
                "detected_source": source_lang,
                "provider": self.get_name(),
                "error": f"Gemini translation failed: {str(e)}"
            }
