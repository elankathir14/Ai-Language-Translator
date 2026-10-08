import os
import requests
from typing import Dict, Any
from .base_provider import BaseTranslationProvider


class GoogleTranslationProvider(BaseTranslationProvider):
    """
    Modular Google Translation Provider.
    Supports:
    - Official Google Cloud Translation API if GOOGLE_TRANSLATE_API_KEY is provided.
    - Free Google Translate GTX service endpoint when no API key is supplied.
    """

    def __init__(self, api_key: str = None):
        self.api_key = api_key or os.getenv("GOOGLE_TRANSLATE_API_KEY", "").strip()
        self.session = requests.Session()
        self.session.headers.update({
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
        })

    def get_name(self) -> str:
        return "Google Translate (Cloud / GTX)"

    def translate(self, text: str, source_lang: str, target_lang: str) -> Dict[str, Any]:
        if not text or not text.strip():
            return {
                "success": False,
                "translated_text": "",
                "detected_source": source_lang,
                "provider": self.get_name(),
                "error": "Input text cannot be empty."
            }

        # Normalize source language for auto detection
        src = "auto" if not source_lang or source_lang.lower() in ("auto", "detect") else source_lang.lower()
        tgt = target_lang.lower().strip()

        # Route 1: Official Cloud Translation API if an API key is configured
        if self.api_key:
            return self._translate_with_cloud_api(text, src, tgt)

        # Route 2: High-reliability Google GTX endpoint
        return self._translate_with_gtx(text, src, tgt)

    def _translate_with_cloud_api(self, text: str, src: str, tgt: str) -> Dict[str, Any]:
        try:
            url = "https://translation.googleapis.com/language/translate/v2"
            params = {
                "key": self.api_key,
                "q": text,
                "target": tgt,
                "format": "text"
            }
            if src != "auto":
                params["source"] = src

            response = self.session.post(url, json=params, timeout=12)
            if response.status_code == 200:
                data = response.json()
                translations = data.get("data", {}).get("translations", [])
                if translations:
                    first = translations[0]
                    translated_text = first.get("translatedText", "")
                    detected_source = first.get("detectedSourceLanguage", src)
                    return {
                        "success": True,
                        "translated_text": translated_text,
                        "detected_source": detected_source,
                        "provider": "Google Cloud Translation API",
                        "error": None
                    }

            return {
                "success": False,
                "translated_text": "",
                "detected_source": src,
                "provider": "Google Cloud Translation API",
                "error": f"API error ({response.status_code}): {response.text}"
            }
        except Exception as e:
            # Fall back to GTX endpoint if Cloud API fails or key is invalid
            fallback = self._translate_with_gtx(text, src, tgt)
            if fallback["success"]:
                fallback["provider"] = "Google Translate (GTX Fallback)"
                return fallback
            return {
                "success": False,
                "translated_text": "",
                "detected_source": src,
                "provider": "Google Cloud Translation API",
                "error": str(e)
            }

    def _translate_with_gtx(self, text: str, src: str, tgt: str) -> Dict[str, Any]:
        try:
            url = "https://translate.googleapis.com/translate_a/single"
            params = {
                "client": "gtx",
                "sl": src,
                "tl": tgt,
                "dt": "t",
                "q": text
            }
            response = self.session.get(url, params=params, timeout=12)

            if response.status_code == 200:
                data = response.json()
                # data[0] contains pairs of [translated_segment, original_segment]
                segments = data[0] if data and len(data) > 0 else []
                translated_segments = []
                for seg in segments:
                    if seg and len(seg) > 0 and seg[0]:
                        translated_segments.append(seg[0])

                translated_text = "".join(translated_segments) if translated_segments else ""

                # data[2] or data[1] usually holds the detected source language
                detected_source = src
                if len(data) > 2 and isinstance(data[2], str) and data[2]:
                    detected_source = data[2]
                elif len(data) > 1 and isinstance(data[1], str) and data[1]:
                    detected_source = data[1]

                return {
                    "success": True,
                    "translated_text": translated_text,
                    "detected_source": detected_source,
                    "provider": "Google Translate (GTX Engine)",
                    "error": None
                }

            return {
                "success": False,
                "translated_text": "",
                "detected_source": src,
                "provider": "Google Translate (GTX Engine)",
                "error": f"Translation request failed with HTTP status {response.status_code}"
            }
        except requests.exceptions.Timeout:
            return {
                "success": False,
                "translated_text": "",
                "detected_source": src,
                "provider": "Google Translate (GTX Engine)",
                "error": "Translation service timed out. Please check your internet connection."
            }
        except Exception as e:
            return {
                "success": False,
                "translated_text": "",
                "detected_source": src,
                "provider": "Google Translate (GTX Engine)",
                "error": f"Google translation failed: {str(e)}"
            }
