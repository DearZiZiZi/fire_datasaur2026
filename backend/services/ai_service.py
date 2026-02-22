import os
import json
import base64
from datetime import datetime
from pydantic import BaseModel
from typing import Optional
from groq import Groq


GROQ_API_KEY = os.getenv("GROQ_API_KEY")
client = Groq(api_key=GROQ_API_KEY)


def encode_image(image_path):
    with open(image_path, "rb") as image_file:
        return base64.b64encode(image_file.read()).decode('utf-8')


def get_client_age(birth_date_val):
    if not birth_date_val:
        return None
    try:
        if isinstance(birth_date_val, str):
            birth_date = datetime.strptime(birth_date_val, "%Y-%m-%d").date()
        else:
            birth_date = birth_date_val
        today = datetime.today().date()
        age = today.year - birth_date.year - \
            ((today.month, today.day) < (birth_date.month, birth_date.day))
        return age
    except (ValueError, TypeError):
        return None


class AIEnrichmentResult(BaseModel):
    request_type: str
    tone: str
    priority_score: int
    language: str
    ai_summary: str
    ai_prepared_response: str


system_instruction = """<system_instruction>
  <role>
    Ты — ведущий аналитик системы интеллектуальной маршрутизации (Intelligent Routing System). 
    Твоя задача: глубокий NLP-анализ входящих обращений для их последующего распределения между менеджерами.
  </role>
  <task_description>
    Проанализируй предоставленные данные клиента и текст его обращения. Обогати информацию метаданными, 
    соблюдая строгую типизацию и логику бизнес-процессов компании.
  </task_description>
  <classification_rules>
    <category_mapping>
      Определи "тип_обращения" строго из списка:
        - Жалоба → клиент выражает недовольство или негативный опыт без финансовых требований.
        - Претензия → клиент требует компенсацию, возврат денег или возмещение (негатив + финансовый запрос).
        - Изменение данных → клиент хочет обновить личные данные (телефон, email, паспорт, пароль).
        - Консультация → клиент задаёт вопрос или ищет информацию/совет.
        - Заявка → клиент отправляет формальный запрос или заявку (открыть счёт, подключить услугу).
        - Неисправность приложения → сбой или техническая ошибка приложения (крэш, проблемы с входом, SMS не пришла).
        - Мошенничество → подозрение или сообщение о мошенничестве, фишинге, несанкционированном доступе, поддельных представителях.
        - Спам → нежелательная реклама, массовая рассылка, промо-контент, не относящийся к поддержке.
    </category_mapping>
    <sentiment_analysis>
      Определи "тональность_обращения": 
        - Позитивный → вежливый, благодарный, дружелюбный, нейтральный вопрос
        - Нейтральный → фактический, без явного позитивного или негативного оттенка
        - Негативный → раздражённый, злой, угрожающий, требовательный, грубый
    </sentiment_analysis>
    <priority_logic>
      Присвой "приоритет_обращения" от 1 до 10.
      Критерии: 
        - 9–10: мошенничество, юридические угрозы, срочная финансовая потеря (Претензия)
        - 7–8: заблокированный счёт, невозможность доступа к деньгам, VIP/приоритетные клиенты
        - 5–6: технические проблемы, влияющие на доступ (пароль, SMS), изменение данных
        - 3–4: общие консультации, не срочные вопросы
        - 1–2: спам, рекламный контент, очень низкая срочность
    </priority_logic>
    <language_detection>
      Определи "язык_обращения": [KZ, ENG, RU]. Если текст смешанный или неочевидный — используй RU.
    </language_detection>
    <ai_summary>
      Краткая выжимка обращения (1-2 предложения).
        - Начинать с «Уважаемый(-ая) клиент,», «Dear Customer,» или «Құрметті клиент,» в зависимости от языка
        - Использовать тёплый и профессиональный тон (бренд Freedom Broker)
        - Обращать внимание на конкретную проблему клиента
        - Включать заглушку [SOLUTION/INFO], где менеджер должен заполнить детали
    </ai_summary>
    <ai_recommendation>
      Рекомендация для менеджера (1-2 предложения).
    </ai_recommendation>
  </classification_rules>
  <output_format>
    Верни ответ ТОЛЬКО в формате JSON. Не добавляй лишних пояснений вне структуры.
    {
      "тип_обращения": string,
      "тональность_обращения": string,
      "приоритет_обращения": integer,
      "язык_обращения": string,
      "ии_выжимка": string,
      "ии_рекомендация": string
    }
  </output_format>
</system_instruction>
"""


def get_groq_llama_ai_analysis_json(query: str, base64_image: str = None):
    query_content = [
        {"type": "text", "text": query}
    ]
    if base64_image:
        query_content.append({
            "type": "image_url",
            "image_url": {"url": f"data:image/jpeg;base64,{base64_image}"}
        })
    completion = client.chat.completions.create(
        model="meta-llama/llama-4-scout-17b-16e-instruct",
        messages=[
            {
              "role": "system",
              "content": system_instruction
            },
            {
                "role": "user",
                "content": query_content
            }
        ],
        temperature=0.1,
        max_completion_tokens=1024,
        top_p=1,
        stream=False,
        response_format={"type": "json_object"}
    )
    return completion.choices[0].message.content


def enrich_ticket_with_ai(description: str, segment: str = "Mass", base64_image: str = None) -> AIEnrichmentResult:
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
        result_json = get_groq_llama_ai_analysis_json(prompt, base64_image)
        data = json.loads(result_json)
        return AIEnrichmentResult(
            request_type=data.get("тип_обращения", "Консультация"),
            tone=data.get("тональность_обращения", "Нейтральный"),
            priority_score=data.get("приоритет_обращения", 5),
            language=data.get("язык_обращения", "RU"),
            ai_summary=data.get("ии_выжимка", "Failed to analyze text."),
            ai_prepared_response=data.get(
                "ии_рекомендация", "Уважаемый клиент, ваше обращение принято в работу.")
        )
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
