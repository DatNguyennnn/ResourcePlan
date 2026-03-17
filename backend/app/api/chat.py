from fastapi import APIRouter, Request
from app.config import settings
import httpx

router = APIRouter(prefix="/api/chat", tags=["chat"])

# Fallback models: if primary fails (rate limit, token exceeded), try next
MODELS = [
    "llama-3.3-70b-versatile",   # Primary - best quality
    "llama-3.1-8b-instant",      # Fallback 1 - fast, lightweight
    "gemma2-9b-it",              # Fallback 2 - alternative
]


@router.post("/")
async def chat_proxy(request: Request):
    """Proxy chat requests to Groq API with automatic model fallback."""
    body = await request.json()

    if not settings.GROQ_API_KEY:
        return {"error": "GROQ_API_KEY not configured"}

    # Try each model in order until one succeeds
    last_error = None
    for model in MODELS:
        try:
            body["model"] = model
            async with httpx.AsyncClient(timeout=60.0) as client:
                resp = await client.post(
                    "https://api.groq.com/openai/v1/chat/completions",
                    headers={
                        "Content-Type": "application/json",
                        "Authorization": f"Bearer {settings.GROQ_API_KEY}",
                    },
                    json=body,
                )
                data = resp.json()

                # If Groq returned an error, try next model
                if "error" in data:
                    last_error = data
                    continue

                return data
        except Exception:
            continue

    # All models failed - return last error or generic
    return last_error or {"error": "All models failed. Please try again later."}
