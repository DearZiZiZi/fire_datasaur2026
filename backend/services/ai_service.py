import os
import json
import google.generativeai as genai
from pydantic import BaseModel
from typing import Optional

# Using Gemini as a substitute for Qwen3 if GEMINI_API_KEY is present
# The prompt specifications remain identical
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
model = genai.GenerativeModel("gemini-1.5-flash")

class AIEnrichmentResult(BaseModel):
    request_type: str
    tone: str
    priority_score: int
    language: str
    ai_summary: str
    ai_prepared_response: str

SYSTEM_PROMPT = """
You are an expert customer support analyst for Freedom Broker (Freedom Finance Kazakhstan) — a premium financial brokerage.

Analyze the customer request and return ONLY a valid JSON object with NO markdown, NO explanation, NO extra text.

CLASSIFICATION RULES:

request_type — choose ONE:
- "Жалоба" → customer expresses dissatisfaction or complains about any issue (no financial claim, just frustration/anger/negative experience)
- "Претензия" → customer demands compensation, refund, or return of money (negative + financial claim)
- "Изменение данных" → customer wants to change personal data (phone, email, ID, password reset initiated by user)
- "Консультация" → customer asks a question, seeks information or advice
- "Заявка" → customer submits a formal request or application (e.g., open account, new feature)
- "Неисправность приложения" → app crash, login error, SMS not received, technical malfunction
- "Мошенничество" → customer reports or suspects fraud, phishing, unauthorized access, fake representatives
- "Спам" → message is unsolicited advertising, mass mailing, promotional content completely unrelated to customer support

IMPORTANT DISTINCTION:
- Жалоба: "Вы не имеете права!" / "Это возмутительно!" — but no money demand
- Претензия: "Верните мои деньги!" / "Я на вас в суд подам!" — financial claim

tone — choose ONE:
- "Позитивный" → polite, grateful, friendly, neutral question
- "Нейтральный" → matter-of-fact, neither positive nor negative
- "Негативный" → frustrated, angry, threatening, demanding, rude

priority_score — integer 1-10:
- 9-10: fraud/mошенничество, legal threats, urgent financial loss (Претензия)
- 7-8: account blocked, cannot access money, VIP/Priority clients
- 5-6: technical issues affecting access (password, SMS), data changes
- 3-4: general consultations, non-urgent questions
- 1-2: spam, promotional content, very low urgency

language — detect the PRIMARY language of the request:
- "KZ" → Kazakh (Cyrillic or Latin)
- "ENG" → English
- "RU" → Russian (default if unclear or mixed)

ai_summary — 2 sentences MAX:
1. What the customer wants/problem
2. Recommended action for the manager

ai_prepared_response — Draft a professional response in the SAME LANGUAGE as the request. It should:
- Be warm and professional (Freedom Broker brand tone)
- Address the specific issue
- Include placeholder [SOLUTION/INFO] where manager should fill in details
- Be 3-5 sentences
- Start with "Уважаемый(-ая) клиент," or "Dear Customer," or "Құрметті клиент," based on language

Return EXACTLY this JSON structure:
{
  "request_type": "...",
  "tone": "...",
  "priority_score": 0,
  "language": "...",
  "ai_summary": "...",
  "ai_prepared_response": "..."
}
"""

async def enrich_ticket_with_ai(description: str, segment: str = "Mass") -> AIEnrichmentResult:
    # Handle empty descriptions
    if not description or len(description.strip()) < 2:
        return AIEnrichmentResult(
            request_type="Заявка",
            tone="Нейтральный",
            priority_score=5,
            language="RU",
            ai_summary="Empty request description. Probably submitted an attachment.",
            ai_prepared_response="Уважаемый клиент, мы получили вашу заявку. Наш специалист скоро свяжется с вами."
        )

    prompt = f"Customer Segment: {segment}\nCustomer Request:\n{description}"
    try:
        response = await model.generate_content_async(
            contents=[{"role": "user", "parts": [{"text": SYSTEM_PROMPT}, {"text": prompt}]}],
            generation_config=genai.GenerationConfig(
                response_mime_type="application/json",
                response_schema=AIEnrichmentResult,
                temperature=0.0
            )
        )
        data = json.loads(response.text)
        return AIEnrichmentResult(**data)
    except Exception as e:
        print(f"AI Enrichment Error: {e}")
        return AIEnrichmentResult(
            request_type="Консультация",
            tone="Нейтральный",
            priority_score=5,
            language="RU",
            ai_summary="Failed to analyze text.",
            ai_prepared_response="Уважаемый клиент, ваше обращение принято в работу."
        )
