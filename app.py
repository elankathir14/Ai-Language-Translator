import os
from flask import Flask, render_template, request, jsonify
from dotenv import load_dotenv
from services.translator_service import TranslatorService

# Load environment variables from .env file
load_dotenv()

app = Flask(__name__)
app.config["SECRET_KEY"] = os.getenv("SECRET_KEY", "codealpha_ai_translator_default_key")

# Initialize Translator Service
translator_service = TranslatorService()


@app.route("/")
def index():
    """
    Render main AI Language Translator interface.
    Passes supported languages and current provider configuration to template.
    """
    languages = translator_service.get_supported_languages()
    grouped_languages = translator_service.get_grouped_languages()
    current_provider = os.getenv("TRANSLATION_PROVIDER", "google").lower()
    return render_template(
        "index.html",
        languages=languages,
        grouped_languages=grouped_languages,
        current_provider=current_provider
    )


@app.route("/api/languages", methods=["GET"])
def get_languages():
    """Return JSON list of supported languages."""
    return jsonify({
        "success": True,
        "languages": translator_service.get_supported_languages()
    })


@app.route("/api/translate", methods=["POST"])
def translate():
    """
    Translate text endpoint.
    Expects JSON: { "text": str, "source_lang": str, "target_lang": str, "provider"?: str }
    """
    data = request.get_json(silent=True) or {}
    text = data.get("text", "")
    source_lang = data.get("source_lang", "auto")
    target_lang = data.get("target_lang", "en")
    preferred_provider = data.get("provider", None)

    # Validate input
    if not text or not str(text).strip():
        return jsonify({
            "success": False,
            "error": "Input text cannot be empty. Please type or speak words to translate.",
            "translated_text": "",
            "source_language": source_lang,
            "target_language": target_lang
        }), 400

    if not target_lang:
        return jsonify({
            "success": False,
            "error": "Target language must be selected.",
            "translated_text": "",
            "source_language": source_lang,
            "target_language": target_lang
        }), 400

    # Perform translation via service
    result = translator_service.translate_text(
        text=str(text),
        source_lang=str(source_lang),
        target_lang=str(target_lang),
        preferred_provider=preferred_provider
    )

    status_code = 200 if result.get("success") else 500
    return jsonify(result), status_code


@app.route("/api/health", methods=["GET"])
def health():
    """Service health check endpoint."""
    return jsonify({
        "status": "healthy",
        "service": "AI Language Translator",
        "internship": "CodeAlpha Artificial Intelligence Internship",
        "provider": os.getenv("TRANSLATION_PROVIDER", "google"),
        "languages_count": len(translator_service.get_supported_languages())
    })


@app.errorhandler(404)
def not_found(e):
    if request.path.startswith("/api/"):
        return jsonify({"success": False, "error": "Endpoint not found"}), 404
    return render_template("index.html", languages=translator_service.get_supported_languages()), 404


@app.errorhandler(500)
def server_error(e):
    if request.path.startswith("/api/"):
        return jsonify({"success": False, "error": "Internal server error"}), 500
    return render_template("index.html", languages=translator_service.get_supported_languages()), 500


if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    debug_mode = os.getenv("FLASK_DEBUG", "1") == "1"
    print(f"* AI Language Translator starting on http://127.0.0.1:{port} (Debug: {debug_mode})")
    app.run(host="0.0.0.0", port=port, debug=debug_mode)
