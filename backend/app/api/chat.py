from fastapi import APIRouter, Request
from app.config import settings
import httpx

router = APIRouter(prefix="/api/chat", tags=["chat"])


@router.post("/")
async def chat_proxy(request: Request):
    """Proxy chat requests to Groq API so the API key stays server-side."""
    body = await request.json()

    if not settings.GROQ_API_KEY:
        return {"error": "GROQ_API_KEY not configured"}

    async with httpx.AsyncClient(timeout=60.0) as client:
        resp = await client.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {settings.GROQ_API_KEY}",
            },
            json=body,
        )
        return resp.json()
