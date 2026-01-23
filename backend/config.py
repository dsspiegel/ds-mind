import os
from dotenv import load_dotenv

load_dotenv()

GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
GOOGLE_CLOUD_PROJECT = os.getenv("GOOGLE_CLOUD_PROJECT")
GEMINI_DISTILL_MODEL = os.getenv("GEMINI_DISTILL_MODEL", "gemini-3-flash-preview")

# Gemini API Key validation
if not GOOGLE_API_KEY:
    print("WARNING: GOOGLE_API_KEY not found in environment variables.")
