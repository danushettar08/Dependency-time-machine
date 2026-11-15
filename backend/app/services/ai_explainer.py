import os
import requests

from dotenv import load_dotenv


# Load backend/.env
BASE_DIR = os.path.dirname(
    os.path.dirname(os.path.dirname(__file__))
)

ENV_PATH = os.path.join(BASE_DIR, ".env")

load_dotenv(ENV_PATH)


def explain_dependency_risks(risk_analysis):

    api_key = os.getenv("OPENROUTER_API_KEY")

    if not api_key:
        return {
            "status": "error",
            "message": "OpenRouter API key is missing."
        }

    model = os.getenv(
        "OPENROUTER_MODEL",
        "openai/gpt-4o-mini"
    )

    prompt = f"""
You are an experienced software dependency security analyst.

Analyze these dependency upgrade risk results:

{risk_analysis}

Explain everything in simple language.

Include these sections:

1. Overall Summary
2. High-Risk Dependencies
3. Medium-Risk Dependencies
4. Low-Risk Dependencies
5. Recommended Upgrade Order
6. Important Precautions

Important instructions:

- Explain why each dependency has its risk level.
- Do not claim that an upgrade will definitely break an application.
- Distinguish estimated upgrade risk from confirmed vulnerabilities.
- Give practical recommendations.
- Keep the explanation beginner-friendly.
"""

    try:

        url = "https://openrouter.ai/api/v1/chat/completions"

        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": "http://localhost:5173",
            "X-Title": "Dependency Time Machine"
        }

        payload = {
            "model": model,
            "messages": [
                {
                    "role": "system",
                    "content": (
                        "You are a professional software "
                        "dependency risk analyst."
                    )
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            "temperature": 0.3,
            "max_tokens": 1200
        }

        response = requests.post(
            url,
            headers=headers,
            json=payload,
            timeout=90
        )

        response.raise_for_status()

        result = response.json()

        explanation = (
            result["choices"][0]["message"]["content"]
        )

        if not explanation:
            raise ValueError(
                "OpenRouter returned an empty explanation."
            )

        return {
            "status": "success",
            "ai_explanation": explanation
        }

    except requests.exceptions.Timeout:

        return {
            "status": "error",
            "message": "OpenRouter request timed out."
        }

    except requests.exceptions.RequestException as error:

        return {
            "status": "error",
            "message": f"OpenRouter API request failed: {str(error)}"
        }

    except Exception as error:

        return {
            "status": "error",
            "message": f"AI explanation failed: {str(error)}"
        }