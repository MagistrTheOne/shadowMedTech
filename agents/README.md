# LiveKit Agents - Doctor Voice AI Agent

Голосовой AI агент для обучения медицинских представителей.

## Установка

### 1. Создать виртуальное окружение

```bash
python -m venv venv
source venv/bin/activate  # Linux/Mac
# или
venv\Scripts\activate  # Windows
```

### 2. Установить зависимости

```bash
pip install -r requirements.txt
```

### 3. Настроить переменные окружения

Скопируйте `.env.example` в `.env` и заполните:

```bash
cp .env.example .env
```

## Использование

### Development режим

```bash
python doctor_agent.py dev
```

### Production режим

Агент запускается автоматически через Next.js API endpoint `/api/livekit/agents/start`.

Для ручного запуска:

```bash
python start_agent.py <visit_id> <room_name> <doctor_name>
```

## Архитектура

- **STT (Speech-to-Text)**: OpenAI Whisper API (поддержка русского языка)
- **LLM**: GigaChat API (российский LLM)
- **TTS (Text-to-Speech)**: Silero TTS (высококачественный русский голос) или OpenAI TTS

## Компоненты

- `doctor_agent.py` - Основной агент
- `start_agent.py` - Helper для запуска агента
- `requirements.txt` - Python зависимости

## Интеграция с Next.js

Агент автоматически запускается при создании визита через:
- `POST /api/livekit/agents/start` - Запуск агента
- `DELETE /api/livekit/agents/start?visitId=...` - Остановка агента
- `GET /api/livekit/agents/start` - Список активных агентов

## Документация

См. [LiveKit Agents Documentation](https://docs.livekit.io/agents/)

