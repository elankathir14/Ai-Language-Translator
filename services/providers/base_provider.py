from abc import ABC, abstractmethod
from typing import Dict, Any


class BaseTranslationProvider(ABC):
    """
    Abstract base class for modular translation providers.
    Every provider must implement translate() and get_name().
    """

    @abstractmethod
    def get_name(self) -> str:
        """Return the unique name of the provider."""
        pass

    @abstractmethod
    def translate(self, text: str, source_lang: str, target_lang: str) -> Dict[str, Any]:
        """
        Translate text from source_lang to target_lang.

        :param text: Text to translate
        :param source_lang: Source language code (e.g. 'auto', 'en', 'ta')
        :param target_lang: Target language code (e.g. 'ta', 'fr')
        :return: Standardized dictionary:
            {
                "success": bool,
                "translated_text": str,
                "detected_source": str,
                "provider": str,
                "error": str | None
            }
        """
        pass
