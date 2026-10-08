import os
import requests
from typing import Dict, Any
from .base_provider import BaseTranslationProvider


class MyMemoryTranslationProvider(BaseTranslationProvider):
    """
    Modular MyMemory Translation Provider.
    Free API with 5,000 to 50,000 words/day allowance.
    Optional API Key or Email from environment variables.
    """

    def __init__(self, api_key: str = None, email: str = None):
        self.api_key = api_key or os.getenv("MYMEMORY_API_KEY", "").strip()
        self.email = email or os.getenv("MYMEMORY_EMAIL", "").strip()
        self.session = requests.Session()
        self.session.headers.update({
            "User-Agent": "CodeAlpha-AI-Translator/1.0"
        })

    def get_name(self) -> str:
        return "MyMemory Translated API"

    def translate(self, text: str, source_lang: str, target_lang: str) -> Dict[str, Any]:
        if not text or not text.strip():
            return {
                "success": False,
                "translated_text": "",
                "detected_source": source_lang,
                "provider": self.get_name(),
                "error": "Input text cannot be empty."
            }

        src = "auto" if not source_lang or source_lang.lower() in ("auto", "detect") else source_lang.lower()
        tgt = target_lang.lower().strip()

        # MyMemory langpair requires 'src|tgt', e.g. 'en|es' or 'autodetect|es'
        langpair = f"{src}|{tgt}" if src != "auto" else f"autodetect|{tgt}"

        try:
            url = "https://api.mymemory.translated.net/get"
            params = {
                "q": text,
                "langpair": langpair
            }
            if self.api_key:
                params["key"] = self.api_key
            if self.email:
                params["de"] = self.email

            response = self.session.get(url, params=params, timeout=12)

            if response.status_code == 200:
                data = response.json()
                res_data = data.get("responseData", {})
                translated = res_data.get("translatedText", "")
                status = data.get("responseStatus", 200)

                # MyMemory returns status 200 even for some warnings/quota limits
                if status == 200 and translated:
                    detected_src = src
                    # Check matches for detected language if available
                    matches = data.get("matches", [])
                    if matches and len(matches) > 0:
                        detected_src = matches[0].get("segment", {}).get("lang", src)

                    return {
                        "success": True,
                        "translated_text": translated,
                        "detected_source": detected_src,
                        "provider": self.get_name(),
                        "error": None
                    }
                else:
                    return {
                        "success": False,
                        "translated_text": "",
                        "detected_source": src,
                        "provider": self.get_name(),
                        "error": data.get("responseDetails", f"Status {status} returned by MyMemory")
                    }

            return {
                "success": False,
                "translated_text": "",
                "detected_source": src,
                "provider": self.get_name(),
                "error": f"MyMemory API returned HTTP status {response.status_code}"
            }

        except requests.exceptions.Timeout:
            return {
                "success": False,
                "translated_text": "",
                "detected_source": src,
                "provider": self.get_name(),
                "error": "MyMemory API timed out."
            }
        except Exception as e:
            return {
                "success": False,
                "translated_text": "",
                "detected_source": src,
                "provider": self.get_name(),
                "error": f"MyMemory translation failed: {str(e)}"
            }
